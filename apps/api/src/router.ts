import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { router } from './trpc'
import { authRouter } from './routers/auth'
import { pairsRouter } from './routers/pairs'
import { messagesRouter } from './routers/messages'
import { relationalEngineRouter } from './routers/relational-engine'
import { bentlyRouter } from './routers/bently'
import { dailyQuestionsRouter } from './routers/dailyQuestions'
import { missionsRouter } from './routers/missions'
import { sparksRouter } from './routers/sparks'
import { exercisesRouter } from './routers/exercises'
import { vaultRouter } from './routers/vault'
import { astrologyRouter } from './routers/astrology'
import { quizRouter } from './routers/quiz'
import { journalRouter } from './routers/journal'
import { listsRouter } from './routers/lists'
import { calendarRouter } from './routers/calendar'
import { profileRouter } from './routers/profile'
import { rankingsRouter } from './routers/rankings'
import { achievementsRouter } from './routers/achievements'
import { growthRouter } from './routers/growth'
import { growthModulesRouter } from './routers/growthModules'
import { trustRouter } from './routers/trust'
import { helpRouter } from './routers/help'
import { deeplyUsRouter } from './routers/deeplyUs'
import { personalityRouter } from './routers/personality'
import { getUserFromToken, getProfileByAuthId, getUserPairs } from './lib/supabase'

export const appRouter = router({
  auth: authRouter,
  pairs: pairsRouter,
  messages: messagesRouter,
  relationalEngine: relationalEngineRouter,
  bently: bentlyRouter,
  dailyQuestions: dailyQuestionsRouter,
  missions: missionsRouter,
  sparks: sparksRouter,
  exercises: exercisesRouter,
  vault: vaultRouter,
  astrology: astrologyRouter,
  quiz: quizRouter,
  journal: journalRouter,
  lists: listsRouter,
  calendar: calendarRouter,
  profile: profileRouter,
  rankings: rankingsRouter,
  achievements: achievementsRouter,
  growth: growthRouter,
  growthModules: growthModulesRouter,
  trust: trustRouter,
  help: helpRouter,
  deeplyUs: deeplyUsRouter,
  personality: personalityRouter,
})

export type AppRouter = typeof appRouter

export async function createFetchContext(opts: FetchCreateContextFnOptions) {
  const token = opts.req.headers.get('authorization')?.replace('Bearer ', '')

  let userId: string | null = null
  let profile: any = null
  let userPairs: string[] | null = null
  let mode: 'common' | 'deeply' = 'common'

  if (token) {
    try {
      const user = await getUserFromToken(token)
      userId = user.id
      profile = await getProfileByAuthId(user.id)
      mode = profile.app_mode === 'deeply' ? 'deeply' : 'common'
      userPairs = await getUserPairs(user.id)
    } catch (error) {
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
