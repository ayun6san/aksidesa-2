import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding 5 data user...\n');

  // Cek apakah sudah ada desa
  const desa = await prisma.desa.findFirst();
  
  // Data 5 User Baru
  const usersData = [
    {
      namaLengkap: 'Ahmad Fauzi',
      username: 'ahmad.fauzi',
      email: 'ahmad.fauzi@aksidesa.id',
      noHp: '081345678901',
      password: 'password123',
      role: 'SUPER_ADMIN',
      faceRecognitionEnabled: true,
      rfidEnabled: true,
    },
    {
      namaLengkap: 'Siti Aminah',
      username: 'siti.aminah',
      email: 'siti.aminah@aksidesa.id',
      noHp: '081345678902',
      password: 'password123',
      role: 'ADMIN_DESA',
      faceRecognitionEnabled: true,
      rfidEnabled: false,
    },
    {
      namaLengkap: 'Budi Prasetyo',
      username: 'budi.prasetyo',
      email: 'budi.prasetyo@aksidesa.id',
      noHp: '081345678903',
      password: 'password123',
      role: 'ADMIN_DESA',
      faceRecognitionEnabled: false,
      rfidEnabled: true,
    },
    {
      namaLengkap: 'Dewi Sartika',
      username: 'dewi.sartika',
      email: 'dewi.sartika@aksidesa.id',
      noHp: '081345678904',
      password: 'password123',
      role: 'OPERATOR',
      faceRecognitionEnabled: true,
      rfidEnabled: true,
    },
    {
      namaLengkap: 'Rudi Hermawan',
      username: 'rudi.hermawan',
      email: 'rudi.hermawan@aksidesa.id',
      noHp: '081345678905',
      password: 'password123',
      role: 'WARGA',
      faceRecognitionEnabled: false,
      rfidEnabled: false,
    },
  ];

  console.log('📋 Daftar User yang akan ditambahkan:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  for (const userData of usersData) {
    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          { email: userData.email }
        ]
      }
    });

    if (existingUser) {
      console.log(`\n⚠️  User ${userData.username} sudah ada, dilewati...`);
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
        role: userData.role as any,
        status: 'ACTIVE',
        faceRecognitionEnabled: userData.faceRecognitionEnabled,
        rfidEnabled: userData.rfidEnabled,
        desaId: desa?.id || null,
      },
    });

    const roleLabels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN_DESA': 'Admin Desa',
      'OPERATOR': 'Operator',
      'WARGA': 'Warga'
    };
    const roleLabel = roleLabels[userData.role] || userData.role;
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
  const totalSuperAdmin = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  const totalAdmin = await prisma.user.count({ where: { role: 'ADMIN_DESA' } });
  const totalOperator = await prisma.user.count({ where: { role: 'OPERATOR' } });
  const totalWarga = await prisma.user.count({ where: { role: 'WARGA' } });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RINGKASAN DATA USER');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`👤 Total User      : ${totalUsers}`);
  console.log(`   ├─ Super Admin  : ${totalSuperAdmin}`);
  console.log(`   ├─ Admin Desa   : ${totalAdmin}`);
  console.log(`   ├─ Operator     : ${totalOperator}`);
  console.log(`   └─ Warga        : ${totalWarga}`);
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
