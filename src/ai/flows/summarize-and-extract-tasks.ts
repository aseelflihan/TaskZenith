import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { ai } from '../genkit';

const outputSchema = z.object({
    title: z.string().describe("A concise, descriptive title for the content."),
    summary: z.string().describe("A detailed, paragraph-length summary of the content."),
    tldr: z.string().describe("A very short, one-sentence summary (TL;DR)."),
    tags: z.array(z.string()).describe("An array of 3-5 relevant keywords or tags."),
    tasks: z.array(z.object({ text: z.string() })).describe("An array of actionable tasks extracted from the content."),
});

const prompt = ai.definePrompt({
  name: 'summarizeAndExtractTasksPrompt',
  input: { schema: z.object({ content: z.string() }) },
  output: { schema: outputSchema },
  prompt: `You are an expert content analyst. Analyze the following content and provide a structured JSON response with the following fields: title, summary, tldr, tags, and tasks.

Content:
{{content}}
`,
});

export const summarizeAndExtractTasksFlow = ai.defineFlow(
  {
    name: 'summarizeAndExtractTasksFlow',
    inputSchema: z.string(),
    outputSchema: outputSchema,
  },
  async (content: string) => {
    if (!content || content.trim() === "") {
        throw new Error("Content cannot be empty.");
    }
    
    const { output } = await prompt({ content });

    if (!output) {
        throw new Error("Failed to get a structured response from the model.");
    }

    return output;
  }
);