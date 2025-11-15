/**
 * Document Download API - Tenant-Safe Implementation
 * 
 * GET /api/documents/[id]/download - Download document file
 * 
 * SECURITY: Validates document ownership before allowing download
 * MIGRATION: Converted from insecure userId-only pattern
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { getDocumentByIdWithTenantCheck } from '@/server/tenant-storage';
import { readFile } from 'fs/promises';
import path from 'path';

export const GET = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const documentId = parseInt(id);
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      );
    }

    // Validate document ownership via tenant check
    const document = await getDocumentByIdWithTenantCheck(documentId);

    // Read file from filesystem
    const filePath = path.join(process.cwd(), document.path);
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(document.name).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download document error:', error);

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    if (error instanceof Error && (error as any).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
});
