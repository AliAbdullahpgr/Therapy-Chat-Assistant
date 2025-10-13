'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a mental health debate topic.
 *
 * The flow `generateDebateTopic` takes no input and returns a string representing a debate topic.
 * - `DebateTopicOutput` - The string output of the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DebateTopicOutputSchema = z.string().describe('A mental health debate topic.');
export type DebateTopicOutput = z.infer<typeof DebateTopicOutputSchema>;

export async function generateDebateTopic(): Promise<DebateTopicOutput> {
  return generateDebateTopicFlow({});
}

const prompt = ai.definePrompt({
  name: 'generateDebateTopicPrompt',
  output: {schema: DebateTopicOutputSchema},
  prompt: `You are a debate topic generator for mental health discussions.
  Generate a single, focused debate topic related to mental health.  The topic should be phrased as a question. Do not include any introduction or conclusion. Just the debate topic.  The debate topic should be able to be debated by 3 AI therapists with different views for 5-7 minutes.`,
});

const generateDebateTopicFlow = ai.defineFlow(
  {
    name: 'generateDebateTopicFlow',
    outputSchema: DebateTopicOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
