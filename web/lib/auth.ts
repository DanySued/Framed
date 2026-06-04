import crypto from "crypto";

export function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const sig = token.slice(0, dot);
  const message = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return sig === expected;
}
