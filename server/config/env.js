import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const numberFromEnv = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

export const env = {
  port: numberFromEnv("PORT", 5000),
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: numberFromEnv("DB_PORT", 3306),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "lifelog_db",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret-change-me",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
