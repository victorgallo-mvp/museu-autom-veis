const { z } = require('zod');
const authService = require('../services/authService');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);
  res.json(result);
}

async function me(req, res) {
  const user = await authService.getUserById(req.userId);
  res.json(user);
}

module.exports = { login, me };
