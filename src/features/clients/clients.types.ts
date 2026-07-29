export type Client = {
  id: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientAccessAccount = {
  id: string;
  clientId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "CLIENT_VIEWER";
  status: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

export type CreateClientPayload = {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;

export type CreateClientAccessAccountPayload = {
  fullName?: string;
  email: string;
  phone?: string;
  password: string;
};

export type UpdateClientAccessAccountPayload = {
  fullName?: string;
  email?: string;
  phone?: string | null;
};

export type CreateClientWithAccessAccountPayload = {
  client: CreateClientPayload;
  accessAccount: CreateClientAccessAccountPayload;
};

export type CreateClientWithAccessAccountResponse = {
  client: Client;
  accessAccount: ClientAccessAccount;
};

export type SaveClientAccessAccountPayload = {
  clientId: string;
  accountExists: boolean;
  account: {
    fullName: string;
    email: string;
    phone?: string;
  };
  newPassword?: string;
};

export type ClientsListResponse = {
  items: Client[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type SetClientActiveStatusPayload = {
  id: string;
  isActive: boolean;
};
