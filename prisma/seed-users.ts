import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding data user...\n');

  // Data User Baru
  const usersData = [
    {
      namaLengkap: 'Budi Santoso',
      username: 'budi.santoso',
      email: 'budi@aksidesa.id',
      noHp: '081234567890',
      password: 'password123',
      role: 'ADMIN_DESA',
      faceRecognitionEnabled: true,
      rfidEnabled: false,
    },
    {
      namaLengkap: 'Siti Rahayu',
      username: 'siti.rahayu',
      email: 'siti@aksidesa.id',
      noHp: '081234567891',
      password: 'password123',
      role: 'ADMIN_DESA',
      faceRecognitionEnabled: true,
      rfidEnabled: true,
    },
    {
      namaLengkap: 'Ahmad Hidayat',
      username: 'ahmad.hidayat',
      email: 'ahmad@aksidesa.id',
      noHp: '081234567892',
      password: 'password123',
      role: 'OPERATOR',
      faceRecognitionEnabled: false,
      rfidEnabled: true,
    },
    {
      namaLengkap: 'Dewi Lestari',
      username: 'dewi.lestari',
      email: 'dewi@aksidesa.id',
      noHp: '081234567893',
      password: 'password123',
      role: 'OPERATOR',
      faceRecognitionEnabled: true,
      rfidEnabled: true,
    },
  ];

  console.log('📋 Daftar User yang akan ditambahkan:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  for (const userData of usersData) {
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
        role: userData.role as any,
        status: 'ACTIVE',
        faceRecognitionEnabled: userData.faceRecognitionEnabled,
        rfidEnabled: userData.rfidEnabled,
      },
    });

    const roleLabel = userData.role === 'ADMIN_DESA' ? 'Admin Desa' : 'Operator';
    const faceIcon = userData.faceRecognitionEnabled ? '✅' : '❌';
    const rfidIcon = userData.rfidEnabled ? '✅' : '❌';

    console.log(`\n👤 ${userData.namaLengkap}`);
    console.log(`   📧 Email    : ${userData.email}`);
    console.log(`   🔑 Username : ${userData.username}`);
    console.log(`   🎭 Role     : ${roleLabel}`);
    console.log(`   📱 No HP    : ${userData.noHp}`);
    console.log(`   📷 Wajah    : ${faceIcon}`);
    console.log(`   💳 RFID     : ${rfidIcon}`);
  }

  // Summary
  const totalUsers = await prisma.user.count();
  const totalAdmin = await prisma.user.count({ where: { role: 'ADMIN_DESA' } });
  const totalOperator = await prisma.user.count({ where: { role: 'OPERATOR' } });
  const totalSuperAdmin = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RINGKASAN DATA USER');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`👤 Total User      : ${totalUsers}`);
  console.log(`   ├─ Super Admin  : ${totalSuperAdmin}`);
  console.log(`   ├─ Admin Desa   : ${totalAdmin}`);
  console.log(`   └─ Operator     : ${totalOperator}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log('\n📝 Kredensial Login:');
  console.log('   Password untuk semua user: password123');
  console.log('\n✅ Seeding data user selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
