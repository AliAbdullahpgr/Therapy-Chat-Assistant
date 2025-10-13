'use server';
/**
 * @fileOverview Implements a Genkit flow for an AI therapist to respond to a user.
 *
 * - aiRespondsToSpeakers - A function that takes the conversation history and personas, and generates a response for a specified speaker.
 * - AIRespondsToSpeakersInput - The input type for the aiRespondsToSpeakers function.
 * - AIRespondsToSpeakersOutput - The return type for the aiRespondsToSpeakers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIRespondsToSpeakersInputSchema = z.object({
  conversationHistory: z.array(z.object({
    speaker: z.string().describe('The name of the speaker (Dr. Sarah, Dr. Laura, Dr. John, User, or Bot).'),
    message: z.string().describe('The content of the message spoken by the speaker.'),
  })).describe('The history of the conversation so far.'),
  currentSpeaker: z.string().describe('The name of the AI speaker who should respond (Dr. Sarah, Dr. Laura, or Dr. John).'),
  drSarahPersona: z.string().describe('The defined persona of Dr. Sarah.'),
  drLauraPersona: z.string().describe('The defined persona of Dr. Laura.'),
  drJohnPersona: z.string().describe('The defined persona of Dr. John.'),
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
  prompt: `You are an expert therapist engaging in a one-on-one conversation with a user. Your name is {{{currentSpeaker}}}.

Your persona is as follows:
{% if currentSpeaker === 'Dr. Sarah' %}
{{drSarahPersona}}
{% elseif currentSpeaker === 'Dr. Laura' %}
{{drLauraPersona}}
{% elseif currentSpeaker === 'Dr. John' %}
{{drJohnPersona}}
{% endif %}

The user is seeking help and guidance. Your role is to be an empathetic, helpful, and safe therapist. Respond directly to the user's last message, taking into account the entire conversation history. Maintain your persona consistently. Keep your responses concise and focused, aiming for 2-4 sentences unless a more detailed explanation is necessary. Do not ask multiple questions at once.

Conversation History:
{{#each conversationHistory}}
{{speaker}}: {{message}}
{{/each}}

Respond now as {{currentSpeaker}}:
`,
});

const aiRespondsToSpeakersFlow = ai.defineFlow(
  {
    name: 'aiRespondsToSpeakersFlow',
    inputSchema: AIRespondsToSpeakersInputSchema,
    outputSchema: AIRespondsToSpeakersOutputSchema,
  },
  async input => {
    // Filter out bot messages from the history sent to the LLM
    const filteredHistory = input.conversationHistory.filter(m => m.speaker !== 'Bot');
    
    const {output} = await prompt({...input, conversationHistory: filteredHistory});
    return output!;
  }
);
