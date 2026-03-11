const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count === 0) {
    console.log('DB vuoto: eseguo seed iniziale...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  } else {
    console.log(`DB già popolato (${count} utenti): seed saltato.`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Auto-seed check failed:', e.message);
  process.exit(0); // non bloccare l'avvio del backend
});
