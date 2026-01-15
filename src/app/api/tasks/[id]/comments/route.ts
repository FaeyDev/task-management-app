import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1),
  authorId: z.string(),
});

// POST add comment to task
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = commentSchema.parse(body);

    const comment = await db.comment.create({
      data: {
        content: validatedData.content,
        taskId: params.id,
        authorId: validatedData.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Comment added successfully',
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// GET all comments for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await db.comment.findMany({
      where: { taskId: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
