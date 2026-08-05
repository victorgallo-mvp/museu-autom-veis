import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import BookingForm from './pages/BookingForm';
import Settings from './pages/Settings';
import CashFlow from './pages/CashFlow';
import CashflowHistory from './pages/CashflowHistory';
import CachacaSales from './pages/CachacaSales';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/new" element={<BookingForm />} />
          <Route path="/bookings/:id/edit" element={<BookingForm />} />
          <Route path="/cachaca" element={<CachacaSales />} />
          <Route path="/cashflow" element={<CashFlow />} />
          <Route path="/cashflow/history" element={<CashflowHistory />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
