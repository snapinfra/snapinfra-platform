import { NextRequest, NextResponse } from 'next/server';
import { DynamoService } from '@/lib/services/database/dynamoService';
import { getCurrentUser, getDevUserId } from '@/lib/services/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'development';
    let userId: string;

    if (authMode === 'production') {
      const user = await getCurrentUser(request);
      userId = user.id;
    } else {
      userId = getDevUserId(request);
    }

    const { id: projectId } = await params;
    const project = await DynamoService.getProjectById(projectId, userId);

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'development';
    let userId: string;

    if (authMode === 'production') {
      const user = await getCurrentUser(request);
      userId = user.id;
    } else {
      userId = getDevUserId(request);
    }

    const { id: projectId } = await params;
    const updates = await request.json();

    const project = await DynamoService.updateProject(projectId, userId, updates);

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'development';
    let userId: string;

    if (authMode === 'production') {
      const user = await getCurrentUser(request);
      userId = user.id;
    } else {
      userId = getDevUserId(request);
    }

    const { id: projectId } = await params;
    await DynamoService.deleteProject(projectId, userId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
