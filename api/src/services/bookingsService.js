const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const settingsService = require('./settingsService');
const { calcVisitTotals } = require('../lib/money');
const { expectedCounts, actualCounts, effectiveCounts } = require('../lib/bookingCounts');

// Totais financeiros de um agendamento (usa a contagem real quando existe).
function bookingAmounts(booking) {
  const counts = effectiveCounts(booking);
  const totals = calcVisitTotals(
    counts,
    Number(booking.ticketPriceSnapshot),
    Number(booking.guideCommissionSnapshot)
  );
  return { counts, ...totals };
}

function serialize(booking) {
  const ticketPriceSnapshot = Number(booking.ticketPriceSnapshot);
  const guideCommissionSnapshot = Number(booking.guideCommissionSnapshot);
  const { counts, total, commissionTotal, ownerShareTotal, halfPrice, payingCount } =
    bookingAmounts(booking);
  const expected = expectedCounts(booking);
  const actual = actualCounts(booking);

  return {
    id: booking.id,
    groupName: booking.groupName,
    responsibleName: booking.responsibleName,
    responsiblePhone: booking.responsiblePhone,
    scheduledAt: booking.scheduledAt,
    expectedPeopleCount: booking.expectedPeopleCount,
    expectedAdults: expected.adults,
    expectedChildrenHalf: expected.childrenHalf,
    expectedChildrenFree: expected.childrenFree,
    actualPeopleCount: booking.actualPeopleCount,
    actualAdults: actual ? actual.adults : null,
    actualChildrenHalf: actual ? actual.childrenHalf : null,
    actualChildrenFree: actual ? actual.childrenFree : null,
    counts,
    payingCount,
    ticketPriceSnapshot,
    halfTicketPriceSnapshot: halfPrice,
    guideCommissionSnapshot,
    total,
    guideCommissionTotal: commissionTotal,
    ownerShareTotal,
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

function buildWhere({ status, from, to, search }) {
  const where = {};

  if (status && status.length > 0) {
    where.status = { in: status };
  }

  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = from;
    if (to) where.scheduledAt.lte = to;
  }

  if (search) {
    where.OR = [
      { groupName: { contains: search, mode: 'insensitive' } },
      { responsibleName: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function assertBreakdown(total, childrenHalf, childrenFree, label) {
  if (childrenHalf + childrenFree > total) {
    throw new AppError(
      `A soma de crianças não pode ser maior que a quantidade ${label} de pessoas`,
      400
    );
  }
}

// Monta os campos de contagem real a partir do payload. Quando o total real não
// vem, não mexemos nas contagens reais (undefined = Prisma ignora o campo).
function actualFields(data) {
  if (data.actualPeopleCount === undefined) {
    return {};
  }
  if (data.actualPeopleCount === null) {
    return { actualPeopleCount: null, actualChildrenHalf: 0, actualChildrenFree: 0 };
  }
  const childrenHalf = data.actualChildrenHalf ?? 0;
  const childrenFree = data.actualChildrenFree ?? 0;
  assertBreakdown(data.actualPeopleCount, childrenHalf, childrenFree, 'real');
  return {
    actualPeopleCount: data.actualPeopleCount,
    actualChildrenHalf: childrenHalf,
    actualChildrenFree: childrenFree,
  };
}

function expectedFields(data) {
  const childrenHalf = data.expectedChildrenHalf ?? 0;
  const childrenFree = data.expectedChildrenFree ?? 0;
  assertBreakdown(data.expectedPeopleCount, childrenHalf, childrenFree, 'prevista');
  return {
    expectedPeopleCount: data.expectedPeopleCount,
    expectedChildrenHalf: childrenHalf,
    expectedChildrenFree: childrenFree,
  };
}

async function listBookings(filters) {
  const bookings = await prisma.booking.findMany({
    where: buildWhere(filters),
    orderBy: { scheduledAt: 'asc' },
  });

  return bookings.map(serialize);
}

async function getBookingById(id) {
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  return serialize(booking);
}

async function createBooking(data) {
  const settings = await settingsService.getSettings();

  const booking = await prisma.booking.create({
    data: {
      groupName: data.groupName,
      responsibleName: data.responsibleName,
      responsiblePhone: data.responsiblePhone,
      scheduledAt: data.scheduledAt,
      ...expectedFields(data),
      ...actualFields(data),
      notes: data.notes,
      status: data.status,
      ticketPriceSnapshot: settings.ticketPrice,
      guideCommissionSnapshot: settings.guideCommissionPerPerson,
    },
  });

  return serialize(booking);
}

async function updateBooking(id, data) {
  await getBookingById(id);

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      groupName: data.groupName,
      responsibleName: data.responsibleName,
      responsiblePhone: data.responsiblePhone,
      scheduledAt: data.scheduledAt,
      ...expectedFields(data),
      ...actualFields(data),
      notes: data.notes,
      status: data.status,
    },
  });

  return serialize(booking);
}

async function updateBookingStatus(id, status, actual = {}) {
  const existing = await prisma.booking.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  const data = { status };

  if (status === 'PAID') {
    if (actual.actualPeopleCount === undefined) {
      // Sem contagem real informada: assume que veio exatamente o previsto.
      data.actualPeopleCount = existing.expectedPeopleCount;
      data.actualChildrenHalf = existing.expectedChildrenHalf;
      data.actualChildrenFree = existing.expectedChildrenFree;
    } else {
      Object.assign(data, actualFields(actual));
    }
  } else if (status === 'NO_SHOW') {
    data.actualPeopleCount = 0;
    data.actualChildrenHalf = 0;
    data.actualChildrenFree = 0;
  }

  const booking = await prisma.booking.update({ where: { id }, data });

  return serialize(booking);
}

async function deleteBooking(id) {
  await getBookingById(id);
  await prisma.booking.delete({ where: { id } });
}

module.exports = {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  serializeBooking: serialize,
  bookingAmounts,
};
