// D:\applications\tasks\TaskZenith\src\ai\flows\parse-natural-language-tasks.ts
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schemas remain the same.
const SubTaskParsedSchema = z.object({
  text: z.string().describe('The description of the subtask.'),
  durationMinutes: z.number().optional().describe('The estimated duration in minutes. Suggest 25 if not specified.'),
  breakMinutes: z.number().optional().describe('The break time in minutes after this subtask. Default to 10 if not specified.'),
  deadline: z.string().optional().describe("Date in 'yyyy-MM-dd' format."),
  scheduledTime: z.string().optional().describe("The exact start time in 'HH:mm' (24-hour) format."),
});

const MainTaskParsedSchema = z.object({
  text: z.string().describe('The main title for this specific group of tasks. This title should be rephrased to be clear and motivating.'),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  deadline: z.string().optional().describe("The primary due date for the entire task group in 'yyyy-MM-dd' format. Set to null if not specified by the user."),
  startTime: z.string().optional().describe("The primary start time for the entire task group in 'HH:mm' (24-hour) format. Set to null if not specified by the user."),
  subtasks: z.array(SubTaskParsedSchema).default([]),
});
export type MainTaskParsed = z.infer<typeof MainTaskParsedSchema>;

const MultiTaskOutputSchema = z.object({
  tasks: z.array(MainTaskParsedSchema).describe('An array of main tasks.'),
});

const ParseNaturalLanguageInputSchema = z.object({
  userInput: z.string().describe('The natural language text input from the user.'),
  currentDate: z.string().describe("The current date in 'yyyy-MM-dd' format, to provide context for terms like 'tomorrow'."),
});
export type ParseNaturalLanguageInput = z.infer<typeof ParseNaturalLanguageInputSchema>;

export async function parseNaturalLanguageTasks(input: ParseNaturalLanguageInput): Promise<MainTaskParsed[]> {
  // This function now directly calls the flow, which is the correct pattern.
  // Assuming the flow is what we want to execute.
  const result = await parseNaturalLanguageTasksFlow(input);
  return result.tasks;
}

// ==================================================================
// *** PROMPT: Rule-Based Logic with Mandatory Decomposition ***
// ==================================================================
const prompt = ai.definePrompt({
  name: 'parseNaturalLanguageTasksPrompt',
  input: { schema: ParseNaturalLanguageInputSchema },
  output: { schema: MultiTaskOutputSchema },
  prompt: `You are a logical, rule-based text-processing engine. Your purpose is to classify user input and then convert it into a structured JSON format with zero ambiguity.
The current date is {{currentDate}}. The user input is: "{{userInput}}".

**Your Thought Process (Follow this strictly):**

**Part 1: Classify the Input Type (Internal Thought Process)**
First, you MUST determine the 'Input Type'. Evaluate these rules in order. The first rule that matches is the correct type.
1.  **Is it a 'DECOMPOSITION_LIST'?** Does the input contain multiple distinct actions or items, joined by commas, conjunctions ('و', 'and'), or listed implicitly? If YES, this is the type.
2.  **Is it a 'RANGE_EXPANSION'?** If not a list, does it contain a numerical or sequential range (e.g., "chapters 1-5", "pages 10-20")? If YES, this is the type.
3.  **Is it a 'BRAINSTORM_GOAL'?** If not a list or range, is it a broad, abstract goal that requires planning (e.g., "Learn a new language", "Start a business")? If YES, this is the type.
4.  **Otherwise, it is a 'SIMPLE_TASK'.**

**Part 2: Generate the JSON based on the Classified Type**
Now, generate the output based *only* on the type you determined in Part 1.

*   **If Type is 'DECOMPOSITION_LIST':**
    *   The Main Title should be a short summary of the overall goal (e.g., "إنجاز المهام اليومية", "قائمة التسوق").
    *   The Subtasks array **MUST** contain each individual item or action from the list as a separate entry. **NEVER, EVER summarize a list into a single task.**
    *   **CORRECT EXAMPLE:** Input: "شراء مقاضي المنزل من خبز وحليب وتفاح والذهاب للتسوق في المول وتنظيف الغرفة" -> Subtasks: ["شراء خبز", "شراء حليب", "شراء تفاح", "الذهاب للتسوق في المول", "تنظيف الغرفة"].
    *   **INCORRECT EXAMPLE (DO NOT DO THIS):** Input: "شراء مقاضي المنزل..." -> Subtasks: ["إنجاز مهام المنزل والتسوق"]. This is wrong because it summarizes instead of decomposing.

*   **If Type is 'RANGE_EXPANSION':**
    *   Create a subtask for each item in the range. Example: "review chapters 1-3" -> Subtasks: ["review chapter 1", "review chapter 2", "review chapter 3"].

*   **If Type is 'BRAINSTORM_GOAL':**
    *   Act as an expert planner. Brainstorm 3-5 logical, actionable starting subtasks to help the user begin.

*   **If Type is 'SIMPLE_TASK':**
    *   Create a single subtask with the same text as the main title.
`,
});

const parseNaturalLanguageTasksFlow = ai.defineFlow(
  {
    name: 'parseNaturalLanguageTasksFlow',
    inputSchema: ParseNaturalLanguageInputSchema,
    outputSchema: MultiTaskOutputSchema,
  },
  async (input: ParseNaturalLanguageInput) => {
    const { output } = await prompt(input, {
      // The temperature is good as is, no need to change it for now.
      config: {
        temperature: 0.4,
      },
    });

    if (!output || !output.tasks) {
      console.error("AI parsing failed. Raw output:", output);
      throw new Error("AI failed to parse the task input into a valid structure.");
    }

    return output;
  }
);