require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  .then(rows => {
    console.log("=== Tables in your PostgreSQL database ===");
    rows.forEach(r => console.log(" -", r.tablename));
    return p.$disconnect();
  })
  .catch(e => { console.error("Error:", e.message); p.$disconnect(); });
