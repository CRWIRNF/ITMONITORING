import axios from 'axios';

// Asana API Response Interfaces
interface AsanaUser {
  gid: string;
  name: string;
  email?: string;
}

interface AsanaWorkspace {
  gid: string;
  name: string;
}

interface AsanaProject {
  gid: string;
  name: string;
  archived: boolean;
  completed: boolean;
  completed_at?: string;
  current_status_update?: {
    title: string;
    text: string;
    color: string;
    created_at: string;
  };
  workspace: AsanaWorkspace;
}

interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  completed_at?: string;
  due_on?: string;
  due_at?: string;
  assignee?: AsanaUser;
  assignee_status?: string;
  projects?: AsanaProject[];
  created_at: string;
  modified_at: string;
  notes?: string;
}

interface AsanaApiResponse<T> {
  data: T;
}

export class AsanaService {
  private apiUrl: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = process.env.ASANA_API_URL || 'https://app.asana.com/api/1.0';
    this.accessToken = process.env.ASANA_ACCESS_TOKEN || '';
  }

  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Ruft alle Workspaces ab
   */
  async getWorkspaces(): Promise<AsanaWorkspace[]> {
    try {
      const response = await axios.get<AsanaApiResponse<AsanaWorkspace[]>>(
        `${this.apiUrl}/workspaces`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Workspaces:', error);
      throw error;
    }
  }

  /**
   * Ruft alle Projekte eines Workspaces ab
   */
  async getProjects(workspaceGid?: string): Promise<AsanaProject[]> {
    try {
      let url = `${this.apiUrl}/projects`;

      if (workspaceGid) {
        url = `${this.apiUrl}/workspaces/${workspaceGid}/projects`;
      }

      const response = await axios.get<AsanaApiResponse<AsanaProject[]>>(
        url,
        {
          headers: this.getHeaders(),
          params: {
            opt_fields: 'name,archived,completed,completed_at,current_status_update,workspace'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Projekte:', error);
      throw error;
    }
  }

  /**
   * Ruft alle Tasks eines Projekts ab
   */
  async getTasksForProject(projectGid: string): Promise<AsanaTask[]> {
    try {
      const response = await axios.get<AsanaApiResponse<AsanaTask[]>>(
        `${this.apiUrl}/projects/${projectGid}/tasks`,
        {
          headers: this.getHeaders(),
          params: {
            opt_fields: 'name,completed,completed_at,due_on,due_at,assignee,assignee_status,projects,created_at,modified_at,notes'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Tasks:', error);
      throw error;
    }
  }

  /**
   * Ruft Tasks für einen Workspace ab (optional: zugewiesen an den authentifizierten User)
   */
  async getTasksForWorkspace(workspaceGid: string, assignee: string = 'me'): Promise<AsanaTask[]> {
    try {
      const response = await axios.get<AsanaApiResponse<AsanaTask[]>>(
        `${this.apiUrl}/tasks`,
        {
          headers: this.getHeaders(),
          params: {
            workspace: workspaceGid,
            assignee: assignee,
            limit: 100
          }
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Tasks:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ruft eine einzelne Task ab
   */
  async getTask(taskGid: string): Promise<AsanaTask> {
    try {
      const response = await axios.get<AsanaApiResponse<AsanaTask>>(
        `${this.apiUrl}/tasks/${taskGid}`,
        {
          headers: this.getHeaders(),
          params: {
            opt_fields: 'name,completed,completed_at,due_on,due_at,assignee,assignee_status,projects,created_at,modified_at,notes'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Task:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine Übersicht über Tasks und Projekte für das Dashboard
   */
  async getOverview(workspaceGid?: string) {
    try {
      // Workspace ermitteln, falls nicht angegeben
      let workspace = workspaceGid;
      if (!workspace) {
        const workspaces = await this.getWorkspaces();
        if (workspaces.length === 0) {
          throw new Error('Keine Workspaces gefunden');
        }
        workspace = workspaces[0].gid;
      }

      // Tasks und Projekte parallel abrufen
      const [tasks, projects] = await Promise.all([
        this.getTasksForWorkspace(workspace, 'me'),
        this.getProjects(workspace)
      ]);

      // Statistiken berechnen
      const now = new Date();
      const openTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed);
      const overdueTasks = openTasks.filter(t => {
        if (!t.due_on && !t.due_at) return false;
        const dueDate = new Date(t.due_on || t.due_at || '');
        return dueDate < now;
      });
      const todayTasks = openTasks.filter(t => {
        if (!t.due_on && !t.due_at) return false;
        const dueDate = new Date(t.due_on || t.due_at || '');
        return dueDate.toDateString() === now.toDateString();
      });

      const activeProjects = projects.filter(p => !p.archived && !p.completed);
      const completedProjects = projects.filter(p => p.completed);

      return {
        workspace: {
          gid: workspace
        },
        tasks: {
          total: tasks.length,
          open: openTasks.length,
          completed: completedTasks.length,
          overdue: overdueTasks.length,
          today: todayTasks.length,
          list: tasks.slice(0, 10) // Top 10 Tasks
        },
        projects: {
          total: projects.length,
          active: activeProjects.length,
          completed: completedProjects.length,
          list: activeProjects.slice(0, 5) // Top 5 Projekte
        }
      };
    } catch (error) {
      console.error('Fehler beim Erstellen der Übersicht:', error);
      throw error;
    }
  }

  /**
   * Ruft Team-Statistiken für mehrere Benutzer ab
   */
  async getTeamStats(workspaceGid: string, userGids: string[]) {
    try {
      const teamStats = await Promise.all(
        userGids.map(async (userGid) => {
          try {
            // Offene Tasks abrufen
            const openTasksResponse = await axios.get<AsanaApiResponse<AsanaTask[]>>(
              `${this.apiUrl}/tasks`,
              {
                headers: this.getHeaders(),
                params: {
                  workspace: workspaceGid,
                  assignee: userGid,
                  completed_since: 'now',
                  limit: 100
                }
              }
            );

            // Geschlossene Tasks der letzten 30 Tage abrufen
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const completedTasksResponse = await axios.get<AsanaApiResponse<AsanaTask[]>>(
              `${this.apiUrl}/tasks`,
              {
                headers: this.getHeaders(),
                params: {
                  workspace: workspaceGid,
                  assignee: userGid,
                  completed_since: thirtyDaysAgo.toISOString(),
                  limit: 100
                }
              }
            );

            const openTasks = openTasksResponse.data.data;
            const allRecentTasks = completedTasksResponse.data.data;
            const completedTasks = allRecentTasks.filter(t => t.completed);

            // User-Info abrufen
            const userResponse = await axios.get<AsanaApiResponse<AsanaUser>>(
              `${this.apiUrl}/users/${userGid}`,
              {
                headers: this.getHeaders()
              }
            );

            return {
              user: {
                gid: userGid,
                name: userResponse.data.data.name,
                email: userResponse.data.data.email
              },
              openTasks: openTasks.length,
              completedTasks: completedTasks.length,
              totalTasks: openTasks.length + completedTasks.length
            };
          } catch (error) {
            console.error(`Fehler beim Abrufen der Stats für User ${userGid}:`, error);
            return {
              user: {
                gid: userGid,
                name: 'Unbekannt',
                email: undefined
              },
              openTasks: 0,
              completedTasks: 0,
              totalTasks: 0,
              error: 'Fehler beim Laden der Daten'
            };
          }
        })
      );

      return {
        workspace: {
          gid: workspaceGid
        },
        teamMembers: teamStats,
        summary: {
          totalOpenTasks: teamStats.reduce((sum, member) => sum + member.openTasks, 0),
          totalCompletedTasks: teamStats.reduce((sum, member) => sum + member.completedTasks, 0),
          totalTasks: teamStats.reduce((sum, member) => sum + member.totalTasks, 0)
        }
      };
    } catch (error) {
      console.error('Fehler beim Erstellen der Team-Statistik:', error);
      throw error;
    }
  }
}

export const asanaService = new AsanaService();
