import mysql from 'mysql2/promise';

interface DbConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

interface DbResult {
  lastID: number;
  changes: number;
}

// Configuração da conexão
const dbConfig: DbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'pass123',
  database: process.env.DB_NAME || 'convites_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para inicializar as tabelas
const initDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    
    // Criar database se não existir
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.execute(`USE ${dbConfig.database}`);
    
    // Tabela de eventos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        message TEXT,
        photos JSON,
        location VARCHAR(500),
        date DATETIME,
        custom_images JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna custom_images se não existir (para compatibilidade)
    try {
      await connection.execute(`
        ALTER TABLE events ADD COLUMN custom_images JSON
      `);
    } catch (error) {
      // Coluna já existe, ignorar erro
    }

    // Tabela de convidados
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS guests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        name VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        confirmed BOOLEAN DEFAULT FALSE,
        num_people INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
        INDEX idx_token (token)
      )
    `);
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Inicializar database automaticamente no import
initDatabase();

// Wrapper functions para manter compatibilidade com o código existente
const db = {
  // Função para INSERT
  run: async (sql: string, params: any[] = []): Promise<DbResult> => {
    try {
      const [result] = await pool.execute(sql, params);
      const mysqlResult = result as mysql.ResultSetHeader;
      return { lastID: mysqlResult.insertId, changes: mysqlResult.affectedRows };
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  },
  
  // Função para SELECT único registro
  get: async (sql: string, params: any[] = []): Promise<any | null> => {
    try {
      const [rows] = await pool.execute(sql, params);
      const rowsArray = rows as any[];
      return rowsArray[0] || null;
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  },
  
  // Função para SELECT múltiplos registros
  all: async (sql: string, params: any[] = []): Promise<any[]> => {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error('Database all error:', error);
      throw error;
    }
  }
};

export default db;
