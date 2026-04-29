import { z } from 'zod'
import { protectedProcedure, publicProcedure, router } from '../trpc'
import { supabase, getProfileByAuthId } from '../lib/supabase'

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        displayName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            display_name: input.displayName,
          },
        },
      })
      
      if (error) throw new Error(error.message)
      
      return {
        user: data.user,
        session: data.session,
      }
    }),
  
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      })
      
      if (error) throw new Error(error.message)
      
      const profile = await getProfileByAuthId(data.user.id)
      
      return {
        user: data.user,
        profile,
        session: data.session,
      }
    }),
  
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new Error('Not authenticated')
    }
    
    return {
      user: {
        id: ctx.userId,
      },
      profile: ctx.profile,
    }
  }),
  
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    return { success: true }
  }),
  
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
        appMode: z.enum(['common', 'deeply', 'both']).optional(),
        zodiacSign: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: input.displayName,
          avatar_url: input.avatarUrl,
          app_mode: input.appMode,
          zodiac_sign: input.zodiacSign,
        })
        .eq('auth_id', ctx.userId)
        .select()
        .single()
      
      if (error) throw error
      
      return data
    }),
})
