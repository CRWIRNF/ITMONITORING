import api from './api';

export interface VersionChange {
  version: string;
  date: string;
  changes: string[];
  type: 'release' | 'feature' | 'bugfix' | 'security';
}

export interface VersionInfo {
  version: string;
  releaseDate: string;
  changelog: VersionChange[];
}

export const versionService = {
  async getVersion(): Promise<VersionInfo> {
    const response = await api.get('/version');
    return response.data.data;
  }
};
