const jwt = require("jsonwebtoken");
const User = require("./models/user");

const SECRET = process.env.JWT_SECRET || "dev-secret";
const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

function generateToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES });
}

// Extract and verify user from request — returns user or null
async function getAuthUser(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;

  try {
    const decoded = jwt.verify(header.slice(7), SECRET);
    return await User.findById(decoded.sub);
  } catch {
    return null;
  }
}

// Middleware-style: returns error response or null (call continues)
async function requireAuth(req, res) {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentification requise." });
    return null;
  }
  return user;
}

// CORS preflight handler
function handleCors(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

// Parse JSON body for Vercel serverless
async function parseBody(req) {
  if (req.body) return req.body;
  return {};
}

module.exports = { generateToken, getAuthUser, requireAuth, handleCors, parseBody };
