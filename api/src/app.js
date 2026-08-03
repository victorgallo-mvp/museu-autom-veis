const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const expensesRoutes = require('./routes/expensesRoutes');
const payoutsRoutes = require('./routes/payoutsRoutes');
const cashflowRoutes = require('./routes/cashflowRoutes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/settings', settingsRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/expenses', expensesRoutes);
app.use('/payouts', payoutsRoutes);
app.use('/cashflow', cashflowRoutes);

app.use(errorHandler);

module.exports = app;
