import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || "15m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  // In production cookies should be secure unless explicitly opted out (e.g. behind TLS terminator).
  cookieSecure: isProduction ? process.env.COOKIE_SECURE !== "false" : process.env.COOKIE_SECURE === "true",
  // sameSite: keep "lax" by default (SPA cross-origin refresh requires it); allow override.
  cookieSameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none" | undefined) || "lax",
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean)
}