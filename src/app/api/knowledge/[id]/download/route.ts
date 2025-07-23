import { NextRequest, NextResponse } from 'next/server';
import { getItem } from '../../db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const item = getItem(params.id);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if user owns this item
    if (item.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if this is a file item
    if (!item.fileName || !item.fileType || !item.originalContent) {
      return NextResponse.json({ error: 'Not a downloadable file' }, { status: 400 });
    }

    // Generate a clean filename with proper extension
    const cleanFileName = item.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = item.fileName.split('.').pop() || 'txt';
    const downloadFileName = cleanFileName.endsWith(`.${fileExtension}`) ? 
      cleanFileName : `${cleanFileName}.${fileExtension}`;
    
    // Create appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', item.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    headers.set('Cache-Control', 'no-cache');
    
    // For text-based files, return the extracted content
    // For binary files, you would need to store and retrieve the actual binary data
    let content: Buffer | string;

    if (item.fileData) {
      content = Buffer.from(item.fileData, 'base64');
    } else {
      content = item.originalContent;
    }
    
    return new NextResponse(content, { headers });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ 
      error: 'Failed to download file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
