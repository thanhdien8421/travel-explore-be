/**
 * Source: Inspired by quendp/g4-mini-project-2 error handling patterns
 * Centralized error handling middleware
 */

import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      status: "error",
      message: "Database error occurred",
    });
  }

  // Default error
  console.error("ERROR 💥", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
