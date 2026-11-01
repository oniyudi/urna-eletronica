import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  // Define o caminho seguro na pasta de dados do sistema operacional
  // Ex Windows: C:\Users\<Usuario>\AppData\Roaming\urna-eletronica\urna_dados.sqlite
  // Ex Linux: ~/.config/urna-eletronica/urna_dados.sqlite
  const dbPath = join(app.getPath('userData'), 'urna_dados.sqlite')
  console.log('[SQLite] Banco de dados localizado em:', dbPath)

  db = new Database(dbPath)

  // =========================================================================
  // BLINDAGEM CONTRA QUEDA DE ENERGIA E INTEGRIDADE RELACIONAL
  // =========================================================================
  // 1. WAL (Write-Ahead Logging): Evita corrupção de dados em desligamentos abruptos
  db.pragma('journal_mode = WAL')
  // 2. Synchronous FULL: Garante que o voto seja gravado fisicamente no SSD/HD
  //    antes de a função retornar confirmação para a tela
  db.pragma('synchronous = FULL')
  // 3. Ativa a verificação rigorosa de chaves estrangeiras (Foreign Keys)
  db.pragma('foreign_keys = ON')

  // =========================================================================
  // CRIAÇÃO DAS TABELAS (Executa automaticamente se não existirem)
  // =========================================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS eleicoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RASCUNHO' CHECK(status IN ('RASCUNHO', 'EM_ANDAMENTO', 'ENCERRADA')),
      tamanho_digitos INTEGER NOT NULL CHECK(tamanho_digitos >= 1 AND tamanho_digitos <= 10),
      digitos_permitidos TEXT NOT NULL DEFAULT '0123456789',
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      encerrado_em TEXT
    );

    CREATE TABLE IF NOT EXISTS candidatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eleicao_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      numero TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (eleicao_id) REFERENCES eleicoes(id) ON DELETE CASCADE,
      UNIQUE(eleicao_id, numero)
    );

    CREATE TABLE IF NOT EXISTS votos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eleicao_id INTEGER NOT NULL,
      candidato_id INTEGER,
      tipo TEXT NOT NULL CHECK(tipo IN ('VALIDO', 'BRANCO', 'NULO')),
      numero_digitado TEXT,
      horario_registro TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (eleicao_id) REFERENCES eleicoes(id) ON DELETE RESTRICT,
      FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_candidatos_eleicao_numero ON candidatos(eleicao_id, numero);
    CREATE INDEX IF NOT EXISTS idx_votos_eleicao ON votos(eleicao_id);
  `)

  return db
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('O banco de dados ainda não foi inicializado. Chame initDatabase() primeiro.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)') // Consolida o arquivo WAL no banco principal ao fechar o programa
    db.close()
    db = null
  }
}