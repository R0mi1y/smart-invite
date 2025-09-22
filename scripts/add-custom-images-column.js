const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'pass123',
  database: process.env.DB_NAME || 'convites_db',
  port: Number(process.env.DB_PORT) || 3306
};

async function addCustomImagesColumn() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📊 Verificando se a coluna custom_images existe...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'custom_images'
    `, [dbConfig.database]);
    
    if (columns.length > 0) {
      console.log('✅ Coluna custom_images já existe!');
    } else {
      console.log('➕ Adicionando coluna custom_images...');
      await connection.execute(`
        ALTER TABLE events ADD COLUMN custom_images JSON
      `);
      console.log('✅ Coluna custom_images adicionada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

addCustomImagesColumn();
