// src/app/api/quick-actions/parse/route.ts

import { NextRequest, NextResponse } from "next/server";

// --- CHANGE 1: Corrected way to get session in API Routes ---
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // This import is correct because authOptions is exported

import { parseNaturalLanguageTasks } from "@/ai/flows/parse-natural-language-tasks";

export async function POST(req: NextRequest) {
  try {
    // --- CHANGE 2: Use getServerSession with your exported authOptions ---
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
    
    const result = await parseNaturalLanguageTasks({ userInput: text, currentDate });
    
    if (!Array.isArray(result)) {
        console.error("[API PARSE] AI function did not return a valid array. Result:", result);
        throw new Error("AI function returned an invalid data structure.");
    }
    
    console.log(`[API PARSE] Successfully parsed ${result.length} tasks.`);
    return NextResponse.json(result);

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