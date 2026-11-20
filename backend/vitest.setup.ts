// Many test files wipe their tables in afterAll, which runs even when a beforeEach guard fails.
// Refuse to start at all unless the connection points at the test database.
if (!process.env.DATABASE_URL?.includes('gym_app_test')) {
  throw new Error(
    'Tests must run against the gym_app_test database (use `npm test`, which loads .env.test).'
  );
}
