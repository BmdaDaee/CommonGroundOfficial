import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { INTERVENTION_TYPES } from '../utils/constants'

export const helpRouter = router({
  getInterventionTypes: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) throw new Error('Not authenticated')
      return INTERVENTION_TYPES
    }),

  getSuggestions: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      context: z.string().max(500).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      return INTERVENTION_TYPES.map(type => ({
        ...type,
        suggestion: `Use ${type.id} intervention when: ${type.description}`,
      }))
    }),

  contact: protectedProcedure
    .input(z.object({
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(2000),
      category: z.enum(['bug', 'feedback', 'help', 'other']).default('other'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      return {
        success: true,
        ticketId: `HELP-${Date.now()}`,
        message: "Your message has been received. We'll be in touch soon.",
      }
    }),
})
