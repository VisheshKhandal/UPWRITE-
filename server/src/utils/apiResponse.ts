import type { Response } from "express";

interface Meta {
  [key: string]: unknown;
}

export const sendSuccess = (
  res: Response,
  data: unknown = null,
  message = "Success",
  statusCode = 200,
  meta?: Meta
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {})
  });
};
