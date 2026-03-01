import api from './api';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: 'admin' | 'user' | 'viewer';
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data;
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};
