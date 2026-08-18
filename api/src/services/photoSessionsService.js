const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const { calcTotals } = require('../lib/money');

function serialize(session) {
  const amount = Number(session.amount);
  const commission = Number(session.commission);
  const { total, commissionTotal, ownerShareTotal } = calcTotals(1, amount, commission);

  return {
    id: session.id,
    clientName: session.clientName,
    clientPhone: session.clientPhone,
    eventType: session.eventType,
    sessionAt: session.sessionAt,
    amount,
    commission,
    total,
    commissionTotal,
    ownerShareTotal,
    notes: session.notes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function buildWhere({ from, to }) {
  const where = {};

  if (from || to) {
    where.sessionAt = {};
    if (from) where.sessionAt.gte = from;
    if (to) where.sessionAt.lte = to;
  }

  return where;
}

async function listSessions(filters) {
  const sessions = await prisma.photoSession.findMany({
    where: buildWhere(filters),
    orderBy: { sessionAt: 'desc' },
  });

  return sessions.map(serialize);
}

async function getSessionById(id) {
  const session = await prisma.photoSession.findUnique({ where: { id } });

  if (!session) {
    throw new AppError('Sessão de fotos não encontrada', 404);
  }

  return session;
}

async function createSession(data) {
  const session = await prisma.photoSession.create({
    data: {
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      eventType: data.eventType,
      sessionAt: data.sessionAt,
      amount: data.amount,
      commission: data.commission,
      notes: data.notes,
    },
  });

  return serialize(session);
}

async function updateSession(id, data) {
  await getSessionById(id);

  const session = await prisma.photoSession.update({
    where: { id },
    data: {
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      eventType: data.eventType,
      sessionAt: data.sessionAt,
      amount: data.amount,
      commission: data.commission,
      notes: data.notes,
    },
  });

  return serialize(session);
}

async function deleteSession(id) {
  await getSessionById(id);
  await prisma.photoSession.delete({ where: { id } });
}

module.exports = {
  listSessions,
  createSession,
  updateSession,
  deleteSession,
  serializeSession: serialize,
};
