import type { Request } from "express";

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (req: Request, maxLimit = 50): PaginationOptions => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const requestedLimit = Math.max(Number(req.query.limit) || 20, 1);
  const limit = Math.min(requestedLimit, maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

export const paginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit)
});
