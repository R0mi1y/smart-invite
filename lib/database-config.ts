import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

interface DbResult {
  lastID: number;
  changes: number;
}

interface DatabaseAdapter {
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<DbResult>;
  close(): Promise<void>;
}

class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql.Pool;

  constructor() {
    const dbConfig = {
      host: process.env.DB_HOST || 'mysql',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'pass123',
      database: process.env.DB_NAME || 'convites_db',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    this.pool = mysql.createPool(dbConfig);
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const [rows] = await this.pool.execute(sql, params);
    return Array.isArray(rows) ? rows[0] : null;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const [rows] = await this.pool.execute(sql, params);
    return Array.isArray(rows) ? rows : [];
  }

  async run(sql: string, params: any[] = []): Promise<DbResult> {
    const [result] = await this.pool.execute(sql, params);
    const mysqlResult = result as mysql.ResultSetHeader;
    return {
      lastID: mysqlResult.insertId || 0,
      changes: mysqlResult.affectedRows || 0
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class SQLiteAdapter implements DatabaseAdapter {
  private db: Database | null = null;

  async init(): Promise<void> {
    if (!this.db) {
      const dbPath = path.join(process.cwd(), 'data', 'smart-invite.db');
      
      // Criar diretório se não existir
      const fs = require('fs');
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      await this.createTables();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // Tabela de eventos
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        message TEXT,
        photos TEXT,
        location TEXT,
        date TEXT,
        custom_images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de convidados
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        name TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        confirmed INTEGER DEFAULT 0,
        num_people INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
      )
    `);

    // Criar índice no token
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_token ON guests (token)
    `);

    console.log('SQLite database initialized successfully');
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    await this.init();
    return this.db!.get(sql, params);
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    await this.init();
    return this.db!.all(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<DbResult> {
    await this.init();
    const result = await this.db!.run(sql, params);
    return {
      lastID: result.lastID || 0,
      changes: result.changes || 0
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Detectar ambiente e criar adapter apropriado
function createDatabaseAdapter(): DatabaseAdapter {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST;
  
  if (isProduction) {
    console.log('🐬 Using MySQL database (production)');
    return new MySQLAdapter();
  } else {
    console.log('📁 Using SQLite database (development)');
    return new SQLiteAdapter();
  }
}

export default createDatabaseAdapter();
