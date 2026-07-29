const jwt = require('jsonwebtoken');
const AppError = require('../lib/AppError');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token nao fornecido', 401);
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    throw new AppError('Token invalido ou expirado', 401);
  }
}

module.exports = requireAuth;
