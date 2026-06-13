export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta?: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiErrorShape {
  status?: number | string;
  data?: {
    message?: string;
    details?: unknown;
  };
  error?: string;
}
