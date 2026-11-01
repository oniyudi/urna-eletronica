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

// Listar todas as eleicoes
export function listarEleicoes(): Eleicao[] {
    const db = getDb()
    return db.prepare('SELECT * FROM eleicoes ORDER BY id DESC').all() as Eleicao[]
    // .all() retona todas as linhas encontradas como um array de objetos
    // as Eleicao[] informa ao Typescript que o retorno segue a estrutura definida por Eleicao
}

// Verificar se ha eleicao em andamento
export function buscarEleicaoEmAndamento(): Eleicao | null {
    const db = getDb()
    const eleicao = db
        .prepare("SELECT * FROM eleicoes WHERE status = 'EM_ANDAMENTO' LIMIT 1")
        .get() as Eleicao | undefined
    return eleicao ?? null
    // .get() retorna a primeira linha encontrada ou undefined se não houver resultados
    // ?? null garante que a função retorne null em vez de undefined quando não houver eleicao em andamento
}

