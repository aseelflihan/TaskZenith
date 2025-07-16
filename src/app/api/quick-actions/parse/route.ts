// src/app/api/quick-actions/parse/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// CHANGE 1: We import the function directly. We will call it without the 'run' wrapper.
import { parseNaturalLanguageTasks } from "@/ai/flows/parse-natural-language-tasks";

// We assume genkit is configured globally, so we don't need to import or run configureGenkit here.

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text input is required" }, { status: 400 });
    }
    
    console.log(`[API PARSE] POST request received for text: "${text}"`);

    const { format } = await import('date-fns');
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    
    // CHANGE 2: Call the function directly instead of using 'run'.
    // This is the correct way if 'parseNaturalLanguageTasks' is a standard async function.
    const result = await parseNaturalLanguageTasks({ userInput: text, currentDate });
    
    // CHANGE 3: The 'result' is the array itself, not an object containing a 'tasks' property.
    if (!Array.isArray(result)) {
        console.error("[API PARSE] AI function did not return a valid array. Result:", result);
        throw new Error("AI function returned an invalid data structure.");
    }
    
    console.log(`[API PARSE] Successfully parsed ${result.length} tasks.`);
    return NextResponse.json(result); // Return the result array directly.

  } catch (error) {
    console.error("[API PARSE: FATAL ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    return NextResponse.json(
      { 
        error: "Failed to process tasks with AI.", 
        details: errorMessage 
      }, 
      { status: 500 }
    );
  }
}