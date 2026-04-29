import express from 'express'
import cors from 'cors'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createContext, router } from './trpc'
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
import { trustRouter } from './routers/trust'
import { helpRouter } from './routers/help'

// Merge all routers
const appRouter = router({
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
  trust: trustRouter,
  help: helpRouter,
})

export type AppRouter = typeof appRouter

// Create Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// TRPC routes
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`TRPC error at ${path}:`, error)
    },
  })
)

// Start server
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`AxM API running on http://localhost:${PORT}`)
  console.log(`TRPC endpoint: http://localhost:${PORT}/trpc`)
})
