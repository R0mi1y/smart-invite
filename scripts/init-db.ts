// Script para inicializar o banco de dados
import mysql from 'mysql2/promise';

interface DbConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

const initDatabase = async (): Promise<void> => {
  const dbConfig: DbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'convites_db',
    port: Number(process.env.DB_PORT) || 3306
  };

  console.log('🔄 Inicializando banco de dados...');
  console.log('📡 Conectando em:', { host: dbConfig.host, database: dbConfig.database, port: dbConfig.port });

  try {
    // Aguardar MySQL estar pronto
    let retries = 10;
    let connection: mysql.Connection;
    
    while (retries > 0) {
      try {
        connection = await mysql.createConnection({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password,
          port: dbConfig.port
        });
        break;
      } catch (err) {
        console.log(`⏳ Aguardando MySQL... (tentativas restantes: ${retries})`);
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Criar database
    await connection!.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database ${dbConfig.database} criado/conectado`);
    
    // Fechar conexão inicial e criar nova com database específico
    await connection!.end();
    
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });
    console.log('✅ Conectado ao database específico');

    // Criar tabelas
    await connection!.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        message TEXT,
        photos JSON,
        location VARCHAR(500),
        date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection!.execute(`
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

    console.log('✅ Tabelas criadas com sucesso');
    
    // Verificar tabelas
    const [tables] = await connection!.execute('SHOW TABLES');
    console.log('📋 Tabelas disponíveis:', (tables as any[]).map(t => Object.values(t)[0]));

    await connection!.end();
    console.log('🎉 Inicialização do banco concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
};

// Executar apenas se chamado diretamente
if (require.main === module) {
  initDatabase();
}

export default initDatabase;
