import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BottleWine,
  Camera,
  Wallet,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bookings', label: 'Agendamentos', icon: CalendarDays },
  { to: '/cachaca', label: 'Cachaças', icon: BottleWine },
  { to: '/fotos', label: 'Fotos', icon: Camera },
  { to: '/cashflow', label: 'Fluxo de Caixa', icon: Wallet },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border flex flex-col items-center text-center gap-3">
          <img src="/logo.png" alt="Garagem do Automóvel" className="w-24 h-auto" />
          <h1 className="font-display text-lg text-accent leading-tight">Garagem do Automóvel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-sidebar-text-secondary hover:bg-sidebar-hover hover:text-sidebar-text'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-sidebar-text-secondary hover:bg-sidebar-hover hover:text-sidebar-text transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
