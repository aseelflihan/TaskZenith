// D:\applications\tasks\TaskZenith\src\ai\flows\parse-natural-language-tasks.ts
'use server';
// Using the correct, verified package name.
import { ai } from '@/ai/genkit';
import { geminiPro } from '@genkit-ai/googleai';
import { z } from 'genkit';

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
  const result = await parseNaturalLanguageTasksFlow(input);
  return result.tasks;
}

// ==================================================================
// *** UPGRADED PROMPT: From Parser to Intelligent Assistant ***
// ==================================================================
const prompt = ai.definePrompt({
  name: 'parseNaturalLanguageTasksPrompt',
  input: { schema: ParseNaturalLanguageInputSchema },
  output: { schema: MultiTaskOutputSchema },
  prompt: `You are an intelligent task assistant. Your job is to convert user requests into structured tasks. You must be precise with explicit instructions and creative with general goals.
The current date is {{currentDate}}. The user input is: "{{userInput}}".

**Analysis Steps:**

1.  **Main Title & Language:** Determine the main goal from the input. Create a clear, motivating title in the same language as the input.

2.  **Date/Time Extraction:** Scan for any specific dates or times. If found, use them for the main task's 'deadline' and 'startTime'. If not, leave these fields as \`null\`.

3.  **Subtask Generation Logic (CRITICAL - Follow this order):**

    *   **Step 3a: Check for Explicit Subtasks.**
        *   First, look for explicit instructions like ranges ("من الوحدة 1 إلى 3", "chapters 1-3"), lists, or multiple distinct actions.
        *   If you find explicit subtasks, parse them literally and accurately.
        *   **Example (Explicit):** Input "مراجعة الوحدة الاولى حتى الوحدة الثالثة" -> Subtasks: ["مراجعة الوحدة الأولى", "مراجعة الوحدة الثانية", "مراجعة الوحدة الثالثة"].

    *   **Step 3b: Check for General Goals (if no explicit subtasks are found).**
        *   IF, AND ONLY IF, the input is a general goal (e.g., "Learn English", "plan a new project", "write a blog post"), act as an expert project planner.
        *   You **MUST** brainstorm and generate a list of 3-5 logical and actionable starting subtasks to help the user begin.
        *   **Example (General Goal):** Input "add tasks for learning English" -> Subtasks: ["Define learning goals (e.g., conversational, business)", "Master the 100 most common words", "Practice daily with a language app", "Study basic grammar rules"].

    *   **Step 3c: Fallback for Simple Tasks.**
        *   If the input is a simple, single-action task that is not a general goal (e.g., "Call mom", "Buy milk"), create just one subtask with the same text as the main title.

4.  **Final Assembly:** Combine all the information into the final JSON object.
`,
});

const parseNaturalLanguageTasksFlow = ai.defineFlow(
  {
    name: 'parseNaturalLanguageTasksFlow',
    inputSchema: ParseNaturalLanguageInputSchema,
    outputSchema: MultiTaskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
      model: geminiPro,
      config: {
        // *** MODIFICATION: Increased temperature slightly to allow for more creativity in brainstorming subtasks. ***
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