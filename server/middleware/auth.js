const jwt = require('jsonwebtoken');
const { User } = require('../models');

require('dotenv').config({ path: __dirname + '/../.env' });
// Use the same secret as defined in .env (hunar_secret_2025)
const JWT_SECRET = process.env.JWT_SECRET || 'hunar_secret_2025';

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'email', 'role']
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        // Return 401 for all JWT errors so the frontend api.js interceptor
        // automatically clears localStorage and redirects to /login
        const msg = error.message || 'Invalid token';
        console.warn(`[Auth] Token rejected (${error.name}): ${msg}`);
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
};

const adminMiddleware = (req, res, next) => {
    // Requires authenticateToken to be run first so req.user exists
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
    }
};

const adminOrManagerMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied: Admin or Manager role required' });
    }
};

module.exports = { authenticateToken, adminMiddleware, adminOrManagerMiddleware };