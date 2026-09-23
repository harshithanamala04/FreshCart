export interface User {
  id: number;
  username: string;
  email?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
