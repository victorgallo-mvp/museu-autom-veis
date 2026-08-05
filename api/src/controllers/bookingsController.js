const { z } = require('zod');
const bookingsService = require('../services/bookingsService');

const STATUS_VALUES = ['PENDING', 'PAID', 'CANCELED', 'NO_SHOW'];

const bookingInputSchema = z.object({
  groupName: z.string().min(1),
  responsibleName: z.string().min(1),
  responsiblePhone: z.string().min(1),
  scheduledAt: z.coerce.date(),
  expectedPeopleCount: z.number().int().positive(),
  actualPeopleCount: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(STATUS_VALUES).optional().default('PENDING'),
});

const statusSchema = z.object({
  status: z.enum(STATUS_VALUES),
  actualPeopleCount: z.number().int().nonnegative().optional(),
});

const listQuerySchema = z.object({
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const values = Array.isArray(value) ? value : value.split(',');
      return values.map((v) => v.trim()).filter(Boolean);
    }),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().optional(),
});

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  const bookings = await bookingsService.listBookings(filters);
  res.json(bookings);
}

async function create(req, res) {
  const data = bookingInputSchema.parse(req.body);
  const booking = await bookingsService.createBooking(data);
  res.status(201).json(booking);
}

async function getById(req, res) {
  const booking = await bookingsService.getBookingById(req.params.id);
  res.json(booking);
}

async function update(req, res) {
  const data = bookingInputSchema.parse(req.body);
  const booking = await bookingsService.updateBooking(req.params.id, data);
  res.json(booking);
}

async function updateStatus(req, res) {
  const { status, actualPeopleCount } = statusSchema.parse(req.body);
  const booking = await bookingsService.updateBookingStatus(req.params.id, status, actualPeopleCount);
  res.json(booking);
}

async function remove(req, res) {
  await bookingsService.deleteBooking(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, getById, update, updateStatus, remove };
