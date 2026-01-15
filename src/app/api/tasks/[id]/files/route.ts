import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure uploads directory exists
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!uploadedBy) {
      return NextResponse.json(
        { error: 'No uploader provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, uniqueFilename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file info to database
    const savedFile = await db.file.create({
      data: {
        filename: file.name,
        filepath: `/uploads/${uniqueFilename}`,
        filesize: file.size,
        mimetype: file.type,
        taskId: params.id,
        uploadedBy: uploadedBy,
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: savedFile,
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET all files for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const files = await db.file.findMany({
      where: { taskId: params.id },
      include: {
        uploader: {
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

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
