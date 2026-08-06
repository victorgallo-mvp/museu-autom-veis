const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const settingsService = require('./settingsService');
const { calcTotals } = require('../lib/money');

function effectiveCount(booking) {
  return booking.actualPeopleCount ?? booking.expectedPeopleCount;
}

function serialize(booking) {
  const ticketPriceSnapshot = Number(booking.ticketPriceSnapshot);
  const guideCommissionSnapshot = Number(booking.guideCommissionSnapshot);
  const { total, commissionTotal, ownerShareTotal } = calcTotals(
    effectiveCount(booking),
    ticketPriceSnapshot,
    guideCommissionSnapshot
  );

  return {
    id: booking.id,
    groupName: booking.groupName,
    responsibleName: booking.responsibleName,
    responsiblePhone: booking.responsiblePhone,
    scheduledAt: booking.scheduledAt,
    expectedPeopleCount: booking.expectedPeopleCount,
    actualPeopleCount: booking.actualPeopleCount,
    ticketPriceSnapshot,
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
      expectedPeopleCount: data.expectedPeopleCount,
      actualPeopleCount: data.actualPeopleCount,
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
      expectedPeopleCount: data.expectedPeopleCount,
      actualPeopleCount: data.actualPeopleCount,
      notes: data.notes,
      status: data.status,
    },
  });

  return serialize(booking);
}

async function updateBookingStatus(id, status, actualPeopleCount) {
  const existing = await prisma.booking.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  const data = { status };

  if (status === 'PAID') {
    data.actualPeopleCount = actualPeopleCount ?? existing.expectedPeopleCount;
  } else if (status === 'NO_SHOW') {
    data.actualPeopleCount = 0;
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
};
