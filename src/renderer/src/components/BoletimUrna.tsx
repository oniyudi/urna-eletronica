import { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Trophy,
  Users,
  CheckCircle2,
  Ban,
  FileText,
  RefreshCw
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { ApuracaoEleicao } from '../../../preload'

interface BoletimUrnaProps {
  eleicaoId: number
}

export function BoletimUrna({ eleicaoId }: BoletimUrnaProps): React.JSX.Element {
  const [apuracao, setApuracao] = useState<ApuracaoEleicao | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregarApuracao = async (): Promise<void> => {
    setCarregando(true)
    try {
      const dados = await window.api.obterApuracao(eleicaoId)
      setApuracao(dados)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarApuracao()
  }, [eleicaoId])

  if (carregando || !apuracao) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 text-sm">
        Calculando apuração dos votos...
      </div>
    )
  }

  const { eleicao, totalVotos, votosValidos, votosBrancos, votosNulos, candidatos } = apuracao

  // Identifica o maior número de votos para destacar o 1º colocado (ou empate)
  const maiorVotacao = candidatos.length > 0 ? Math.max(...candidatos.map((c) => c.votos)) : 0

  const calcularPercentual = (votos: number, base: number): string => {
    if (base === 0) return '0,0%'
    return ((votos / base) * 100).toFixed(1).replace('.', ',') + '%'
  }

  // Gera e baixa o arquivo Excel (.xlsx) offline
  const exportarParaExcel = (): void => {
    // Aba 1: Resultado por Candidato
    const dadosCandidatos = candidatos.map((c, index) => ({
      Posição: `${index + 1}º`,
      Número: c.numero,
      Candidato: c.nome,
      'Votos Recebidos': c.votos,
      '% Votos Válidos': calcularPercentual(c.votos, votosValidos),
      '% Total Geral': calcularPercentual(c.votos, totalVotos)
    }))

    // Aba 2: Resumo Geral da Eleição
    const dadosResumo = [
      { Indicador: 'Título da Eleição', Valor: eleicao.titulo },
      { Indicador: 'Status', Valor: eleicao.status },
      { Indicador: 'Data de Criação', Valor: eleicao.criado_em },
      { Indicador: 'Data de Encerramento', Valor: eleicao.encerrado_em || 'Em aberto' },
      { Indicador: 'Total de Votos Computados', Valor: totalVotos },
      {
        Indicador: 'Votos Válidos (Nominais)',
        Valor: `${votosValidos} (${calcularPercentual(votosValidos, totalVotos)})`
      },
      {
        Indicador: 'Votos em Branco',
        Valor: `${votosBrancos} (${calcularPercentual(votosBrancos, totalVotos)})`
      },
      {
        Indicador: 'Votos Nulos',
        Valor: `${votosNulos} (${calcularPercentual(votosNulos, totalVotos)})`
      }
    ]

    const workbook = XLSX.utils.book_new()

    const abaCandidatos = XLSX.utils.json_to_sheet(dadosCandidatos)
    const abaResumo = XLSX.utils.json_to_sheet(dadosResumo)

    // Ajusta a largura das colunas para ficar legível ao abrir no Excel
    abaCandidatos['!cols'] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 35 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 }
    ]
    abaResumo['!cols'] = [{ wch: 30 }, { wch: 40 }]

    XLSX.utils.book_append_sheet(workbook, abaCandidatos, 'Resultado Candidatos')
    XLSX.utils.book_append_sheet(workbook, abaResumo, 'Resumo da Eleição')

    // Sanitiza o nome do arquivo
    const nomeSeguro = eleicao.titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')

    XLSX.writeFile(workbook, `Apuracao_${nomeSeguro}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Apuração + Botão de Exportar Excel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Boletim de Urna e Apuração
            </h2>
            <p className="text-xs text-zinc-400">
              {eleicao.status === 'ENCERRADA'
                ? `Resultado final consolidado em ${eleicao.encerrado_em}`
                : 'Acompanhamento de votos registrados até o momento'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarApuracao}
              title="Atualizar contagem"
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={exportarParaExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar para Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Cards de Resumo Quantitativo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-800/60 border border-zinc-700/70 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span>Total de Votos</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{totalVotos}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">100% da urna</p>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
              <span>Votos Válidos</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-emerald-300 font-mono">{votosValidos}</p>
            <p className="text-[11px] text-emerald-500/80 mt-0.5">
              {calcularPercentual(votosValidos, totalVotos)} do total
            </p>
          </div>

          <div className="bg-zinc-800/60 border border-zinc-700/70 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-300 text-xs mb-1">
              <span>Em Branco</span>
              <FileText className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{votosBrancos}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {calcularPercentual(votosBrancos, totalVotos)} do total
            </p>
          </div>

          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-red-400 text-xs mb-1">
              <span>Votos Nulos</span>
              <Ban className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-red-300 font-mono">{votosNulos}</p>
            <p className="text-[11px] text-red-400/70 mt-0.5">
              {calcularPercentual(votosNulos, totalVotos)} do total
            </p>
          </div>
        </div>
      </div>

      {/* Ranking de Candidatos com Barras de Progresso */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Desempenho por Candidato</h3>

        {candidatos.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">
            Nenhum candidato registrado nesta eleição.
          </p>
        ) : (
          <div className="space-y-3">
            {candidatos.map((c, idx) => {
              const percentualValidos =
                votosValidos > 0 ? Math.round((c.votos / votosValidos) * 100) : 0
              const isLider = maiorVotacao > 0 && c.votos === maiorVotacao

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isLider
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-zinc-800/40 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-500 w-5">{idx + 1}º</span>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 font-mono font-bold text-emerald-400 text-sm">
                        {c.numero}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{c.nome}</span>
                          {isLider && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              <Trophy className="w-3 h-3" />
                              Mais Votado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-white">
                        {c.votos} {c.votos === 1 ? 'voto' : 'votos'}
                      </span>
                      <span className="block text-xs text-zinc-400 font-mono">
                        {calcularPercentual(c.votos, votosValidos)} dos válidos
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso em CSS */}
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLider ? 'bg-emerald-500' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${percentualValidos}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}