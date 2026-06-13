import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const notFoundHandler = () => {
  throw new AppError("Route not found", 404);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let details = error.details;

  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = error.flatten().fieldErrors;
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid resource id";
  }

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Database validation failed";
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error?.code === 11000) {
    statusCode = 409;
    message = "Duplicate resource";
    details = error.keyValue;
  }

  const payload: Record<string, unknown> = {
    success: false,
    message,
    ...(details ? { details } : {})
  };

  if (!env.isProduction) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};
