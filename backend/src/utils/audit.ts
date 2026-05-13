import { redis } from "../config/redis";
import { logAction } from "../services/audit.service";

const SECURITY_WINDOW_SECONDS = Number(process.env.SECURITY_WINDOW_SECONDS ?? 900);
const SECURITY_ALERT_THRESHOLD = Number(process.env.SECURITY_ALERT_THRESHOLD ?? 5);
const SUSPICIOUS_ACTION_PATTERN = /(INVALID|FORBIDDEN|BLOCKED|DUPLICATE|ALREADY|NOT_FOUND|SELF|MISSING)/;

const trackSuspiciousAttempt = async (
  action: string,
  userId: number,
  entityId: number,
  organizationId: number
) => {
  if (!SUSPICIOUS_ACTION_PATTERN.test(action)) return;
  const key = `sec:invalid:${organizationId}:${userId}:${action}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, SECURITY_WINDOW_SECONDS);
  }
  if (count === SECURITY_ALERT_THRESHOLD) {
    await logAction(`SECURITY_ALERT:${action}`, userId, "Security", entityId, organizationId);
  }
};

export const safeAuditLog = async (
  action: string,
  userId: number,
  entity: string,
  entityId: number,
  organizationId: number
) => {
  try {
    await logAction(action, userId, entity, entityId, organizationId);
    await trackSuspiciousAttempt(action, userId, entityId, organizationId);
  } catch {
    // ignore audit failures to avoid masking main error
  }
};
