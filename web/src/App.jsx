function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8">
        <h1 className="font-display text-3xl text-text-primary mb-2">
          Museu de Automoveis Antigos
        </h1>
        <p className="text-text-secondary mb-6">
          Setup do tema concluido: fundo, superficie, tipografia e cores de status.
        </p>
        <div className="flex gap-2 mb-6">
          <span className="px-3 py-1 rounded text-sm bg-success/20 text-success">Pago</span>
          <span className="px-3 py-1 rounded text-sm bg-warning/20 text-warning">Pendente</span>
          <span className="px-3 py-1 rounded text-sm bg-neutral/20 text-neutral">Cancelado</span>
          <span className="px-3 py-1 rounded text-sm bg-error/20 text-error">No-show</span>
        </div>
        <button
          type="button"
          className="bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors"
        >
          Botao de acento
        </button>
      </div>
    </div>
  )
}

export default App
