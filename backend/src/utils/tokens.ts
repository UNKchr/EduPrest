import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";

type AccessPayload = {
  sub: string;
  role: string;
};

type RefreshPayload = {
  sub: string;
  jti: string;
};

export const signAccessToken = (userId: number, role: string) => {
  const options: SignOptions = { expiresIn: env.jwtAccessTtl as SignOptions["expiresIn"] };
  const payload: AccessPayload = { sub: String(userId), role };
  return jwt.sign(payload, env.jwtAccessSecret, options);
};

export const signRefreshToken = (userId: number) => {
  const jti = uuidv4();
  const options: SignOptions = { expiresIn: env.jwtRefreshTtl as SignOptions["expiresIn"] };
  const payload: RefreshPayload = { sub: String(userId), jti };
  const token = jwt.sign(payload, env.jwtRefreshSecret, options);
  return { token, jti };
};

export const verifyRefreshToken = (token: string) => {
  const decoded = jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
  if (!decoded.sub || typeof decoded.sub !== "string" || !decoded.jti) {
    throw new Error("Invalid refresh token payload");
  }
  return { sub: Number(decoded.sub), jti: decoded.jti as string };
};