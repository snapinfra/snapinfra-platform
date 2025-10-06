import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { DynamoService } from '@/services/database/dynamoService';
import { Project, ProjectStatus, DatabaseSchema, AuthenticatedRequest } from '@/types';
import Joi from 'joi';

const router = Router();

// Validation schemas
const fieldSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
  isPrimary: Joi.boolean().default(false),
  isRequired: Joi.boolean().default(false),
  isUnique: Joi.boolean().default(false),
  isForeignKey: Joi.boolean().default(false),
  description: Joi.string().allow('').default(''),
  defaultValue: Joi.any().optional(),
  validation: Joi.array().optional(),
  enumOptions: Joi.array().optional(),
  hasIndex: Joi.boolean().optional(),
  maxFileSize: Joi.number().optional(),
  acceptedFileTypes: Joi.array().optional()
});

const createProjectSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().allow('').max(500),
  schema: Joi.object({
    name: Joi.string().required(),
    tables: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      fields: Joi.array().items(fieldSchema).min(1).required(),
      indexes: Joi.array().default([])
    })).min(1).required(),
    relationships: Joi.array().default([])
  }).required()
});

const updateProjectSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().allow('').max(500),
  status: Joi.string().optional().valid(...Object.values(ProjectStatus)),
  schema: Joi.object({
    name: Joi.string().optional(),
    tables: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      fields: Joi.array().items(fieldSchema).min(1).required(),
      indexes: Joi.array().default([])
    })).optional(),
    relationships: Joi.array().optional()
  }).optional()
});

import { getCurrentUserId, devAuth } from '@/middleware/authMiddleware';

// Get all projects for user
router.get('/', devAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = getCurrentUserId(req);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const search = req.query.search as string;

  try {
    let projects: Project[];
    
    if (search) {
      projects = await DynamoService.searchProjects(userId, search, limit);
    } else {
      projects = await DynamoService.getUserProjects(userId, limit);
    }

    res.json({
      success: true,
      data: projects,
      count: projects.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
      timestamp: new Date().toISOString()
    });
  }
}));

// Create new project
router.post('/', devAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error, value } = createProjectSchema.validate(req.body, { abortEarly: false });
  if (error) {
    console.error('❌ Project validation failed:', error.details.map(d => ({
      path: d.path.join('.'),
      message: d.message,
      type: d.type
    })));
    console.error('📦 Received payload:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        type: d.type
      })),
      timestamp: new Date().toISOString()
    });
  }

  const userId = getCurrentUserId(req);

  try {
    const project = await DynamoService.createProject(userId, {
      name: value.name,
      description: value.description,
      schema: value.schema,
      status: ProjectStatus.DRAFT
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get specific project
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = getCurrentUserId(req);

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const project = await DynamoService.getProjectById(projectId, userId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get project deployments
    const deployments = await DynamoService.getProjectDeployments(projectId);
    project.deployments = deployments;

    res.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
      timestamp: new Date().toISOString()
    });
  }
}));

// Update project
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = getCurrentUserId(req);
  
  const { error, value } = updateProjectSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message),
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Check if project exists
    const existingProject = await DynamoService.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    const updatedProject = await DynamoService.updateProject(projectId, userId, value);

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
      timestamp: new Date().toISOString()
    });
  }
}));

// Delete project
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = getCurrentUserId(req);

  try {
    // Check if project exists
    const existingProject = await DynamoService.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    await DynamoService.deleteProject(projectId, userId);

    res.json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get project schemas
router.get('/:id/schemas', asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = getCurrentUserId(req);

  try {
    // Verify project exists and user has access
    const project = await DynamoService.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    const schemas = await DynamoService.getProjectSchemas(projectId);

    res.json({
      success: true,
      data: schemas,
      count: schemas.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schemas',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get project deployments
router.get('/:id/deployments', asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = getCurrentUserId(req);

  try {
    // Verify project exists and user has access
    const project = await DynamoService.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    const deployments = await DynamoService.getProjectDeployments(projectId);

    res.json({
      success: true,
      data: deployments,
      count: deployments.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deployments',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get user project statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  try {
    const stats = await DynamoService.getProjectStats(userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project statistics',
      timestamp: new Date().toISOString()
    });
  }
}));

// Batch get projects
router.post('/batch', asyncHandler(async (req: Request, res: Response) => {
  const { projectIds } = req.body;
  const userId = getCurrentUserId(req);

  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'projectIds array is required and must not be empty',
      timestamp: new Date().toISOString()
    });
  }

  if (projectIds.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 project IDs allowed per request',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const projects = await DynamoService.batchGetProjects(projectIds, userId);

    res.json({
      success: true,
      data: projects,
      count: projects.length,
      requestedCount: projectIds.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
      timestamp: new Date().toISOString()
    });
  }
}));

export default router;
