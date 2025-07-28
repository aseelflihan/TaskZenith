import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { ai } from '../genkit';

const outputSchema = z.object({
    title: z.string().describe("A concise, descriptive title for the content."),
    summary: z.string().describe("A detailed, paragraph-length summary of the content."),
    tldr: z.string().describe("A very short, one-sentence summary (TL;DR)."),
    tags: z.array(z.string()).describe("An array of 3-5 relevant keywords or tags."),
    tasks: z.array(z.object({ text: z.string() })).describe("An array of actionable tasks extracted from the content."),
    date: z.string().nullable().optional().describe("The primary event date found in the text, formatted as YYYY-MM-DD. Null if no specific date is found."),
});

const prompt = ai.definePrompt({
  name: 'summarizeAndExtractTasksPrompt',
  input: { schema: z.object({ content: z.string() }) },
  output: { schema: outputSchema },
  prompt: `You are an expert content analyst. Analyze the following content and provide a structured JSON response with the following fields:

1. **title**: Create a concise, descriptive title that captures the main topic of the content
2. **summary**: Write a comprehensive paragraph-length summary that covers ALL the main points and key information from the content. This should be a detailed overview that someone could read to understand the complete content without reading the original
3. **tldr**: Provide a very short, one-sentence summary (TL;DR) that captures the absolute essence
4. **tags**: Generate 3-5 relevant keywords or tags that best describe the content
5. **tasks**: Extract any actionable items, to-dos, or action points mentioned in the content

6. **date**: Find the main event date in the content. Format it as YYYY-MM-DD. If no specific date is mentioned, return null. Do not invent a date or use a deadline.

Important: The summary should be comprehensive and include all major points from the content, not just a brief description.

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
    
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 AI processing attempt ${attempt}/${maxRetries}...`);
        
        const { output } = await prompt({ content });

        if (!output) {
            throw new Error("Failed to get a structured response from the model.");
        }

        console.log(`✅ AI processing successful on attempt ${attempt}`);
        return output;
        
      } catch (error: any) {
        console.error(`❌ AI attempt ${attempt} failed:`, error);
        
        // Check for specific error types
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          console.log(`⏰ Model overloaded, retrying in ${attempt * 2} seconds...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Progressive delay
            continue;
          }
        }
        
        // If it's the last attempt or non-retryable error, fallback
        if (attempt === maxRetries || !error.message?.includes('503')) {
          console.log('🔄 Using fallback AI analysis...');
          return createFallbackAnalysis(content);
        }
      }
    }
    
    // This should never be reached, but just in case
    return createFallbackAnalysis(content);
  }
);

// Fallback analysis when AI is unavailable
function createFallbackAnalysis(content: string) {
  console.log('📝 Creating fallback analysis...');
  
  // Extract potential tasks using simple patterns
  const taskPatterns = [
    /(?:todo|task|action|complete|finish|do|make|create|write|send|call|email|review|update|fix|check|verify|test)[\s:]+([^\n.!?]+)/gi,
    /(?:need to|should|must|have to|required to)\s+([^\n.!?]+)/gi,
    /(?:•|-)[\s]*([^\n]+)/g
  ];
  
  const extractedTasks: { text: string }[] = [];
  
  taskPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanTask = match.replace(/^(?:todo|task|action|complete|finish|do|make|create|write|send|call|email|review|update|fix|check|verify|test|need to|should|must|have to|required to|•|-)\s*:?\s*/i, '').trim();
        if (cleanTask.length > 5 && cleanTask.length < 200) {
          extractedTasks.push({ text: cleanTask });
        }
      });
    }
  });
  
  // Generate simple summary
  const summary = content.length > 200 
    ? content.substring(0, 200) + '...' 
    : content;
  
  // Generate basic tags
  const commonWords = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  commonWords.forEach(word => {
    if (!['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const tags = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    title: `Document Analysis (AI Offline)`,
    summary: `Document processed successfully. ${summary}`,
    tldr: content.length > 100 ? `Summary of uploaded content.` : content.substring(0, 50),
    tags: tags.length > 0 ? tags : ['document', 'upload', 'content'],
    tasks: extractedTasks.length > 0 ? extractedTasks.slice(0, 10) : [{ text: 'Review uploaded content' }],
    date: null
  };
}