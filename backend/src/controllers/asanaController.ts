import { Request, Response } from 'express';
import { asanaService } from '../services/asanaService';

/**
 * Ruft die Übersicht über Tasks und Projekte ab
 */
export const getOverview = async (req: Request, res: Response) => {
  try {
    const { workspace } = req.query;
    const overview = await asanaService.getOverview(workspace as string);

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Asana-Übersicht:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Asana-Übersicht',
      error: error.message
    });
  }
};

/**
 * Ruft alle Workspaces ab
 */
export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const workspaces = await asanaService.getWorkspaces();

    res.json({
      success: true,
      data: workspaces,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Workspaces:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Workspaces',
      error: error.message
    });
  }
};

/**
 * Ruft alle Projekte ab
 */
export const getProjects = async (req: Request, res: Response) => {
  try {
    const { workspace } = req.query;
    const projects = await asanaService.getProjects(workspace as string);

    res.json({
      success: true,
      data: projects,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Projekte:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Projekte',
      error: error.message
    });
  }
};

/**
 * Ruft Tasks für einen Workspace ab
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { workspace, assignee } = req.query;

    if (!workspace) {
      return res.status(400).json({
        success: false,
        message: 'Workspace-ID ist erforderlich'
      });
    }

    const tasks = await asanaService.getTasksForWorkspace(
      workspace as string,
      assignee as string || 'me'
    );

    res.json({
      success: true,
      data: tasks,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Tasks:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Tasks',
      error: error.message
    });
  }
};

/**
 * Ruft Tasks für ein Projekt ab
 */
export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const { projectGid } = req.params;

    if (!projectGid) {
      return res.status(400).json({
        success: false,
        message: 'Projekt-ID ist erforderlich'
      });
    }

    const tasks = await asanaService.getTasksForProject(projectGid);

    res.json({
      success: true,
      data: tasks,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Projekt-Tasks:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Projekt-Tasks',
      error: error.message
    });
  }
};

/**
 * Ruft eine einzelne Task ab
 */
export const getTask = async (req: Request, res: Response) => {
  try {
    const { taskGid } = req.params;

    if (!taskGid) {
      return res.status(400).json({
        success: false,
        message: 'Task-ID ist erforderlich'
      });
    }

    const task = await asanaService.getTask(taskGid);

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Task:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Task',
      error: error.message
    });
  }
};

/**
 * Ruft Team-Statistiken für mehrere Benutzer ab
 */
export const getTeamStats = async (req: Request, res: Response) => {
  try {
    let { workspace } = req.query;

    // Workspace automatisch ermitteln, falls nicht angegeben
    if (!workspace) {
      const workspaces = await asanaService.getWorkspaces();
      if (workspaces.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Keine Workspaces gefunden'
        });
      }
      workspace = workspaces[0].gid;
    }

    // IT-Team User-IDs
    const teamUserGids = [
      '1205016388029188', // Wilko Cramer
      '1205016388029192', // Michael Hoblitz
      '1205016388029190', // Frank Schipper
      '1205016388029194', // Celina Heeren
      '1205039945218020'  // Ermando Tusha
    ];

    const stats = await asanaService.getTeamStats(workspace as string, teamUserGids);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Team-Statistiken:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Team-Statistiken',
      error: error.message
    });
  }
};
