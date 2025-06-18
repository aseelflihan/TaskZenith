// D:\applications\tasks\TaskZenith\src\ai\flows\parse-natural-language-tasks.ts
'use server';
import { ai, geminiPro } from '@/ai/genkit'; // CHANGED: Import geminiPro explicitly
import { z } from 'genkit';

// Schemas remain the same, they are well-defined.
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
  deadline: z.string().optional().describe("The primary due date for the entire task group in 'yyyy-MM-dd' format."),
  startTime: z.string().optional().describe("The primary start time for the entire task group in 'HH:mm' (24-hour) format."),
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
// *** CRITICAL CHANGE: NEW, MORE ROBUST PROMPT ***
// ==================================================================
const prompt = ai.definePrompt({
  name: 'parseNaturalLanguageTasksPrompt',
  input: { schema: ParseNaturalLanguageInputSchema },
  output: { schema: MultiTaskOutputSchema },
  // CHANGED: The entire prompt is rewritten to force a step-by-step thinking process.
  prompt: `You are a hyper-intelligent task parser. Your job is to meticulously analyze user input and convert it into a structured JSON object. You MUST follow these steps in order.

Current date is {{currentDate}}.

**Step 1: Overall Analysis**
- Read the entire user input: "{{userInput}}"
- Identify the main goal.
- Identify the language of the input (e.g., Arabic, English). All your output text MUST be in this language.

**Step 2: Date and Time Extraction**
- Scan the input for any specific date or time.
- Examples: "19 يونيو" -> "2024-06-19" (use current year), "tomorrow", "next Friday".
- Examples: "الساعة وحدة ظهرا", "1pm" -> "13:00". "9 مساء" -> "21:00".
- If found, these will be the 'deadline' and 'startTime' for the main task. If not found, these fields will be null.

**Step 3: Title Generation**
- Based on the main goal, create a concise, clear, and motivating title for the main task's 'text' field. Do not just copy the user's text.

**Step 4: Subtask Deconstruction (THE MOST IMPORTANT STEP)**
- Look for keywords indicating multiple sub-items, especially ranges like "من ... حتى ...", "from ... to ...", "chapters X, Y, and Z".
- **RULE: YOU MUST NEVER output a range as a single subtask.** You MUST deconstruct it.
- **Example of what NOT to do:** If input is "review chapters 1 to 3", DO NOT create a subtask named "review chapters 1 to 3".
- **Example of what YOU MUST DO:** If input is "مراجعة الوحدة الاولى حتى الوحدة الثالثة", you MUST generate THREE separate subtasks in the 'subtasks' array:
  1. {"text": "مراجعة الوحدة الأولى"}
  2. {"text": "مراجعة الوحدة الثانية"}
  3. {"text": "مراجعة الوحدة الثالثة"}
- If no specific subtasks or ranges are mentioned, create a single, general subtask based on the main title.

**Step 5: Final JSON Assembly**
- Assemble all the extracted and generated data into the final JSON structure according to the provided schema. Ensure all fields are correctly formatted.

Now, execute these steps meticulously for the user's input.
`,
});

const parseNaturalLanguageTasksFlow = ai.defineFlow(
  {
    name: 'parseNaturalLanguageTasksFlow',
    inputSchema: ParseNaturalLanguageInputSchema,
    outputSchema: MultiTaskOutputSchema,
  },
  async (input) => {
    // CHANGED: We now explicitly call the prompt with a more powerful model and lower temperature for more deterministic results.
    const { output } = await prompt(input, {
      model: geminiPro, // Use a more capable model
      config: {
        temperature: 0.2, // Lower temperature for less "creativity" and more adherence to instructions
      },
    });

    if (!output || !output.tasks) {
      throw new Error("AI failed to parse the task input.");
    }

    return output;
  }
);