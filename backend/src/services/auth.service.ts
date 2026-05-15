import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errorHandler";

// Precomputed bcrypt hash of a random unrecoverable string, used to keep validation
// time roughly constant when the user does not exist (mitigates user enumeration via timing).
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8.kc1F.0eHwUySV4HOmL1lWxKvF4Hu";

export const validateUser = async (email: string, password: string, organizationId: number) => {
  const user = await prisma.user.findFirst({
    where: { email, organizationId },
    include: { organization: true }
  });

  // Always run bcrypt.compare so failure timing for "no such user" matches "wrong password".
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !ok) throw new ApiError("Invalid credentials", 401);

  if (user.status === "BANNED") throw new ApiError("User is banned", 403);
  if (user.organization.status === "BANNED") throw new ApiError("Organization is banned", 403);

  return user;
};