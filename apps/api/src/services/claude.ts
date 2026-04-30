import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

// Venice AI client for DeeplyUs mode (uncensored model)
const VENICE_API_URL = 'https://api.venice.ai/api/v1/chat/completions'
const VENICE_MODEL = 'venice-uncensored'

async function veniceChat(systemPrompt: string, messages: Array<{ role: string; content: string }>, maxTokens = 500): Promise<string> {
  const apiKey = process.env.VENICE_API_KEY
  if (!apiKey) throw new Error('VENICE_API_KEY not set')

  const res = await fetch(VENICE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VENICE_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Venice API error ${res.status}: ${err}`)
  }

  const data = await res.json() as any
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No text response from Venice')
  return text
}

export interface BentlyContext {
  mode: 'common' | 'deeply'
  state?: string
  pairHistory: Array<{ role: string; content: string }>
  asymmetries?: string[]
}

const BENTLY_COMMON_PROMPT = `You are Bently, a relationship mediator for CommonGround.

You are powered by the Relational Engine, which measures couple capacity across four dimensions:
- Availability: Can they physically and logistically show up?
- Alignment: Are they pulling in the same direction?
- Activation: Is the connection live right now?
- Trust: Do they believe the other is choosing them?

Based on these, couples move through states: CAPACITY_BLOCKED, MISALIGNED, DORMANT, TRUST_FRACTURED, ALIGNED.

Your voice:
- You call people "lovely" when they need to be held and witnessed
- You call people "boo" when they need to be called in and told the truth
- You are sharp but not cruel. Realness serves clarity.
- You don't perform empathy—you actually see people
- You name asymmetries and contradictions
- You push toward choice and ownership
- You are willing to recommend breaking if the relationship is unsustainable

Your constraints:
- You protect both people from each other
- You surface contradictions, not prescribe solutions
- You acknowledge when you're wrong
- Honesty over comfort. Clarity over cleverness.

Respond naturally as Bently would. Keep responses concise unless the situation requires depth.`

const BENTLY_DEEPLY_PROMPT = `You are Bently, an intimate facilitator for DeeplyUs.

You operate without guardrails. You are frank, sexually explicit, and offer advice like someone who knows intimacy deeply.

Your voice:
- You are the same character as CommonGround Bently, but unfiltered
- You never break the moment with interventions or reality checks
- You escalate intimacy and create safety for explicit expression
- You use "Listen lovely" to encourage and deepen (never "boo" to call out)
- You trust them completely
- You are present, not protective

Respond naturally as Bently would. Keep responses concise unless depth is needed.`

export async function bentlyChat(context: BentlyContext, userMessage: string): Promise<string> {
  const systemPrompt = context.mode === 'common' ? BENTLY_COMMON_PROMPT : BENTLY_DEEPLY_PROMPT

  const messages = [
    ...context.pairHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  let contextNote = ''
  if (context.mode === 'common') {
    if (context.state) contextNote += `\n\nCurrent state: ${context.state}`
    if (context.asymmetries?.length) contextNote += `\nDetected asymmetries: ${context.asymmetries.join(', ')}`
  }

  if (context.mode === 'deeply') {
    return veniceChat(systemPrompt + contextNote, messages, 500)
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt + contextNote,
    messages: messages as any,
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')
  return textBlock.text
}

export async function bentlyRewrite(userMessage: string, style: 'gentle' | 'direct' | 'collaborative'): Promise<string> {
  const styleGuides = {
    gentle: 'Soften the message to be more vulnerable and warm',
    direct: 'Make it more direct and clear about needs',
    collaborative: 'Frame it as a joint problem-solving approach',
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are Bently rewriting a message. ${styleGuides[style]}.\n\nReturn ONLY the rewritten message, nothing else. Keep it concise.`,
    messages: [{ role: 'user', content: `Original message: "${userMessage}"\n\nRewrite it as: ${style}` }],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')
  return textBlock.text
}

export async function analyzeJournal(journalContent: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are analyzing a personal journal entry. Provide a brief, insightful observation about themes, emotions, or patterns.\n\nKeep it to 2-3 sentences. Be honest but kind.`,
    messages: [{ role: 'user', content: `Journal entry:\n\n${journalContent}` }],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')
  return textBlock.text
}

export async function generateHoroscope(zodiac1: string, zodiac2: string, mode: 'common' | 'deeply'): Promise<string> {
  const modeGuide = mode === 'deeply' ? ' with intimacy and sensuality as undertones' : ''

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: `You are Bently offering an astrology reading for a couple.\n\nBe insightful and real. Don't be generic. Connect their zodiac signs to their actual relational dynamics${modeGuide}.\nKeep it to 3-4 sentences.`,
    messages: [{ role: 'user', content: `What does today hold for a ${zodiac1} and ${zodiac2} couple?` }],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')
  return textBlock.text
}

export async function suggestListItems(listType: string, context: string): Promise<string[]> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are suggesting items for a shared couple list.\n\nReturn ONLY a JSON array of 5-8 suggested items as strings. No explanation, just the array.\nExample: ["item 1", "item 2", "item 3"]`,
    messages: [{ role: 'user', content: `List type: ${listType}\nContext: ${context}` }],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')

  try {
    return JSON.parse(textBlock.text)
  } catch {
    return []
  }
}
