import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(request, _response, next) {
  const authorization = request.get("authorization");
  const [scheme, token] = authorization?.split(" ") || [];

  if (scheme !== "Bearer" || !token) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!Number.isInteger(payload.user_id)) throw new Error("Invalid token subject");

    request.user = { userId: payload.user_id };
    request.auth = request.user;
    return next();
  } catch {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    return next(error);
  }
}