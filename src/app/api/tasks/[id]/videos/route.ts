import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const videoSchema = z.object({
  title: z.string().min(1),
  youtubeUrl: z.string().url(),
  description: z.string().optional(),
});

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// POST add YouTube video to task
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = videoSchema.parse(body);

    // Extract YouTube ID
    const youtubeId = extractYouTubeId(validatedData.youtubeUrl);

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Save video to database
    const video = await db.video.create({
      data: {
        title: validatedData.title,
        youtubeUrl: validatedData.youtubeUrl,
        youtubeId: youtubeId,
        description: validatedData.description,
        taskId: params.id,
      },
    });

    return NextResponse.json({
      message: 'Video added successfully',
      video,
    });
  } catch (error) {
    console.error('Add video error:', error);
    return NextResponse.json(
      { error: 'Failed to add video' },
      { status: 500 }
    );
  }
}

// GET all videos for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videos = await db.video.findMany({
      where: { taskId: params.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// DELETE video from task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    await db.video.delete({
      where: { id: videoId },
    });

    return NextResponse.json({
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
