/**
 * Individual Document API - Tenant-Safe Implementation
 * 
 * GET /api/documents/[id] - Get single document
 * DELETE /api/documents/[id] - Delete document
 * 
 * SECURITY: All operations validate organizationId ownership
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { 
  getDocumentByIdWithTenantCheck,
  deleteDocumentWithTenantCheck,
} from '@/server/tenant-storage';
import { unlink } from 'fs/promises';
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

    const document = await getDocumentByIdWithTenantCheck(documentId);

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Get document error:', error);

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
});

export const DELETE = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const documentId = parseInt(id);
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      );
    }

    // Get document first to retrieve file path for deletion
    const document = await getDocumentByIdWithTenantCheck(documentId);

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), document.path);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file from filesystem:', fileError);
      // Continue even if file deletion fails (file might already be gone)
    }

    // Delete document record from database
    const deleted = await deleteDocumentWithTenantCheck(documentId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
});
