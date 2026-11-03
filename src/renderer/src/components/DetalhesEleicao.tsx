import { useState, useEffect } from 'react'
import { ArrowLeft, UserPlus, Trash2, Play, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import { Eleicao, Candidato } from '../../../preload/index.d'

interface DetalhesEleicaoProps {
  eleicao: Eleicao
  onVoltar: () => void
  onAtualizarStatus: (eleicaoAtualizada: Eleicao) => void
  onAbrirUrna: (eleicao: Eleicao) => void
}

export function DetalhesEleicao({
  eleicao,
  onVoltar,
  onAtualizarStatus,
  onAbrirUrna
}: DetalhesEleicaoProps): React.JSX.Element {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [nome, setNome] = useState('')
  const [numero, setNumero] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const carregarCandidatos = async (): Promise<void> => {
    const lista = await window.api.listarCandidatos(eleicao.id)
    setCandidatos(lista)
  }

  useEffect(() => {
    carregarCandidatos()
  }, [eleicao.id])

  const handleCadastrarCandidato = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setErro(null)

    try {
      setCarregando(true)
      await window.api.cadastrarCandidato(eleicao.id, nome, numero)
      setNome('')
      setNumero('')
      await carregarCandidatos()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao cadastrar candidato.')
    } finally {
      setCarregando(false)
    }
  }

  const handleRemoverCandidato = async (id: number): Promise<void> => {
    if (confirm('Deseja realmente remover este candidato?')) {
      await window.api.removerCandidato(id)
      await carregarCandidatos()
    }
  }

  const handleIniciarVotacao = async (): Promise<void> => {
    if (candidatos.length === 0) {
      setErro('Cadastre ao menos um candidato antes de iniciar a votação.')
      return
    }

    if (confirm('Ao iniciar a votação, não será mais possível adicionar ou remover candidatos. Deseja prosseguir?')) {
      try {
        const atualizada = await window.api.alterarStatusEleicao(eleicao.id, 'EM_ANDAMENTO')
        onAtualizarStatus(atualizada)
      } catch (err: unknown) {
        setErro(err instanceof Error ? err.message : 'Erro ao iniciar votação.')
      }
    }
  }

  const handleEncerrarVotacao = async (): Promise<void> => {
    if (confirm('Deseja realmente encerrar a eleição? Esta ação é definitiva.')) {
      try {
        const atualizada = await window.api.alterarStatusEleicao(eleicao.id, 'ENCERRADA')
        onAtualizarStatus(atualizada)
      } catch (err: unknown) {
        setErro(err instanceof Error ? err.message : 'Erro ao encerrar.')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onVoltar}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista
        </button>

        <div className="flex items-center gap-3">
          {eleicao.status === 'RASCUNHO' && (
            <button
              onClick={handleIniciarVotacao}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Abrir Votação na Urna
            </button>
          )}

          {eleicao.status === 'EM_ANDAMENTO' && (
            <>
              <button
                onClick={() => onAbrirUrna(eleicao)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                Ir para a Urna
              </button>
              <button
                onClick={handleEncerrarVotacao}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Encerrar Eleição
              </button>
            </>
          )}

          {eleicao.status === 'ENCERRADA' && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Eleição Encerrada
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{eleicao.titulo}</h1>
            <p className="text-xs text-zinc-400 mt-1">Criada em: {eleicao.criado_em}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700">
              {eleicao.tamanho_digitos} dígitos
            </span>
            <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700">
              Dígitos válidos: {eleicao.digitos_permitidos.split('').join(' ')}
            </span>
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 p-3 mt-4 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {eleicao.status === 'RASCUNHO' && (
          <form onSubmit={handleCadastrarCandidato} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nome do Candidato"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500"
            />
            <input
              type="text"
              maxLength={eleicao.tamanho_digitos}
              placeholder={`Nº (${eleicao.tamanho_digitos} dígitos)`}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 font-mono focus:outline-hidden focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={carregando}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar
            </button>
          </form>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">
          Candidatos Registrados ({candidatos.length})
        </h2>

        {candidatos.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            Nenhum candidato cadastrado para esta eleição até o momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidatos.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">
                    {c.numero}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{c.nome}</h3>
                    <p className="text-xs text-zinc-500">ID: {c.id}</p>
                  </div>
                </div>

                {eleicao.status === 'RASCUNHO' && (
                  <button
                    onClick={() => handleRemoverCandidato(c.id)}
                    className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}