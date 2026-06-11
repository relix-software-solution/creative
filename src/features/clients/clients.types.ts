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

export type ClientsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateClientPayload = {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;

export type ClientsListResponse = {
  items: Client[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
