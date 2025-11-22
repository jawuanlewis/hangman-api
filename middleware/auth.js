import { verifyToken } from '../config/jwt.js';
import { getGameById } from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    const decoded = verifyToken(token);
    req.gameId = decoded.gameId;

    // Verify game exists in database
    const game = await getGameById(decoded.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found or expired',
      });
    }

    req.game = game;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: error.message || 'Invalid token',
    });
  }
};
