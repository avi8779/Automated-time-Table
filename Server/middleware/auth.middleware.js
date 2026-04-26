import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "timetable_secret_key";

/* Verify JWT and attach user to req */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Not authenticated" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/* Role guard — usage: restrictTo("admin") or restrictTo("admin","teacher") */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ success: false, message: "Access denied" });
  next();
};