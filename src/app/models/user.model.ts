export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
