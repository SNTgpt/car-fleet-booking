import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const authService = {
  login: (data: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/profile').then((r) => r.data),
};
