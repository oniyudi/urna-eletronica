import { useState, useEffect } from 'react'
import { Plus, Vote, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { Eleicao } from '../../preload/index.d'
import { ModalNovaEleicao } from './components/ModalNovaEleicao'
import { DetalhesEleicao } from './components/DetalhesEleicao'

export default function App(): React.JSX.Element {
  const [eleicoes, setEleicoes] = useState<Eleicao[]>([])
  const [eleicaoSelecionada, setEleicaoSelecionada] = useState<Eleicao | null>(null)
  const [eleicaoEmAndamento, setEleicaoEmAndamento] = useState<Eleicao | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  const carregarDados = async (): Promise<void> => {
    const todas = await window.api.listarEleicoes()
    const ativa = await window.api.buscarEleicaoEmAndamento()
    setEleicoes(todas)
    setEleicaoEmAndamento(ativa)

    if (eleicaoSelecionada) {
      const atualizada = todas.find((e) => e.id === eleicaoSelecionada.id)
      if (atualizada) setEleicaoSelecionada(atualizada)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-400 w-10 h-10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Sistema de Urna Eletrônica</h1>
            <p className="text-[11px] text-zinc-400">Terminal de Gestão Offline</p>
          </div>
        </div>

        {!eleicaoSelecionada && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Eleição
          </button>
        )}
      </header>

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {eleicaoEmAndamento && (!eleicaoSelecionada || eleicaoSelecionada.id !== eleicaoEmAndamento.id) && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  Eleição em Andamento Detectada
                </h4>
                <p className="text-xs text-amber-300/80">
                  "{eleicaoEmAndamento.titulo}" está aberta para votação.
                </p>
              </div>
            </div>
            <button
              onClick={() => setEleicaoSelecionada(eleicaoEmAndamento)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Retomar Gestão
            </button>
          </div>
        )}

        {eleicaoSelecionada ? (
          <DetalhesEleicao
            eleicao={eleicaoSelecionada}
            onVoltar={() => setEleicaoSelecionada(null)}
            onAtualizarStatus={(atualizada) => {
              setEleicaoSelecionada(atualizada)
              carregarDados()
            }}
            onAbrirUrna={(eleicao) => {
              alert(`Modo Urna acionado para a eleição: ${eleicao.titulo} (Fase 5)`)
            }}
          />
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Eleições Registradas</h2>

            {eleicoes.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                <Vote className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma eleição criada ainda.</p>
                <p className="text-xs mt-1">Clique no botão superior para criar a primeira eleição.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {eleicoes.map((eleicao) => (
                  <div
                    key={eleicao.id}
                    onClick={() => setEleicaoSelecionada(eleicao)}
                    className="p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {eleicao.titulo}
                        </h3>
                        {eleicao.status === 'RASCUNHO' && (
                          <span className="text-[10px] font-mono font-semibold uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-700">
                            Rascunho
                          </span>
                        )}
                        {eleicao.status === 'EM_ANDAMENTO' && (
                          <span className="text-[10px] font-mono font-semibold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-800 animate-pulse">
                            Em Andamento
                          </span>
                        )}
                        {eleicao.status === 'ENCERRADA' && (
                          <span className="text-[10px] font-mono font-semibold uppercase bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md border border-zinc-700">
                            Encerrada
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                        <span>{eleicao.tamanho_digitos} dígitos</span>
                        <span>•</span>
                        <span>Permitidos: [{eleicao.digitos_permitidos}]</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3" />
                          {eleicao.criado_em}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {modalAberto && (
          <ModalNovaEleicao
            onFechar={() => setModalAberto(false)}
            onEleicaoCriada={(nova) => {
              setModalAberto(false)
              carregarDados()
              setEleicaoSelecionada(nova)
            }}
          />
        )}
      </main>
    </div>
  )
}