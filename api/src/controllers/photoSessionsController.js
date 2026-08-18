const { z } = require('zod');
const photoSessionsService = require('../services/photoSessionsService');

const EVENT_TYPE_VALUES = ['WEDDING', 'BIRTHDAY', 'OTHER'];

const sessionInputSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  eventType: z.enum(EVENT_TYPE_VALUES),
  sessionAt: z.coerce.date(),
  amount: z.number().nonnegative(),
  commission: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  const sessions = await photoSessionsService.listSessions(filters);
  res.json(sessions);
}

async function create(req, res) {
  const data = sessionInputSchema.parse(req.body);
  const session = await photoSessionsService.createSession(data);
  res.status(201).json(session);
}

async function update(req, res) {
  const data = sessionInputSchema.parse(req.body);
  const session = await photoSessionsService.updateSession(req.params.id, data);
  res.json(session);
}

async function remove(req, res) {
  await photoSessionsService.deleteSession(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
