// Script para limpar o banco de dados
// Execute com: node scripts/clean-database.js

const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

async function cleanDatabase() {
  console.log('🧹 Script de Limpeza do Banco de Dados');
  console.log('=====================================\n');
  
  // Detectar ambiente
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST;
  
  if (isProduction) {
    console.log('🐬 Detectado: MySQL (Produção)');
  } else {
    console.log('📁 Detectado: SQLite (Desenvolvimento)');
  }
  
  console.log('\n⚠️  ATENÇÃO: Esta operação vai DELETAR todos os dados!');
  console.log('- Todos os eventos serão removidos');
  console.log('- Todos os convidados serão removidos');
  console.log('- As tabelas serão mantidas (estrutura preservada)');
  
  const confirm1 = await askQuestion('\nTem certeza que deseja continuar? Digite "CONFIRMAR" para prosseguir: ');
  
  if (confirm1 !== 'CONFIRMAR') {
    console.log('❌ Operação cancelada.');
    rl.close();
    return;
  }
  
  const confirm2 = await askQuestion('⚠️  Última chance! Digite "SIM" para deletar TODOS os dados: ');
  
  if (confirm2 !== 'SIM') {
    console.log('❌ Operação cancelada.');
    rl.close();
    return;
  }
  
  console.log('\n🔄 Iniciando limpeza...');
  
  try {
    if (isProduction) {
      await cleanMySQL();
    } else {
      await cleanSQLite();
    }
    
    console.log('✅ Banco de dados limpo com sucesso!');
    console.log('\n📊 Estado final:');
    console.log('- 0 eventos');
    console.log('- 0 convidados');
    console.log('- Estrutura das tabelas preservada');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  }
  
  rl.close();
}

async function cleanMySQL() {
  const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'pass123',
    database: process.env.DB_NAME || 'convites_db',
    port: Number(process.env.DB_PORT) || 3306
  };
  
  console.log('🔌 Conectando ao MySQL...');
  const connection = await mysql.createConnection(dbConfig);
  
  // Verificar dados atuais
  const [events] = await connection.execute('SELECT COUNT(*) as count FROM events');
  const [guests] = await connection.execute('SELECT COUNT(*) as count FROM guests');
  
  console.log(`📊 Estado atual: ${events[0].count} eventos, ${guests[0].count} convidados`);
  
  // Limpar tabelas (ordem importante devido às foreign keys)
  console.log('🗑️  Deletando convidados...');
  const [guestResult] = await connection.execute('DELETE FROM guests');
  console.log(`   ✅ ${guestResult.affectedRows} convidados removidos`);
  
  console.log('🗑️  Deletando eventos...');
  const [eventResult] = await connection.execute('DELETE FROM events');
  console.log(`   ✅ ${eventResult.affectedRows} eventos removidos`);
  
  // Reset auto increment
  console.log('🔄 Resetando IDs...');
  await connection.execute('ALTER TABLE guests AUTO_INCREMENT = 1');
  await connection.execute('ALTER TABLE events AUTO_INCREMENT = 1');
  
  await connection.end();
  console.log('🔌 Conexão fechada');
}

async function cleanSQLite() {
  const path = require('path');
  const fs = require('fs');
  
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'data', 'smart-invite.db');
    
    if (!fs.existsSync(dbPath)) {
      console.log('📁 Banco SQLite não encontrado:', dbPath);
      console.log('✅ Nada para limpar (banco não existe)');
      return;
    }
    
    console.log('🔌 Conectando ao SQLite...');
    const db = new Database(dbPath);
    
    // Verificar dados atuais
    const events = db.prepare('SELECT COUNT(*) as count FROM events').get();
    const guests = db.prepare('SELECT COUNT(*) as count FROM guests').get();
    
    console.log(`📊 Estado atual: ${events.count} eventos, ${guests.count} convidados`);
    
    // Limpar tabelas
    console.log('🗑️  Deletando convidados...');
    const guestResult = db.prepare('DELETE FROM guests').run();
    console.log(`   ✅ ${guestResult.changes} convidados removidos`);
    
    console.log('🗑️  Deletando eventos...');
    const eventResult = db.prepare('DELETE FROM events').run();
    console.log(`   ✅ ${eventResult.changes} eventos removidos`);
    
    // Reset auto increment
    console.log('🔄 Resetando IDs...');
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('events', 'guests')").run();
    
    db.close();
    console.log('🔌 Conexão fechada');
    
  } catch (error) {
    if (error.message.includes('better-sqlite3')) {
      console.log('📦 Instalando better-sqlite3...');
      const { execSync } = require('child_process');
      execSync('npm install better-sqlite3', { stdio: 'inherit' });
      console.log('✅ Execute o script novamente.');
      return;
    }
    throw error;
  }
}

// Executar o script
cleanDatabase().catch(console.error);
