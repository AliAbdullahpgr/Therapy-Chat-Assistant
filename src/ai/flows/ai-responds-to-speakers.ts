'use server';
/**
 * @fileOverview Implements a Genkit flow for AI to respond to other AI speakers in a discussion.
 *
 * - aiRespondsToSpeakers - A function that takes the conversation history and personas, and generates a response for a specified speaker.
 * - AIRespondsToSpeakersInput - The input type for the aiRespondsToSpeakers function.
 * - AIRespondsToSpeakersOutput - The return type for the aiRespondsToSpeakers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIRespondsToSpeakersInputSchema = z.object({
  conversationHistory: z.array(z.object({
    speaker: z.string().describe('The name of the speaker (Dr. Chen, Dr. Williams, Dr. Rodriguez, or User).'),
    message: z.string().describe('The content of the message spoken by the speaker.'),
  })).describe('The history of the conversation so far.'),
  currentSpeaker: z.string().describe('The name of the AI speaker who should respond (Dr. Chen, Dr. Williams, or Dr. Rodriguez).'),
  drChenPersona: z.string().describe('The defined persona of Dr. Chen.'),
  drWilliamsPersona: z.string().describe('The defined persona of Dr. Williams.'),
  drRodriguezPersona: z.string().describe('The defined persona of Dr. Rodriguez.'),
});
export type AIRespondsToSpeakersInput = z.infer<typeof AIRespondsToSpeakersInputSchema>;

const AIRespondsToSpeakersOutputSchema = z.object({
  response: z.string().describe('The generated response for the current speaker.'),
});
export type AIRespondsToSpeakersOutput = z.infer<typeof AIRespondsToSpeakersOutputSchema>;

export async function aiRespondsToSpeakers(input: AIRespondsToSpeakersInput): Promise<AIRespondsToSpeakersOutput> {
  return aiRespondsToSpeakersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiRespondsToSpeakersPrompt',
  input: {schema: AIRespondsToSpeakersInputSchema},
  output: {schema: AIRespondsToSpeakersOutputSchema},
  prompt: `You are participating in a debate as {{{currentSpeaker}}}. You are speaking to other expert therapists, namely Dr. Chen, Dr. Williams, and Dr. Rodriguez. Use the following persona to guide your responses:

{% if currentSpeaker === 'Dr. Chen' %}
{{drChenPersona}}
{% elseif currentSpeaker === 'Dr. Williams' %}
{{drWilliamsPersona}}
{% elseif currentSpeaker === 'Dr. Rodriguez' %}
{{drRodriguezPersona}}
{% endif %}

Respond to the other speakers in the conversation, taking into account what they have said so far. Your response should be appropriate for a professional debate setting. The conversation history is as follows:

{{#each conversationHistory}}
{{speaker}}: {{message}}
{{/each}}

Respond as {{currentSpeaker}}:
`,
});

const aiRespondsToSpeakersFlow = ai.defineFlow(
  {
    name: 'aiRespondsToSpeakersFlow',
    inputSchema: AIRespondsToSpeakersInputSchema,
    outputSchema: AIRespondsToSpeakersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
