require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'prisma', 'fix_missing_tables.sql'), 'utf8');
  // Split on semicolons and run each statement
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log("Applying fix_missing_tables.sql...\n");
  for (const stmt of statements) {
    try {
      await p.$executeRawUnsafe(stmt);
      console.log("✅ OK:", stmt.slice(0, 60).replace(/\n/g,' ') + '...');
    } catch(e) {
      if (e.message.includes('already exists')) {
        console.log("⏭  Skipped (already exists):", stmt.slice(0, 60).replace(/\n/g,' '));
      } else {
        console.log("ℹ  Note:", e.message.slice(0, 100));
      }
    }
  }
  
  // List all tables
  const tables = await p.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  console.log("\n=== All tables in your database ===");
  tables.forEach(r => console.log(" -", r.tablename));
  
  await p.$disconnect();
  console.log("\n✅ Done!");
}

run().catch(e => { console.error(e.message); p.$disconnect(); });
