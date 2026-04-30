import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { supabase } from './supabase';

// Use a generic AppRouter type to avoid hard coupling with backend
// Replace with the actual import when the monorepo type is available:
// import type { AppRouter } from '@axm/api';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppRouter = any;

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/trpc';

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: apiUrl,
      async headers() {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          return {
            Authorization: `Bearer ${session.access_token}`,
          };
        }
        return {};
      },
    }),
  ],
});
