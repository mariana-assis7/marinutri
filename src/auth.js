import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-icy-pond-ac0gshlr.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

export const authClient = createAuthClient(neonAuthUrl, {
  adapter: BetterAuthReactAdapter(),
  fetchOptions: {
    credentials: 'include',
  },
});

