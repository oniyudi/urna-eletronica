import { useState } from 'react'
import { X, CheckSquare, Square, AlertCircle } from 'lucide-react'
import { Eleicao } from '../../../preload/index.d'

interface ModalNovaEleicaoProps {
  onFechar: () => void
  onEleicaoCriada: (eleicao: Eleicao) => void
}

const DIGITOS_DISPONIVEIS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function ModalNovaEleicao({ onFechar, onEleicaoCriada }: ModalNovaEleicaoProps): React.JSX.Element {
  const [titulo, setTitulo] = useState('')
  const [tamanhoDigitos, setTamanhoDigitos] = useState(2)
  const [digitosSelecionados, setDigitosSelecionados] = useState<string[]>(DIGITOS_DISPONIVEIS)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const alternarDigito = (digito: string): void => {
    if (digitosSelecionados.includes(digito)) {
      if (digitosSelecionados.length === 1) {
        setErro('A eleição precisa de ao menos um dígito permitido.')
        return
      }
      setDigitosSelecionados(digitosSelecionados.filter((d) => d !== digito))
    } else {
      setDigitosSelecionados([...digitosSelecionados, digito].sort())
    }
    setErro(null)
  }

  const selecionarTodos = (): void => setDigitosSelecionados(DIGITOS_DISPONIVEIS)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setErro(null)

    if (!titulo.trim()) {
      setErro('Informe o título da eleição.')
      return
    }

    try {
      setCarregando(true)
      const nova = await window.api.criarEleicao(
        titulo,
        tamanhoDigitos,
        digitosSelecionados.join('')
      )
      onEleicaoCriada(nova)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao criar eleição.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white">Criar Nova Eleição</h2>
          <button
            onClick={onFechar}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {erro && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Título da Eleição
            </label>
            <input
              type="text"
              placeholder="Ex: Representante de Turma 2026"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Quantidade de Dígitos por Candidato
              </label>
              <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                {tamanhoDigitos} {tamanhoDigitos === 1 ? 'dígito' : 'dígitos'}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={tamanhoDigitos}
              onChange={(e) => setTamanhoDigitos(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono mt-1 px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Dígitos Aceitos no Teclado
              </label>
              <button
                type="button"
                onClick={selecionarTodos}
                className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                Marcar Todos
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {DIGITOS_DISPONIVEIS.map((d) => {
                const ativo = digitosSelecionados.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => alternarDigito(d)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-mono text-sm border transition-all cursor-pointer ${
                      ativo
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    {ativo ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{d}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Salvando...' : 'Criar Eleição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}