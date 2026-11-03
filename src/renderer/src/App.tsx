import { useState, useEffect } from 'react'
import { Vote, ShieldCheck } from 'lucide-react'

function App(): React.JSX.Element {
  const [totalEleicoes, setTotalEleicoes] = useState<number | null>(null)

  useEffect(() => {
    window.api.listarEleicoes().then((lista) => {
      setTotalEleicoes(lista.length)
    })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="bg-emerald-500/10 text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Vote className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Sistema de Urna Eletrônica</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Ponte IPC + SQLite ativa! Eleições salvas no banco:{' '}
          <strong className="text-white">{totalEleicoes ?? 'Carregando...'}</strong>
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 py-2 px-4 rounded-lg border border-emerald-800/50">
          <ShieldCheck className="w-4 h-4" />
          <span>Pronto para construir o Painel Administrativo</span>
        </div>
      </div>
    </div>
  )
}

export default App