require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

async function main() {
  const { SEED_EMAIL, SEED_PASSWORD } = process.env;

  if (!SEED_EMAIL || !SEED_PASSWORD) {
    throw new Error('SEED_EMAIL e SEED_PASSWORD precisam estar definidos no .env');
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { passwordHash },
    create: { email: SEED_EMAIL, passwordHash },
  });

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log(`Usuário seedado: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
