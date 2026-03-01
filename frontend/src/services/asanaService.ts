import api from './api';

export interface AsanaUser {
  gid: string;
  name: string;
  email?: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface AsanaProject {
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

export interface AsanaTask {
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

export interface AsanaOverview {
  workspace: {
    gid: string;
  };
  tasks: {
    total: number;
    open: number;
    completed: number;
    overdue: number;
    today: number;
    list: AsanaTask[];
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    list: AsanaProject[];
  };
}

export interface AsanaResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface TeamMemberStats {
  user: {
    gid: string;
    name: string;
    email?: string;
  };
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
  error?: string;
}

export interface TeamStats {
  workspace: {
    gid: string;
  };
  teamMembers: TeamMemberStats[];
  summary: {
    totalOpenTasks: number;
    totalCompletedTasks: number;
    totalTasks: number;
  };
}

export const asanaService = {
  async getOverview(workspaceGid?: string): Promise<AsanaOverview> {
    const params = workspaceGid ? { workspace: workspaceGid } : {};
    const response = await api.get<AsanaResponse<AsanaOverview>>('/asana/overview', { params });
    return response.data.data;
  },

  async getWorkspaces(): Promise<AsanaWorkspace[]> {
    const response = await api.get<AsanaResponse<AsanaWorkspace[]>>('/asana/workspaces');
    return response.data.data;
  },

  async getProjects(workspaceGid?: string): Promise<AsanaProject[]> {
    const params = workspaceGid ? { workspace: workspaceGid } : {};
    const response = await api.get<AsanaResponse<AsanaProject[]>>('/asana/projects', { params });
    return response.data.data;
  },

  async getTasks(workspaceGid: string, assignee: string = 'me'): Promise<AsanaTask[]> {
    const response = await api.get<AsanaResponse<AsanaTask[]>>('/asana/tasks', {
      params: { workspace: workspaceGid, assignee }
    });
    return response.data.data;
  },

  async getProjectTasks(projectGid: string): Promise<AsanaTask[]> {
    const response = await api.get<AsanaResponse<AsanaTask[]>>(`/asana/projects/${projectGid}/tasks`);
    return response.data.data;
  },

  async getTask(taskGid: string): Promise<AsanaTask> {
    const response = await api.get<AsanaResponse<AsanaTask>>(`/asana/tasks/${taskGid}`);
    return response.data.data;
  },

  async getTeamStats(workspaceGid?: string): Promise<TeamStats> {
    const params = workspaceGid ? { workspace: workspaceGid } : {};
    const response = await api.get<AsanaResponse<TeamStats>>('/asana/team-stats', { params });
    return response.data.data;
  }
};
