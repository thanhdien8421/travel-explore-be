import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.error("No token provided");
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    console.log("Verifying token with JWT_SECRET:", JWT_SECRET);
    const user = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log("Token verified successfully, user:", user);
    req.user = user;
    next();
  } catch (error: unknown) {
    console.error("Token verification failed:", error);
    res.status(403).json({ error: "Invalid token" });
  }
};
