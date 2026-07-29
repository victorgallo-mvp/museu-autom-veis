import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-10">
      <h1 className="font-display text-2xl text-text-primary mb-2">Dashboard</h1>
      <p className="text-text-secondary mb-6">Logado como {user?.email}</p>
      <button
        type="button"
        onClick={logout}
        className="bg-surface border border-border hover:bg-surface-hover text-text-primary px-4 py-2 rounded transition-colors"
      >
        Sair
      </button>
    </div>
  );
}
