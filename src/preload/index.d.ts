import { ElectronAPI } from '@electron-toolkit/preload'

export interface Eleicao {
  id: number
  titulo: string
  status: 'RASCUNHO' | 'EM_ANDAMENTO' | 'ENCERRADA'
  tamanho_digitos: number
  digitos_permitidos: string
  criado_em: string
  encerrado_em: string | null
}

export interface Candidato {
  id: number
  eleicao_id: number
  nome: string
  numero: string
  criado_em: string
}

export interface ResultadoCandidato extends Candidato {
  votos: number
}

export interface ApuracaoEleicao {
  eleicao: Eleicao
  totalVotos: number
  votosBrancos: number
  votosNulos: number
  votosValidos: number
  candidatos: ResultadoCandidato[]
}

export interface CustomAPI {
  listarEleicoes: () => Promise<Eleicao[]>
  buscarEleicaoEmAndamento: () => Promise<Eleicao | null>
  criarEleicao: (
    titulo: string,
    tamanhoDigitos: number,
    digitosPermitidos: string
  ) => Promise<Eleicao>
  alterarStatusEleicao: (
    eleicaoId: number,
    novoStatus: 'RASCUNHO' | 'EM_ANDAMENTO' | 'ENCERRADA'
  ) => Promise<Eleicao>
  listarCandidatos: (eleicaoId: number) => Promise<Candidato[]>
  cadastrarCandidato: (eleicaoId: number, nome: string, numero: string) => Promise<Candidato>
  removerCandidato: (candidatoId: number) => Promise<void>
  registrarVoto: (
    eleicaoId: number,
    tipo: 'VALIDO' | 'BRANCO' | 'NULO',
    numeroDigitado: string | null
  ) => Promise<void>
  obterApuracao: (eleicaoId: number) => Promise<ApuracaoEleicao>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}