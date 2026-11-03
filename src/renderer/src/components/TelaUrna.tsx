import { useState, useEffect, useCallback } from 'react'
import { LogOut, ShieldCheck, Volume2 } from 'lucide-react'
import { Eleicao, Candidato } from '../../../preload/index.d'
import { tocarBipTecla, tocarSomConfirmacao } from '../utils/SomUrna'

interface TelaUrnaProps {
  eleicao: Eleicao
  onSairDaUrna: () => void
}

const TECLAS_NUMERICAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export function TelaUrna({ eleicao, onSairDaUrna }: TelaUrnaProps): React.JSX.Element {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [digitos, setDigitos] = useState('')
  const [votoBranco, setVotoBranco] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [telaFim, setTelaFim] = useState(false)
  const [votosComputadosSessao, setVotosComputadosSessao] = useState(0)

  useEffect(() => {
    window.api.listarCandidatos(eleicao.id).then(setCandidatos)
  }, [eleicao.id])

  const preenchimentoCompleto = digitos.length === eleicao.tamanho_digitos
  const candidatoEscolhido = preenchimentoCompleto
    ? candidatos.find((c) => c.numero === digitos) ?? null
    : null
  const votoNulo = preenchimentoCompleto && !candidatoEscolhido

  const digitarNumero = useCallback(
    (num: string) => {
      if (gravando || telaFim || votoBranco) return
      if (!eleicao.digitos_permitidos.includes(num)) return
      if (digitos.length >= eleicao.tamanho_digitos) return

      tocarBipTecla()
      setDigitos((prev) => prev + num)
    },
    [gravando, telaFim, votoBranco, eleicao.digitos_permitidos, eleicao.tamanho_digitos, digitos.length]
  )

  const acionarBranco = useCallback(() => {
    if (gravando || telaFim) return
    if (digitos.length > 0) {
      alert('Para votar em BRANCO, o campo de voto deve estar vazio. Aperte CORRIGE primeiro.')
      return
    }
    tocarBipTecla()
    setVotoBranco(true)
  }, [gravando, telaFim, digitos.length])

  const acionarCorrige = useCallback(() => {
    if (gravando || telaFim) return
    tocarBipTecla()
    setDigitos('')
    setVotoBranco(false)
  }, [gravando, telaFim])

  const acionarConfirma = useCallback(async () => {
    if (gravando || telaFim) return
    if (!votoBranco && !preenchimentoCompleto) return

    try {
      setGravando(true)

      if (votoBranco) {
        await window.api.registrarVoto(eleicao.id, 'BRANCO', null)
      } else if (candidatoEscolhido) {
        await window.api.registrarVoto(eleicao.id, 'VALIDO', digitos)
      } else {
        await window.api.registrarVoto(eleicao.id, 'NULO', digitos)
      }

      // O voto já está gravado fisicamente no SSD/HD (SQLite WAL + FULL Sync)
      tocarSomConfirmacao()
      setGravando(false)
      setTelaFim(true)
      setVotosComputadosSessao((v) => v + 1)

      // Libera a urna automaticamente para o próximo eleitor após 2,2 segundos
      setTimeout(() => {
        setDigitos('')
        setVotoBranco(false)
        setTelaFim(false)
      }, 2200)
    } catch (err) {
      setGravando(false)
      alert('Erro ao gravar voto: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }, [gravando, telaFim, votoBranco, preenchimentoCompleto, eleicao.id, candidatoEscolhido, digitos])

  // Suporte ao teclado físico do computador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key >= '0' && e.key <= '9') {
        digitarNumero(e.key)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        acionarCorrige()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        acionarConfirma()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [digitarNumero, acionarCorrige, acionarConfirma])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Barra superior discreta para o mesário */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-xs text-zinc-400 mb-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            Gravação Síncrona Ativa (Anti-Queda de Luz)
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            Áudio Sintetizado Ativo
          </span>
          <span className="text-zinc-600">|</span>
          <span>Votos nesta sessão: <strong className="text-zinc-200">{votosComputadosSessao}</strong></span>
        </div>

        <button
          onClick={onSairDaUrna}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Voltar ao Painel Administrativo
        </button>
      </div>

      {/* Gabinete Físico da Urna Eletrônica */}
      <div className="max-w-5xl w-full mx-auto my-auto bg-stone-200 border-b-12 border-r-8 border-stone-400 rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* VISOR LCD (Esquerda - 7 colunas) */}
        <div className="lg:col-span-7 bg-slate-100 border-8 border-stone-400 rounded-xl shadow-inner p-6 flex flex-col justify-between min-h-[420px] text-black relative overflow-hidden">
          {gravando ? (
            <div className="my-auto flex flex-col items-center justify-center space-y-4">
              <p className="text-xl font-bold tracking-widest uppercase">Gravando Voto...</p>
              <div className="w-64 h-6 border-2 border-black p-0.5">
                <div className="h-full bg-emerald-600 animate-pulse w-full" />
              </div>
            </div>
          ) : telaFim ? (
            <div className="my-auto flex flex-col items-center justify-center">
              <span className="text-8xl sm:text-9xl font-black tracking-tighter text-zinc-900">
                FIM
              </span>
              <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mt-4">
                Voto Computado
              </span>
            </div>
          ) : (
            <>
              {/* Cabeçalho do Visor */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Seu voto para
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mt-1 border-b border-zinc-300 pb-2">
                  {eleicao.titulo}
                </h2>
              </div>

              {/* Corpo Central do Visor */}
              <div className="my-auto py-4">
                {votoBranco ? (
                  <div className="text-center py-8">
                    <p className="text-4xl sm:text-5xl font-black tracking-wider text-zinc-900 animate-pulse">
                      VOTO EM BRANCO
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Caixas de Dígitos */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold uppercase w-20">Número:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {Array.from({ length: eleicao.tamanho_digitos }).map((_, idx) => {
                          const char = digitos[idx] || ''
                          const caixaAtual = idx === digitos.length
                          return (
                            <div
                              key={idx}
                              className={`w-12 h-16 border-2 border-black bg-white flex items-center justify-center text-3xl font-mono font-bold shadow-xs ${
                                caixaAtual ? 'animate-pulse ring-2 ring-zinc-400' : ''
                              }`}
                            >
                              {char}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Informações do Candidato ou Nulo */}
                    {preenchimentoCompleto && (
                      <div className="pt-2 space-y-2 animate-fade-in">
                        {candidatoEscolhido ? (
                          <div className="flex items-baseline gap-4">
                            <span className="text-sm font-bold uppercase w-20 shrink-0">
                              Nome:
                            </span>
                            <span className="text-2xl font-extrabold uppercase text-zinc-900">
                              {candidatoEscolhido.nome}
                            </span>
                          </div>
                        ) : (
                          votoNulo && (
                            <div className="space-y-1">
                              <p className="text-xl font-bold uppercase text-zinc-800">
                                Número Errado
                              </p>
                              <p className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-zinc-900 animate-pulse">
                                Voto Nulo
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rodapé de Instruções do Visor */}
              <div className="border-t-2 border-black pt-3 text-xs leading-relaxed">
                {votoBranco || preenchimentoCompleto ? (
                  <>
                    <p className="font-bold">Aperte a tecla:</p>
                    <p>
                      <strong className="text-emerald-800">CONFIRMA</strong> para{' '}
                      <strong>CONFIRMAR</strong> este voto
                    </p>
                    <p>
                      <strong className="text-orange-700">CORRIGE</strong> para{' '}
                      <strong>REINICIAR</strong> este voto
                    </p>
                  </>
                ) : (
                  <p className="text-zinc-600 font-medium">
                    Digite o número do candidato ({eleicao.tamanho_digitos} dígitos) ou aperte{' '}
                    <strong>BRANCO</strong> para votar em branco.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* PAINEL DO TECLADO (Direita - 5 colunas) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Topo de Identificação da Urna */}
          <div className="bg-stone-100 border-2 border-stone-300 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                Simulador Oficial
              </p>
              <p className="text-base font-black uppercase tracking-tight text-stone-800">
                Justiça Eleitoral
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-stone-600">
              <span>Dígitos: {eleicao.tamanho_digitos}</span>
            </div>
          </div>

          {/* Corpo Escuro do Teclado Físico */}
          <div className="bg-zinc-800 border-4 border-zinc-900 rounded-2xl p-6 shadow-inner flex-1 flex flex-col justify-between space-y-6">
            {/* Grade de Números 1 a 9 e 0 centralizado */}
            <div className="grid grid-cols-3 gap-3.5 max-w-[260px] mx-auto w-full">
              {TECLAS_NUMERICAS.map((num) => {
                const permitido = eleicao.digitos_permitidos.includes(num)
                const isZero = num === '0'
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={!permitido || gravando || telaFim}
                    onClick={() => digitarNumero(num)}
                    className={`${isZero ? 'col-start-2' : ''} h-14 rounded-lg font-mono text-2xl font-bold flex items-center pl-4 transition-all ${
                      permitido
                        ? 'bg-zinc-900 text-white border-b-4 border-r-2 border-black shadow-md hover:bg-zinc-800 active:border-b-0 active:translate-y-1 cursor-pointer'
                        : 'bg-zinc-900/40 text-zinc-600 border border-zinc-800/50 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>

            {/* Teclas de Ação: BRANCO, CORRIGE, CONFIRMA */}
            <div className="grid grid-cols-3 gap-2.5 items-end pt-2">
              <button
                type="button"
                disabled={gravando || telaFim}
                onClick={acionarBranco}
                className="h-12 bg-white hover:bg-zinc-100 text-black font-extrabold text-xs uppercase tracking-tighter rounded-lg border-b-4 border-r-2 border-zinc-400 shadow-md active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
              >
                Branco
              </button>

              <button
                type="button"
                disabled={gravando || telaFim}
                onClick={acionarCorrige}
                className="h-12 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-tighter rounded-lg border-b-4 border-r-2 border-orange-800 shadow-md active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
              >
                Corrige
              </button>

              <button
                type="button"
                disabled={gravando || telaFim || (!votoBranco && !preenchimentoCompleto)}
                onClick={acionarConfirma}
                className="h-16 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 disabled:cursor-not-allowed text-black font-extrabold text-xs uppercase tracking-tighter rounded-lg border-b-4 border-r-2 border-emerald-950 shadow-md active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center"
              >
                Confirma
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto text-center text-[11px] text-zinc-500">
        Dica: Você pode votar clicando nos botões com o mouse ou usando o teclado numérico do computador (Enter = Confirma, Backspace = Corrige).
      </div>
    </div>
  )
}