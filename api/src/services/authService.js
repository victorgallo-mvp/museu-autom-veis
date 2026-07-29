const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

const TOKEN_EXPIRATION = '30d';

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Email ou senha invalidos', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Email ou senha invalidos', 401);
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });

  return {
    token,
    user: { id: user.id, email: user.email },
  };
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('Usuario nao encontrado', 404);
  }

  return { id: user.id, email: user.email };
}

module.exports = { login, getUserById };
