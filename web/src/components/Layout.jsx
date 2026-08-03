import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Wallet, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bookings', label: 'Agendamentos', icon: CalendarDays },
  { to: '/cashflow', label: 'Fluxo de Caixa', icon: Wallet },
  { to: '/settings', label: 'Configuracoes', icon: Settings },
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
      <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-display text-lg text-text-primary leading-tight">
            Museu de Automoveis Antigos
          </h1>
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
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
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
