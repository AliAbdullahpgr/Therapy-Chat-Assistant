'use server';

/**
 * @fileOverview Summarizes a given conversation transcript.
 *
 * - summarizeTranscript - A function that summarizes the transcript.
 * - SummarizeTranscriptInput - The input type for the summarizeTranscript function.
 * - SummarizeTranscriptOutput - The return type for the summarizeTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTranscriptInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the debate to be summarized.'),
});
export type SummarizeTranscriptInput = z.infer<
  typeof SummarizeTranscriptInputSchema
>;

const SummarizeTranscriptOutputSchema = z.object({
  summary: z.string().describe('A summary of the debate transcript.'),
});
export type SummarizeTranscriptOutput = z.infer<
  typeof SummarizeTranscriptOutputSchema
>;

export async function summarizeTranscript(
  input: SummarizeTranscriptInput
): Promise<SummarizeTranscriptOutput> {
  return summarizeTranscriptFlow(input);
}

const summarizeTranscriptPrompt = ai.definePrompt({
  name: 'summarizeTranscriptPrompt',
  input: {schema: SummarizeTranscriptInputSchema},
  output: {schema: SummarizeTranscriptOutputSchema},
  prompt: `Summarize the following debate transcript in a concise manner:\n\nTranscript:\n{{transcript}}`,
});

const summarizeTranscriptFlow = ai.defineFlow(
  {
    name: 'summarizeTranscriptFlow',
    inputSchema: SummarizeTranscriptInputSchema,
    outputSchema: SummarizeTranscriptOutputSchema,
  },
  async input => {
    const {output} = await summarizeTranscriptPrompt(input);
    return output!;
  }
);
