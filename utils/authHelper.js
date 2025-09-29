import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function getUserFromToken(event) {
  const authHeader = event.headers?.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Missing token");
  return jwt.verify(token, JWT_SECRET);
}
