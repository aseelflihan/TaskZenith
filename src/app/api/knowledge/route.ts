import { NextRequest, NextResponse } from 'next/server';
import { knowledgeItems, addItem } from './db';
import { summarizeAndExtractTasksFlow } from '@/ai/flows/summarize-and-extract-tasks';

function getYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getThumbnail(tags: string[], videoId: string | null): string {
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    // Use the user-provided static image as the default.
    return `https://images.unsplash.com/photo-1634715841611-67741dc71459?q=80&w=831&auto=format&fit=crop`;
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Run the AI flow
    const aiResult = await summarizeAndExtractTasksFlow(content);

    const videoId = getYouTubeVideoId(content);
    const thumbnail = getThumbnail(aiResult.tags, videoId);

    const newItem = {
      id: new Date().toISOString(),
      ...aiResult,
      tasks: aiResult.tasks.map((task: { text: string }) => ({ ...task, id: crypto.randomUUID(), completed: false })),
      thumbnail,
      source: videoId ? 'YouTube' : 'Web',
      originalContent: content,
      createdAt: new Date().toISOString(),
    };
    
    addItem(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error processing knowledge item:', error);
    return NextResponse.json({ error: 'Failed to process content' }, { status: 500 });
  }
}

export async function GET() {
    return NextResponse.json(knowledgeItems);
}