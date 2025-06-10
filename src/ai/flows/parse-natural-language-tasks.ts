'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {format} from 'date-fns';

const SubTaskParsedSchema = z.object({
  text: z.string().describe('The description of the subtask.'),
  durationMinutes: z.number().optional().describe('The estimated duration in minutes.'),
  breakMinutes: z.number().optional().describe('The break time in minutes after this subtask.'),
  deadline: z.string().optional().describe("Date in 'yyyy-MM-dd' format."),
  scheduledTime: z.string().optional().describe("The exact start time in 'HH:mm' (24-hour) format. ONLY the start time."),
});

const MainTaskParsedSchema = z.object({
  text: z.string().describe('The main title for this specific group of tasks.'),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  subtasks: z.array(SubTaskParsedSchema).default([]),
});
export type MainTaskParsed = z.infer<typeof MainTaskParsedSchema>;

const MultiTaskOutputSchema = z.object({
    tasks: z.array(MainTaskParsedSchema).describe('An array of main tasks.'),
});

const ParseNaturalLanguageInputSchema = z.object({
  userInput: z.string().describe('The natural language text input from the user.'),
  currentDate: z.string().describe("The current date in 'yyyy-MM-dd' format."),
});
export type ParseNaturalLanguageInput = z.infer<typeof ParseNaturalLanguageInputSchema>;

export async function parseNaturalLanguageTasks(input: ParseNaturalLanguageInput): Promise<MainTaskParsed[]> {
  const result = await parseNaturalLanguageTasksFlow(input);
  return result.tasks;
}

const prompt = ai.definePrompt({
  name: 'parseNaturalLanguageTasksPrompt',
  input: {schema: ParseNaturalLanguageInputSchema},
  output: {schema: MultiTaskOutputSchema},
  prompt: `You are a sophisticated task grouping assistant.
The current date is {{currentDate}}.
Your responsibilities:
1.  **Identify Distinct Groups**: Find separate, logical groups of tasks.
2.  **Create a Main Task for Each Group**: For each group, create a separate main task object in the 'tasks' array.
3.  **Language Matching**: All generated text MUST be in the same language as the user's input.
4.  **Data Extraction**: For each subtask, extract data.
    - **breakMinutes**: **CRITICAL: If the user specifies a break time (e.g., "30 min break"), you MUST use that value.** If and only if the user does NOT mention a break, you should default to 10 minutes. If they say "no break", use 0.
    - **scheduledTime**: **CRITICAL: This MUST be in the exact 'HH:mm' 24-hour format (e.g., "09:00", "14:30"). Do NOT include any other text.**

User Input:
"{{userInput}}"
`,
});

const parseNaturalLanguageTasksFlow = ai.defineFlow(
  {
    name: 'parseNaturalLanguageTasksFlow',
    inputSchema: ParseNaturalLanguageInputSchema,
    outputSchema: MultiTaskOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.tasks) {
        throw new Error("AI failed to parse the task input into groups.");
    }
    
    const processedTasks = output.tasks.map(task => {
        const processedSubtasks = task.subtasks.map(st => ({
            ...st,
            durationMinutes: st.durationMinutes ?? 25,
            // THIS IS THE CORRECT LOGIC - The Single Source of Truth
            breakMinutes: st.breakMinutes === undefined ? 10 : st.breakMinutes,
        }));
        
        return {
            ...task,
            priority: task.priority || 'medium',
            subtasks: processedSubtasks,
        };
    });

    return { tasks: processedTasks };
  }
);