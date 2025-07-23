import { z } from 'zod';
import { ai } from '../genkit';

const outputSchema = z.object({
  correctedText: z.string().describe("The corrected and enhanced text with proper formatting, spelling fixes, and structure improvements."),
  confidence: z.number().describe("Confidence level of the correction (0-100)."),
  improvements: z.array(z.string()).describe("List of improvements made to the original text."),
  language: z.string().describe("Detected primary language of the text."),
  summary: z.string().describe("Brief summary of the corrected text content."),
});

const prompt = ai.definePrompt({
  name: 'enhanceOcrTextPrompt',
  input: { schema: z.object({ rawText: z.string(), confidence: z.number() }) },
  output: { schema: outputSchema },
  prompt: `You are an expert text correction specialist. Your task is to enhance and correct OCR-extracted text.

Original OCR Text (Confidence: {{confidence}}%):
{{rawText}}

Please:
1. Fix spelling mistakes and OCR errors
2. Correct Arabic and English text formatting
3. Improve punctuation and structure
4. Maintain the original meaning
5. Format text properly with paragraphs
6. Fix any character recognition errors
7. Ensure proper Arabic text direction and English text flow

Provide the corrected text with improvements list and language detection.`,
});

export const enhanceOcrTextFlow = ai.defineFlow(
  {
    name: 'enhanceOcrTextFlow',
    inputSchema: z.object({
      rawText: z.string(),
      confidence: z.number(),
    }),
    outputSchema: outputSchema,
  },
  async ({ rawText, confidence }) => {
    if (!rawText || rawText.trim() === "") {
      throw new Error("Raw text cannot be empty.");
    }
    
    const { output } = await prompt({ rawText, confidence });

    if (!output) {
      throw new Error("Failed to get enhanced text from the model.");
    }

    return output;
  }
);
