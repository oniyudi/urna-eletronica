import { getDb } from './db'

export interface Eleicao {
    id: number
    titulo: string
    status: 'RASCUNHO' | 'EM_ANDAMENTO' | 'ENCERRADA'
    tamannho_digitos: number
    digitos_permitidos: string
    criado_em: string
    encerrado_em: string | null
}

export interface Cadidato {
    id: number
    eleicao_id: number
    nome: string
    numero: string
    criado_em: string
}

export interface ResultadoCandidato extends Cadidato {
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

