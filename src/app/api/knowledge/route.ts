import { NextRequest, NextResponse } from 'next/server';
import { knowledgeItems, addItem } from './db';
import { summarizeAndExtractTasksFlow } from '@/ai/flows/summarize-and-extract-tasks';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function getYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Run the AI flow
    const aiResult = await summarizeAndExtractTasksFlow(content);
    const videoId = getYouTubeVideoId(content);

    let thumbnail: string | null = null;
    let attribution: string | null = null;

    if (videoId) {
      thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      for (const tag of aiResult.tags) {
        try {
          const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(tag)}&per_page=1&client_id=gimrSzEa49LqETfxKS2vN1GBYLkpAUO60pdkl5IfPQ8`);
          if (response.ok) {
            const data = await response.json();
            if (data.results.length > 0) {
              const image = data.results[0];
              thumbnail = image.urls.regular;
              attribution = `Photo by <a href="${image.user.links.html}" target="_blank" rel="noopener noreferrer">${image.user.name}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
              break; // Found an image, so stop searching
            }
          }
        } catch (error) {
          console.error(`Failed to fetch image for tag "${tag}" from Unsplash`, error);
        }
      }
    }

    const newItem = {
      id: new Date().toISOString(),
      ...aiResult,
      tasks: aiResult.tasks.map((task: { text: string }) => ({ ...task, id: crypto.randomUUID(), completed: false })),
      thumbnail: thumbnail || 'https://source.unsplash.com/400x200/?abstract,pattern', // Fallback
      attribution: attribution || '',
      source: videoId ? 'YouTube' : 'Web',
      originalContent: content,
      createdAt: new Date().toISOString(),
      userEmail: session.user.email,
    };
    
    addItem(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error processing knowledge item:', error);
    return NextResponse.json({ error: 'Failed to process content' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userKnowledgeItems = knowledgeItems.filter(item => item.userEmail === session.user?.email);
    return NextResponse.json(userKnowledgeItems);
}