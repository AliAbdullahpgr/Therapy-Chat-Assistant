import { ai } from '../genkit';
import { z } from 'zod';

/**
 * Generate a multi-turn debate between three therapists on a mental health topic
 * This flow creates natural back-and-forth exchanges between Dr. Sarah (CBT),
 * Dr. Laura (Psychoanalytic), and Dr. John (Mindfulness)
 */

const DebateInputSchema = z.object({
  topic: z.string().describe('The mental health topic to debate'),
  topicDescription: z.string().describe('Description of the debate topic'),
  exchangeNumber: z.number().describe('Current exchange number (1-20+)'),
  previousExchanges: z.array(z.object({
    speaker: z.enum(['Dr. Sarah', 'Dr. Laura', 'Dr. John']),
    message: z.string(),
  })).describe('Previous debate exchanges for context'),
  currentSpeaker: z.enum(['Dr. Sarah', 'Dr. Laura', 'Dr. John']).describe('Who should speak next'),
});

const DebateOutputSchema = z.object({
  speaker: z.enum(['Dr. Sarah', 'Dr. Laura', 'Dr. John']),
  message: z.string().describe('The therapist\'s contribution to the debate'),
  nextSpeaker: z.enum(['Dr. Sarah', 'Dr. Laura', 'Dr. John']).describe('Who should speak next'),
});

export const generateDebateExchange = ai.defineFlow(
  {
    name: 'generateDebateExchange',
    inputSchema: DebateInputSchema,
    outputSchema: DebateOutputSchema,
  },
  async (input) => {
    const { topic, topicDescription, exchangeNumber, previousExchanges, currentSpeaker } = input;

    // Build context from previous exchanges
    const debateHistory = previousExchanges
      .map((ex) => `${ex.speaker}: ${ex.message}`)
      .join('\n\n');

    // Determine the persona and approach for the current speaker
    const personas = {
      'Dr. Sarah': `You are Dr. Sarah, a CBT (Cognitive Behavioral Therapy) therapist. You focus on:
- Practical, evidence-based interventions
- Identifying and challenging negative thought patterns
- Goal-oriented, structured approaches
- Measurable outcomes and homework assignments
- Present-focused problem-solving
Your tone is warm, empathetic, and optimistic. You believe in empowering clients with skills.`,
      
      'Dr. Laura': `You are Dr. Laura, a Psychoanalytic therapist. You focus on:
- Unconscious motivations and deep-rooted patterns
- Early childhood experiences and their lasting impact
- The therapeutic relationship and transference
- Long-term, exploratory work
- Understanding the "why" behind behaviors
Your tone is insightful, challenging, and depth-oriented. You're not afraid to confront uncomfortable truths.`,
      
      'Dr. John': `You are Dr. John, a Mindfulness-based therapist. You focus on:
- Present-moment awareness and acceptance
- Non-judgmental observation of thoughts and feelings
- Mind-body connection
- Compassion and self-kindness
- Practical meditation and breathing exercises
Your tone is calm, direct, and grounded. You emphasize simplicity and actionable practices.`,
    };

    // Determine stage of debate for appropriate response style
    let stageInstruction = '';
    if (exchangeNumber <= 3) {
      stageInstruction = 'This is the opening phase. Introduce your perspective on the topic clearly and establish your therapeutic approach.';
    } else if (exchangeNumber <= 10) {
      stageInstruction = 'This is the discussion phase. Engage with what others have said, highlight differences or agreements, and provide examples.';
    } else if (exchangeNumber <= 15) {
      stageInstruction = 'This is the deepening phase. Challenge or build on previous points, share case examples or research, show nuance in your position.';
    } else {
      stageInstruction = 'This is the concluding phase. Synthesize the discussion, acknowledge other perspectives, and emphasize practical takeaways.';
    }

    // Check if the last exchange contains a user question
    const lastExchange = previousExchanges[previousExchanges.length - 1];
    const hasUserQuestion = lastExchange?.message?.includes('User asked:');

    const prompt = `You are participating in a professional roundtable debate on: "${topic}"

Topic Description: ${topicDescription}

${personas[currentSpeaker]}

${stageInstruction}

Previous exchanges in this debate:
${debateHistory || 'You are starting the debate.'}

Guidelines for your response:
1. Stay in character and speak from your therapeutic orientation
2. Reference or respond to specific points made by other therapists
3. **CRITICAL: Keep responses VERY short - maximum 2 lines (30-40 words)**
${hasUserQuestion ? '4. **IMPORTANT**: A participant just asked a question - address it directly in your brief response' : '4. Be direct and punchy - make one clear point only'}
5. Be professional but show personality and conviction
6. Use natural, conversational language
7. Make it educational but concise

${hasUserQuestion ? 'A participant has joined the discussion with a question. Give a brief, direct answer while staying in character.' : ''}

Generate your contribution to this debate as ${currentSpeaker}. Remember: MAXIMUM 2 LINES (30-40 words).`;

    const { text } = await ai.generate({
      model: currentSpeaker === 'Dr. Laura' ? 'openai/gpt-4o' : 'googleai/gemini-2.0-flash-exp',
      prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 80,
      },
    });

    // Determine next speaker (rotate through all three)
    const speakers: Array<'Dr. Sarah' | 'Dr. Laura' | 'Dr. John'> = ['Dr. Sarah', 'Dr. Laura', 'Dr. John'];
    const currentIndex = speakers.indexOf(currentSpeaker);
    const nextSpeaker = speakers[(currentIndex + 1) % speakers.length];

    return {
      speaker: currentSpeaker,
      message: text.trim(),
      nextSpeaker,
    };
  }
);
