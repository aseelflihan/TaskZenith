// src/ai/flows/generate-productivity-reports.ts
'use server';

/**
 * @fileOverview AI-powered productivity report generator.
 *
 * - generateProductivityReports - A function that generates productivity reports and optimization recommendations.
 * - GenerateProductivityReportsInput - The input type for the generateProductivityReports function.
 * - GenerateProductivityReportsOutput - The return type for the generateProductivityReports function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductivityReportsInputSchema = z.object({
  userTasks: z.string().describe('A list of tasks the user has completed, including details like time spent, deadlines, and subtasks.'),
  userSchedule: z.string().describe('The user schedule and availability.'),
});
export type GenerateProductivityReportsInput = z.infer<typeof GenerateProductivityReportsInputSchema>;

const GenerateProductivityReportsOutputSchema = z.object({
  analysis: z.string().describe('An analysis of the user performance, including efficiency metrics.'),
  recommendations: z.string().describe('Recommendations for the user on how to optimize their productivity.'),
});
export type GenerateProductivityReportsOutput = z.infer<typeof GenerateProductivityReportsOutputSchema>;

export async function generateProductivityReports(input: GenerateProductivityReportsInput): Promise<GenerateProductivityReportsOutput> {
  return generateProductivityReportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductivityReportsPrompt',
  input: {schema: GenerateProductivityReportsInputSchema},
  output: {schema: GenerateProductivityReportsOutputSchema},
  prompt: `You are an AI assistant designed to analyze user productivity and provide optimization recommendations.

  Analyze the user's tasks and schedule to identify areas for improvement.

  Tasks:
  {{userTasks}}

  Schedule:
  {{userSchedule}}

  Provide a detailed analysis of their performance, including efficiency metrics, and suggest actionable recommendations to enhance their productivity.
  Ensure recommendations are practical, clear, and tailored to the user's specific context. Focus on time management, task prioritization, and workflow optimization.
  `,
});

const generateProductivityReportsFlow = ai.defineFlow(
  {
    name: 'generateProductivityReportsFlow',
    inputSchema: GenerateProductivityReportsInputSchema,
    outputSchema: GenerateProductivityReportsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
