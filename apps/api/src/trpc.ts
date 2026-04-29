import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import superjson from 'superjson'
import { getUserFromToken, getProfileByAuthId, getUserPairs } from './lib/supabase'

// Context type
export interface TRPCContext {
  userId: string | null
  authToken: string | null
  profile: any | null
  userPairs: string[] | null
  mode: 'common' | 'deeply'
}

// Express middleware to create context
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TRPCContext> {
  const authHeader = opts.req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')
  
  let userId: string | null = null
  let profile: any = null
  let userPairs: string[] | null = null
  let mode: 'common' | 'deeply' = 'common'
  
  if (token) {
    try {
      const user = await getUserFromToken(token)
      userId = user.id
      
      // Get profile
      profile = await getProfileByAuthId(user.id)
      mode = profile.app_mode === 'deeply' ? 'deeply' : 'common'
      
      // Get user's pairs
      userPairs = await getUserPairs(user.id)
    } catch (error) {
      // Token invalid, but we allow unauthenticated requests to some endpoints
      console.error('Auth error:', error)
    }
  }
  
  return {
    userId,
    authToken: token || null,
    profile,
    userPairs,
    mode,
  }
}

// Initialize TRPC
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

// Middleware for protected routes
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      profile: ctx.profile,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
