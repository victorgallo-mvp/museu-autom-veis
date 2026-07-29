const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const settingsService = require('./settingsService');
const { calcBookingTotals } = require('../lib/money');

function serialize(booking) {
  const ticketPriceSnapshot = Number(booking.ticketPriceSnapshot);
  const guideCommissionSnapshot = Number(booking.guideCommissionSnapshot);
  const { total, guideCommissionTotal, ownerShareTotal } = calcBookingTotals(
    booking.peopleCount,
    ticketPriceSnapshot,
    guideCommissionSnapshot
  );

  return {
    id: booking.id,
    groupName: booking.groupName,
    responsibleName: booking.responsibleName,
    responsiblePhone: booking.responsiblePhone,
    scheduledAt: booking.scheduledAt,
    peopleCount: booking.peopleCount,
    ticketPriceSnapshot,
    guideCommissionSnapshot,
    total,
    guideCommissionTotal,
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
    throw new AppError('Agendamento nao encontrado', 404);
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
      peopleCount: data.peopleCount,
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
      peopleCount: data.peopleCount,
      notes: data.notes,
      status: data.status,
    },
  });

  return serialize(booking);
}

async function updateBookingStatus(id, status) {
  await getBookingById(id);

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

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
