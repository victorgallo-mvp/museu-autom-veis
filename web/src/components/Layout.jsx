import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BottleWine,
  Camera,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e) {
      if (e.key === 'Escape') setSidebarOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen lg:flex">
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-sidebar border-b border-sidebar-border px-4 py-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="p-1.5 -ml-1.5 rounded text-sidebar-text-secondary hover:bg-sidebar-hover hover:text-sidebar-text transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="font-display text-base text-accent leading-tight">
          Garagem do Automóvel
        </span>
      </header>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 overflow-y-auto bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ease-out lg:static lg:shrink-0 lg:translate-x-0 lg:transition-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative p-6 border-b border-sidebar-border flex flex-col items-center text-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded text-sidebar-text-secondary hover:bg-sidebar-hover hover:text-sidebar-text transition-colors"
          >
            <X size={20} />
          </button>
          <img src="/logo.png" alt="Garagem do Automóvel" className="w-24 h-auto" />
          <h1 className="font-display text-lg text-accent leading-tight">Garagem do Automóvel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
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

      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
