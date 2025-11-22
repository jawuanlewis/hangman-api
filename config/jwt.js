import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export const generateToken = (gameId) => {
  return jwt.sign({ gameId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
