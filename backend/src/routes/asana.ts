import { Router } from 'express';
import {
  getOverview,
  getWorkspaces,
  getProjects,
  getTasks,
  getProjectTasks,
  getTask,
  getTeamStats
} from '../controllers/asanaController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/asana/overview - Dashboard-Übersicht
router.get('/overview', authenticate, getOverview);

// GET /api/asana/workspaces - Alle Workspaces abrufen
router.get('/workspaces', authenticate, getWorkspaces);

// GET /api/asana/projects - Alle Projekte abrufen
router.get('/projects', authenticate, getProjects);

// GET /api/asana/tasks - Tasks für einen Workspace abrufen
router.get('/tasks', authenticate, getTasks);

// GET /api/asana/projects/:projectGid/tasks - Tasks für ein Projekt abrufen
router.get('/projects/:projectGid/tasks', authenticate, getProjectTasks);

// GET /api/asana/tasks/:taskGid - Einzelne Task abrufen
router.get('/tasks/:taskGid', authenticate, getTask);

// GET /api/asana/team-stats - Team-Statistiken abrufen
router.get('/team-stats', authenticate, getTeamStats);

export default router;
