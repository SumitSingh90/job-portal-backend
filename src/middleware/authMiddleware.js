import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret123";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ code: 401, message: "Authorization token required" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ code: 401, message: "Invalid token format" });

    const decoded = jwt.verify(token, SECRET);

    // Ensure this token belongs to a company
    if (decoded.role && decoded.role !== "company")
      return res.status(403).json({ message: "Access denied. Company token required." });

    req.companyId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: "Invalid or expired token" });
  }
};

export default authMiddleware;
