// A member may paste the whole join link (`https://.../join/<code>`) or only the code.
export const extractJoinCode = (value: string): string => {
  const path = value.trim().split(/[?#]/)[0] ?? '';
  const segments = path.split('/').filter((segment) => segment !== '');
  return segments[segments.length - 1] ?? '';
};
