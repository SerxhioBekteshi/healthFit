import { Prisma } from '@prisma/client';

const MAX_ATTEMPTS = 3;

// Serializable transactions can abort under contention (P2034); safe to retry from the start.
export const retryOnConflict = async <T>(run: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const isWriteConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034';
      if (!isWriteConflict || attempt >= MAX_ATTEMPTS) {
        throw error;
      }
    }
  }
};
