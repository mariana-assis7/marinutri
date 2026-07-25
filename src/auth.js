import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

export const authClient = createAuthClient('https://ep-icy-pond-ac0gshlr.neonauth.sa-east-1.aws.neon.tech/neondb/auth', {
  adapter: BetterAuthReactAdapter(),
});
