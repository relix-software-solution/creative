export type PaginatedResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type ApiListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type ApiId = string;
