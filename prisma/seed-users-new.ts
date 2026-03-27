import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const usersData = [
  {
    namaLengkap: 'Ahmad Hidayat',
    username: 'ahmad.hidayat',
    email: 'ahmad.hidayat@desa.go.id',
    noHp: '081234567890',
    password: 'password123',
    role: 'SUPER_ADMIN' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },
  {
    namaLengkap: 'Siti Nurhaliza',
    username: 'siti.nurhaliza',
    email: 'siti.nurhaliza@desa.go.id',
    noHp: '081234567891',
    password: 'password123',
    role: 'ADMIN_DESA' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },
  {
    namaLengkap: 'Budi Santoso',
    username: 'budi.santoso',
    email: 'budi.santoso@desa.go.id',
    noHp: '081234567892',
    password: 'password123',
    role: 'OPERATOR' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },
  {
    namaLengkap: 'Dewi Lestari',
    username: 'dewi.lestari',
    email: 'dewi.lestari@desa.go.id',
    noHp: '081234567893',
    password: 'password123',
    role: 'WARGA' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },
];

async function main() {
  console.log('🌱 Mulai seeding data user baru...\n');

  // Get desa
  const desa = await prisma.desa.findFirst();

  for (const userData of usersData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existingUser) {
      console.log(`⏭️  User ${userData.username} sudah ada, skip...`);
      continue;
    }

    // Hash password
    const hashedPassword = await hash(userData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        namaLengkap: userData.namaLengkap,
        username: userData.username,
        email: userData.email,
        noHp: userData.noHp,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
        desaId: desa?.id || null,
      },
    });

    console.log(`✅ User: ${user.namaLengkap} (${user.role})`);
  }

  // Show all users
  const allUsers = await prisma.user.findMany({
    select: {
      namaLengkap: true,
      username: true,
      role: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n========================================');
  console.log('📊 Daftar Semua User:');
  console.log('========================================');
  for (const u of allUsers) {
    console.log(`   ${u.namaLengkap.padEnd(20)} | ${u.username.padEnd(18)} | ${u.role.padEnd(12)} | ${u.status}`);
  }
  console.log('========================================');
  console.log(`   Total: ${allUsers.length} user`);
  console.log('========================================');
  console.log('\n✅ Seeding user selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
