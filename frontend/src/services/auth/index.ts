import { createAuthClient } from 'better-auth/react';
import { API_BASE_URL } from '@/services/api';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL || window.location.origin,
  fetchOptions: { credentials: 'include' },
});
