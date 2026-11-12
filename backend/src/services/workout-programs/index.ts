import type {
  Exercise as ExerciseRow,
  WorkoutDay as DayRow,
  WorkoutProgram as ProgramRow,
} from '@prisma/client';
import { NotFoundError } from '@/errors';
import { uploadService } from '@/services/uploads';
import type { TenantContext } from '@/tenant/context';
import type { WorkoutProgram } from '@gym/shared/types';
import type { WorkoutProgramInput } from '@gym/shared/validation/workout-programs';

type ProgramWithDays = ProgramRow & {
  days: (DayRow & { exercises: ExerciseRow[] })[];
};

const withDays = {
  days: {
    orderBy: { dayNumber: 'asc' as const },
    include: { exercises: { orderBy: { position: 'asc' as const } } },
  },
};

const toDto = (row: ProgramWithDays): WorkoutProgram => ({
  id: row.id,
  gymId: row.gymId,
  name: row.name,
  level: row.level,
  description: row.description,
  imageUrl: row.imageUrl,
  sessionsPerWeek: row.sessionsPerWeek,
  days: row.days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    focus: day.focus,
    exercises: day.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      icon: exercise.icon,
      imageUrl: exercise.imageUrl,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight.toNumber(),
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
    })),
  })),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

type Tx = Pick<TenantContext['db'], 'workoutDay' | 'exercise'>;

// Days and exercises are replaced wholesale on every save, inside the caller's transaction.
const writeDays = async (
  tx: Tx,
  ctx: TenantContext,
  programId: string,
  days: WorkoutProgramInput['days']
): Promise<void> => {
  for (const [index, day] of days.entries()) {
    const created = await tx.workoutDay.create({
      data: {
        gymId: ctx.gymId,
        programId,
        dayNumber: index + 1,
        focus: day.focus || `Day ${index + 1}`,
      },
    });
    if (day.exercises.length > 0) {
      await tx.exercise.createMany({
        data: day.exercises.map((exercise, position) => ({
          gymId: ctx.gymId,
          dayId: created.id,
          position,
          name: exercise.name,
          icon: exercise.icon,
          imageUrl: uploadService.requireOwnImage(ctx, exercise.imageUrl),
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight.toFixed(2),
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
        })),
      });
    }
  }
};

const requireProgram = async (
  ctx: TenantContext,
  id: string
): Promise<WorkoutProgram> => {
  const row = await ctx.db.workoutProgram.findFirst({
    where: { id },
    include: withDays,
  });
  if (!row) {
    throw new NotFoundError('Workout program not found.');
  }
  return toDto(row);
};

export const workoutProgramService = {
  async list(ctx: TenantContext): Promise<WorkoutProgram[]> {
    const rows = await ctx.db.workoutProgram.findMany({
      include: withDays,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  },

  async create(
    ctx: TenantContext,
    input: WorkoutProgramInput
  ): Promise<WorkoutProgram> {
    const id = await ctx.db.$transaction(async (tx) => {
      const program = await tx.workoutProgram.create({
        data: {
          gymId: ctx.gymId,
          name: input.name,
          level: input.level,
          description: input.description,
          imageUrl: uploadService.requireOwnImage(ctx, input.imageUrl),
          sessionsPerWeek: input.sessionsPerWeek,
        },
      });
      await writeDays(tx, ctx, program.id, input.days);
      return program.id;
    });
    return requireProgram(ctx, id);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: WorkoutProgramInput
  ): Promise<WorkoutProgram> {
    await ctx.db.$transaction(async (tx) => {
      const updated = await tx.workoutProgram.updateMany({
        where: { id },
        data: {
          name: input.name,
          level: input.level,
          description: input.description,
          // Leaving the cover out of the request keeps the current one.
          ...(input.imageUrl === undefined
            ? {}
            : { imageUrl: uploadService.requireOwnImage(ctx, input.imageUrl) }),
          sessionsPerWeek: input.sessionsPerWeek,
        },
      });
      if (updated.count === 0) {
        throw new NotFoundError('Workout program not found.');
      }
      // Deleting the days cascades to their exercises.
      await tx.workoutDay.deleteMany({ where: { programId: id } });
      await writeDays(tx, ctx, id, input.days);
    });
    return requireProgram(ctx, id);
  },

  async remove(ctx: TenantContext, id: string): Promise<void> {
    const result = await ctx.db.workoutProgram.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundError('Workout program not found.');
    }
  },
};
