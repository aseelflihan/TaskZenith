// src/ai/flows/prioritize-tasks.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for prioritizing tasks using AI.
 *
 * - prioritizeTasks - A function that prioritizes tasks based on urgency and context using the Google Gemini API.
 * - PrioritizeTasksInput - The input type for the prioritizeTasks function.
 * - PrioritizeTasksOutput - The output type for the prioritizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeTasksInputSchema = z.object({
  tasks: z
    .array(z.string())
    .describe('A list of tasks to be prioritized.'),
  context: z
    .string()
    .describe(
      'The context in which the tasks are to be performed, including any relevant deadlines or constraints.'
    ),
});
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizeTasksOutputSchema = z.object({
  prioritizedTasks: z
    .array(z.string())
    .describe('A list of tasks prioritized based on urgency and context.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the task prioritization.'),
});
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasks(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are an AI assistant designed to prioritize a list of tasks based on urgency and context.

Given the following tasks:

{{#each tasks}}- {{this}}\n{{/each}}

And the following context:

{{context}}

Please provide a prioritized list of tasks, along with a brief explanation of your reasoning.

Prioritized Tasks:

{{#each prioritizedTasks}}- {{this}}\n{{/each}}

Reasoning: {{reasoning}}`,
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prioritizeTasksPrompt(input);
    return output!;
  }
);
