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

// alterar status da eleicao
export function alterarStatusEleicao(
    eleicaoId: number,
    novoStatus: 'RASCUNHO' | 'EM_ANDAMENTO' | 'ENCERRADA'
): Eleicao {
    const db = getDb()

    //garantindo que apenas uma eleicao esteja em andamento
    if (novoStatus == 'EM_ANDAMENTO') {
        const ativa = buscarEleicaoEmAndamento()
        if(ativa && ativa.id !== eleicaoId) {
            throw new Error(`A eleição "${ativa.titulo}" já está em andamento. Ecerre-a antes de iniciar outra.`)
        }
    }

    if (novoStatus == 'ENCERRADA') {
        db.prepare("UPDATE eleicoes SET status = ?, encerrado_em = datetime('now', 'localtime') WHERE id = ?")
            .run(novoStatus, eleicaoId)
    } else {
        db.prepare("UPDATE eleicoes SET status = ? WHERE id = ?").run(novoStatus, eleicaoId)
    }
    return db.prepare('SELECT * FROM eleicoes WHERE id = ?').get(eleicaoId) as Eleicao
}

// lstar candidatos de uma eleicao especifica
export function listarCandidatos(eleicaoId: number): Candidato[] {
    const db = getDb()
    return db.prepare('SELECT * FROM candidatos WHERE eleicao_id = ? ORDER BY numero ASC')
        .all(eleicaoId) as Candidato[]
}

// cadastrar candidato em uma eleicao
export function cadastrarCandidato(
    eleicaoId: number, nome: string, numero: string
): Candidato {
    const db = getDb()

    const eleicao = db.prepare('SELECT * FROM eleicoes WHERE id = ?').get(eleicaoId) as Eleicao | undefined
    if(!eleicao) {
        throw new Error('Eleicao não encontrada')
    }

    if(eleicao.status !== 'RASCUNHO') {
        throw new Error('Só é permitido cadastrar candidatos enquanto a eleição')
    }

    const nomeLimpo = nome.trim()
    const numeroLimpo = numero.trim()

    if(!nomeLimpo) {
        throw new Error('O nome do candidato é obrigatório')
    }

    if(!numeroLimpo) {
        throw new Error('O número do candidato é obrigatório')
    }

    if(numeroLimpo.length !== eleicao.tamannho_digitos) {
        throw new Error(`O número do candidato deve ter exatamente ${eleicao.tamannho_digitos} dígitos`)
    }

    for (const char of numeroLimpo) {
        if(!eleicao.digitos_permitidos.includes(char)) {
            throw new Error(`O número do candidato contém dígitos não permitidos. Dígitos permitidos: ${eleicao.digitos_permitidos}`)
        }
    }

    const existente = db.prepare('SELECT * FROM candidatos WHERE eleicao_id = ? AND numero = ?')
        .get(eleicaoId, numeroLimpo)
    
    if(existente) {
        throw new Error(`Já existe um candidato com o número ${numeroLimpo} nesta eleição`)
    }

    const info = db.prepare('INSERT INTO candidatos (eleicao_id, nome, numero) VALUES (?, ?, ?)')
        .run(eleicaoId, nomeLimpo, numeroLimpo)

    return db.prepare('SELECT * FROM candidatos WHERE id = ?').get(info.lastInsertRowid) as Candidato
}

// remover um candidato - apenas se a eleicao estiver em rascunho
export function removerCadidato(candidatoId: number): void {
    const db = getDb()
    const candidato = db.prepare('SELECT eleicao_id FROM candidatos WHERE id = ?').get(candidatoId) as { eleicao_id: number } | undefined

    if (!candidato) return

    const eleicao = db.prepare('SELECT status FROM eleicoes WHERE id = ?').get(candidato.eleicao_id) as { status: string }

    if (eleicao.status !== 'RASCUNHO') {
        throw new Error('Não é possível excluir candidatos de uma eleição iniciada ou encerrada.')
    }

    db.prepare('DELETE FROM candidatos WHERE id = ?').run(candidatoId)
}

// registrar voto em urna
export function registrarVoto(
    eleicaoId: number,
    tipo: 'VALIDO' | 'BRANCO' | 'NULO',
    numeroDigitado: string | null
): void {
    const db = getDb()

    const eleicao = db.prepare('SELECT * FROM eleicoes WHERE id = ?').get(eleicaoId) as Eleicao | undefined

    if(!eleicao || eleicao.status !== 'EM_ANDAMENTO') {
        throw new Error('Esta eleicao não está aberta para voração')
    }

    let candidatoId: number | null = null
    let tipoFinal = tipo

    if (tipo === 'VALIDO' && numeroDigitado) {
        const candidato = db.prepare('SELECT id FROM candidatos WHERE eleicao_id = ? AND numero = ?')
            .get(eleicaoId, numeroDigitado) as { id: number } | undefined
        
        if(candidato) {
            candidatoId = candidato.id
        } else {
            tipoFinal = 'NULO'
        }
    }

    db.prepare('INSERT INTO votos (eleicao_id, candidato_id, tipo, numero_digitado) VALUES (?, ?, ?, ?)')
        .run(eleicaoId, candidatoId, tipoFinal, numeroDigitado)
}