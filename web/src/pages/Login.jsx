import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      toast.error('Email ou senha invalidos');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-border rounded-lg p-8"
      >
        <h1 className="font-display text-2xl text-text-primary mb-1">
          Museu de Automoveis Antigos
        </h1>
        <p className="text-text-secondary text-sm mb-6">Entre com suas credenciais</p>

        <label className="block text-sm text-text-secondary mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className="w-full mb-4 px-3 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-accent"
        />

        <label className="block text-sm text-text-secondary mb-1" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full mb-6 px-3 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
