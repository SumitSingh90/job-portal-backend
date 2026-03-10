import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret123";

const userAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Authorization token required" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Invalid token format" });

    const decoded = jwt.verify(token, SECRET);

    // Ensure this token belongs to a user
    if (decoded.role && decoded.role !== "user")
      return res.status(403).json({ message: "Access denied. User token required." });

    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default userAuthMiddleware;
