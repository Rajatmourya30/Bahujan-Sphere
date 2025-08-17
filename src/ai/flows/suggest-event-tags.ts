'use server';

/**
 * @fileOverview A flow for suggesting relevant tags for an event based on its description.
 *
 * - suggestEventTags - A function that takes an event description and returns suggested tags.
 * - SuggestEventTagsInput - The input type for the suggestEventTags function.
 * - SuggestEventTagsOutput - The return type for the suggestEventTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEventTagsInputSchema = z.object({
  eventDescription: z
    .string()
    .describe('The description of the event for which tags are to be suggested.'),
  existingTags: z.array(z.string()).optional().describe('Existing tags to use as context.'),
});
export type SuggestEventTagsInput = z.infer<typeof SuggestEventTagsInputSchema>;

const SuggestEventTagsOutputSchema = z.object({
  suggestedTags: z
    .array(z.string())
    .describe('An array of suggested tags based on the event description.'),
});
export type SuggestEventTagsOutput = z.infer<typeof SuggestEventTagsOutputSchema>;

export async function suggestEventTags(input: SuggestEventTagsInput): Promise<SuggestEventTagsOutput> {
  return suggestEventTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEventTagsPrompt',
  input: {schema: SuggestEventTagsInputSchema},
  output: {schema: SuggestEventTagsOutputSchema},
  prompt: `You are a helpful assistant that suggests relevant tags for events based on their description.

  Consider these existing tags when providing suggestions: {{#if existingTags}}{{{existingTags}}}{{else}}None{{/if}}

  Event Description: {{{eventDescription}}}

  Please provide a list of suggested tags that are relevant to the event description.
  Do not include any tags that are already in the existing tags array.
  Limit the number of suggested tags to 5.
  The suggested tags must be descriptive and relevant to the event.
  Format the suggested tags in JSON format.
  `,
});

const suggestEventTagsFlow = ai.defineFlow(
  {
    name: 'suggestEventTagsFlow',
    inputSchema: SuggestEventTagsInputSchema,
    outputSchema: SuggestEventTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
