import { NextRequest, NextResponse } from 'next/server';
import { DynamoService } from '@/lib/services/database/dynamoService';
import { getCurrentUser, getDevUserId } from '@/lib/services/auth-helper';
import type { Project, ProjectStatus } from '@/lib/appContext/app-context';

export async function GET(request: NextRequest) {
  try {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'development';
    let userId: string;

    if (authMode === 'production') {
      const user = await getCurrentUser(request);
      userId = user.id;
    } else {
      userId = getDevUserId(request);
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const search = searchParams.get('search');

    let projects: Project[];
    
    if (search) {
      projects = await DynamoService.searchProjects(userId, search, limit);
    } else {
      projects = await DynamoService.getUserProjects(userId, limit);
    }

    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'development';
    let userId: string;

    if (authMode === 'production') {
      const user = await getCurrentUser(request);
      userId = user.id;
    } else {
      userId = getDevUserId(request);
    }

    const body = await request.json();
    
    console.log('POST /api/projects - Creating project for user:', userId);
    console.log('Project name:', body.name);

   const project = await DynamoService.createProject(userId, {
      name: body.name,
      description: body.description,
      schema: body.schema,
      status: 'draft' as ProjectStatus,
      ...(body.specialParam && { specialParam: body.specialParam }), // ← ADD THIS
      ...(body.diagrams && { diagrams: body.diagrams }), // ← ADD THIS
      ...(body.endpoints && { endpoints: body.endpoints }),
      ...(body.database && { database: body.database }),
      ...(body.architecture && { architecture: body.architecture }),
      ...(body.decisions && { decisions: body.decisions }),
      ...(body.selectedTools && { selectedTools: body.selectedTools }),
      ...(body.analysis && { analysis: body.analysis })
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
