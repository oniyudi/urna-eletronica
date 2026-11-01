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

// Criar uma nova eleicao com regras de digitos personalizadas
export function criarEleicao(
    titulo: string,
    tamanhoDigitos: number,
    digitosPermitidos: string
): Eleicao {
    const db = getDb()

    const tituloLimpo = titulo.trim()
    if(!tituloLimpo) {
        throw new Error('O título da eleição é obrigatório')
    }

    // removendo caracteres duplicados e garatindo que so existam numeros de 0 a 9
    const digitosValidos = Array.from(new Set(digitosPermitidos.replace(/[^0-9]/g, '').split(''))).sort().join('')
    // pego apenas digitos de 0 a 9, removo duplicados com o set (split transforma em array) e retorno a uma lista normal para poder usar o sort e o join

    if (digitosValidos.length === 0) {
        throw new Error('Selecione pelo menos um dígito permitido')
    }

    const stmt = db.prepare(`
        INSERT INTO eleicoes (titulo, tamanho_digitos, digitos_permitidos)
        VALUES (?, ?, ?)`)
    
    const info = stmt.run(tituloLimpo, tamanhoDigitos, digitosValidos)

    return db.prepare('SELECT * FROM eleicoes WHERE id = ?').get(info.lastInsertRowid) as Eleicao
}