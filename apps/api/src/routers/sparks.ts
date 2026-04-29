import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { supabase } from '../lib/supabase'
import { awardXP } from '../services/xp'
import { SPARK_GAMES } from '../utils/constants'

export const sparksRouter = router({
  play: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const game = SPARK_GAMES.find(g => g.id === input.gameId)
      if (!game) throw new Error('Game not found')

      return { gameId: game.id, title: game.title, xp: game.xp }
    }),

  recordScore: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
        gameId: z.string(),
        score: z.number().int().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const game = SPARK_GAMES.find(g => g.id === input.gameId)
      if (!game) throw new Error('Game not found')

      const { error } = await supabase.from('spark_sessions').insert({
        pair_id: input.pairId,
        profile_id: ctx.userId,
        game_id: input.gameId,
        score: input.score,
        xp_awarded: game.xp,
        played_at: new Date().toISOString(),
      })

      if (error) throw error

      const totalXp = await awardXP(ctx.userId, game.xp)

      return { gameId: input.gameId, xpAwarded: game.xp, totalXp }
    }),

  getLeaderboard: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      const { data: isMember } = await supabase
        .from('pair_members')
        .select('*')
        .eq('pair_id', input.pairId)
        .eq('profile_id', ctx.userId)

      if (!isMember?.length) throw new Error('Not a member of this pair')

      const { data: scores } = await supabase
        .from('spark_sessions')
        .select('profile_id, game_id, score, played_at')
        .eq('pair_id', input.pairId)
        .order('score', { ascending: false })
        .limit(20)

      return scores || []
    }),
})
