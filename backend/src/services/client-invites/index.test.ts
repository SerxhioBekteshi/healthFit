import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from 'better-auth/crypto';
import { NotFoundError } from '@/errors';
import { sendMail } from '@/mail';
import { clientInviteService } from '@/services/client-invites';
import { clientService } from '@/services/clients';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';

vi.mock('@/mail', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));

const prisma = new PrismaClient();
const visitor = { db: prisma };

let gymAId: string;
let gymBId: string;

const adminContext = (gymId: string): TenantContext => ({
  user: {
    id: `admin-${gymId}`,
    email: `admin-${gymId}@test.dev`,
    name: 'Admin',
    role: 'gym_admin',
    gymId,
  },
  role: 'gym_admin',
  gymId,
  clientId: null,
  db: createTenantDb(prisma, gymId),
});

const newClient = (ctx: TenantContext) =>
  clientService.create(ctx, {
    fullName: 'Ilir Invited',
    email: 'Ilir@Test.dev',
    phone: '+355 69 000 1111',
    gender: 'male',
  });

const wipe = async (): Promise<void> => {
  await prisma.clientInvite.deleteMany();
  await prisma.client.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  gymAId = (await prisma.gym.create({ data: { name: 'Gym A', country: 'IT' } }))
    .id;
  gymBId = (await prisma.gym.create({ data: { name: 'Gym B' } })).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('clients without a password', () => {
  it('are created without a login and show as invited', async () => {
    const created = await newClient(adminContext(gymAId));
    expect(created.hasLogin).toBe(false);
    expect(await prisma.account.count()).toBe(0);
  });

  it('show a login once they accept their invite', async () => {
    const admin = adminContext(gymAId);
    const created = await newClient(admin);
    const invite = await clientInviteService.issue(admin, created.id);
    await clientInviteService.accept(visitor, invite.token, 'Password123!');

    const listed = await clientService.list(admin);
    expect(listed.map((client) => client.hasLogin)).toEqual([true]);
  });
});

describe('clientInviteService', () => {
  it('lets the client set a password once with the link', async () => {
    const admin = adminContext(gymAId);
    const client = await newClient(admin);
    const invite = await clientInviteService.issue(admin, client.id);

    expect(await clientInviteService.preview(visitor, invite.token)).toEqual({
      clientName: 'Ilir Invited',
      email: 'ilir@test.dev',
      gymName: 'Gym A',
      gymCountry: 'IT',
    });

    await clientInviteService.accept(visitor, invite.token, 'Password123!');

    const account = await prisma.account.findFirstOrThrow({
      where: { user: { email: 'ilir@test.dev' }, providerId: 'credential' },
    });
    expect(
      await verifyPassword({
        hash: account.password ?? '',
        password: 'Password123!',
      })
    ).toBe(true);
    expect((await clientService.get(admin, client.id)).hasLogin).toBe(true);

    await expect(
      clientInviteService.accept(visitor, invite.token, 'Another123!')
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      clientInviteService.preview(visitor, invite.token)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('stores only a hash of the token', async () => {
    const admin = adminContext(gymAId);
    const client = await newClient(admin);
    const invite = await clientInviteService.issue(admin, client.id);

    const stored = await prisma.clientInvite.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(invite.token);
    expect(JSON.stringify(stored)).not.toContain(invite.token);
  });

  it('expires after seven days', async () => {
    const admin = adminContext(gymAId);
    const client = await newClient(admin);
    const issued = new Date('2026-11-01T10:00:00Z');
    const invite = await clientInviteService.issue(admin, client.id, issued);
    expect(invite.expiresAt).toBe('2026-11-08T10:00:00.000Z');

    const late = new Date('2026-11-08T10:00:01Z');
    await expect(
      clientInviteService.preview(visitor, invite.token, late)
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      clientInviteService.accept(visitor, invite.token, 'Password123!', late)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await prisma.account.count()).toBe(0);
  });

  it('replaces the earlier link and resets an existing password', async () => {
    const admin = adminContext(gymAId);
    const client = await newClient(admin);
    const firstSetup = await clientInviteService.issue(admin, client.id);
    await clientInviteService.accept(visitor, firstSetup.token, 'Password123!');
    const first = await clientInviteService.issue(admin, client.id);
    const second = await clientInviteService.issue(admin, client.id);

    await expect(
      clientInviteService.preview(visitor, first.token)
    ).rejects.toBeInstanceOf(NotFoundError);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'ilir@test.dev' },
    });
    await prisma.session.create({
      data: {
        userId: user.id,
        token: 'old-session',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await clientInviteService.accept(visitor, second.token, 'NewPassword456!');
    const account = await prisma.account.findFirstOrThrow({
      where: { userId: user.id, providerId: 'credential' },
    });
    expect(
      await verifyPassword({
        hash: account.password ?? '',
        password: 'NewPassword456!',
      })
    ).toBe(true);
    expect(await prisma.account.count({ where: { userId: user.id } })).toBe(1);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it('only issues links for clients of the caller gym', async () => {
    const client = await newClient(adminContext(gymAId));
    await expect(
      clientInviteService.issue(adminContext(gymBId), client.id)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await prisma.clientInvite.count()).toBe(0);
  });

  it('rejects an unknown token', async () => {
    await expect(
      clientInviteService.preview(visitor, 'not-a-token')
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('clientInviteService.sendByEmail', () => {
  beforeEach(() => {
    vi.mocked(sendMail).mockClear();
  });

  it('emails the live link to the client, built by the server', async () => {
    const admin = adminContext(gymAId);
    const client = await newClient(admin);
    const invite = await clientInviteService.issue(admin, client.id);

    const sent = await clientInviteService.sendByEmail(
      admin,
      client.id,
      invite.token
    );
    expect(sent).toEqual({ sentTo: 'ilir@test.dev' });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(mail.to).toBe('ilir@test.dev');
    expect(mail.text).toContain(`/invite/${invite.token}`);
  });

  it('refuses another gym, a wrong, replaced or used token', async () => {
    const admin = adminContext(gymAId);
    const client = await newClient(admin);
    const first = await clientInviteService.issue(admin, client.id);
    const second = await clientInviteService.issue(admin, client.id);

    await expect(
      clientInviteService.sendByEmail(
        adminContext(gymBId),
        client.id,
        second.token
      )
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      clientInviteService.sendByEmail(admin, client.id, 'not-a-token')
    ).rejects.toBeInstanceOf(NotFoundError);
    // A newer link replaced the first one.
    await expect(
      clientInviteService.sendByEmail(admin, client.id, first.token)
    ).rejects.toBeInstanceOf(NotFoundError);

    await clientInviteService.accept(visitor, second.token, 'Password123!');
    await expect(
      clientInviteService.sendByEmail(admin, client.id, second.token)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
