import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createFetchContext } from '../../apps/api/src/router'

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)

  if (url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return fetchRequestHandler({
    endpoint: '/.netlify/functions/trpc',
    req,
    router: appRouter,
    createContext: createFetchContext,
    onError: ({ error, path }) => {
      console.error(`TRPC error at ${path}:`, error)
    },
  })
}
