// A visit is open until the member checks out, or this long after checking in (people forget).
export const OPEN_VISIT_MS = 12 * 60 * 60 * 1000;

export const openVisitSince = (now: Date): Date =>
  new Date(now.getTime() - OPEN_VISIT_MS);

export const openVisitWhere = (clientId: string, now: Date) => ({
  clientId,
  checkedOutAt: null,
  checkedInAt: { gte: openVisitSince(now) },
});
