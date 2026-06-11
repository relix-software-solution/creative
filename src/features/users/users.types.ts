export type UserRole = "ADMIN" | "STAFF" | "CLIENT_VIEWER" | string;

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED" | string;

export type User = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  status?: UserStatus;
  clientId?: string | null;
  createdAt?: string;
  updatedAt?: string;

  client?: {
    id: string;
    name: string;
  } | null;
};

export type UsersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  clientId?: string;
};

export type UsersListResponse = {
  items: User[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CreateUserPayload = {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  role: "STAFF" | "CLIENT_VIEWER";
  clientId?: string;
};

export type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: "STAFF" | "CLIENT_VIEWER";
  clientId?: string | null;
};

export type ResetUserPasswordPayload = {
  newPassword: string;
};
