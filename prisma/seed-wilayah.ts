import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding data wilayah...\n');

  // Data Wilayah: 4 Dusun dengan RT dan RW
  const wilayahData = [
    {
      nama: 'Dusun Melati',
      kode: 'DSN-001',
      rw: [
        {
          nomor: '001',
          rt: [
            { nomor: '001', jumlahKK: 45, jumlahPenduduk: 156 },
            { nomor: '002', jumlahKK: 38, jumlahPenduduk: 132 },
            { nomor: '003', jumlahKK: 42, jumlahPenduduk: 148 },
          ],
        },
        {
          nomor: '002',
          rt: [
            { nomor: '001', jumlahKK: 35, jumlahPenduduk: 125 },
            { nomor: '002', jumlahKK: 40, jumlahPenduduk: 140 },
          ],
        },
      ],
    },
    {
      nama: 'Dusun Mawar',
      kode: 'DSN-002',
      rw: [
        {
          nomor: '001',
          rt: [
            { nomor: '001', jumlahKK: 50, jumlahPenduduk: 175 },
            { nomor: '002', jumlahKK: 48, jumlahPenduduk: 168 },
            { nomor: '003', jumlahKK: 52, jumlahPenduduk: 182 },
          ],
        },
        {
          nomor: '002',
          rt: [
            { nomor: '001', jumlahKK: 44, jumlahPenduduk: 154 },
            { nomor: '002', jumlahKK: 46, jumlahPenduduk: 161 },
          ],
        },
        {
          nomor: '003',
          rt: [
            { nomor: '001', jumlahKK: 38, jumlahPenduduk: 133 },
            { nomor: '002', jumlahKK: 42, jumlahPenduduk: 147 },
          ],
        },
      ],
    },
    {
      nama: 'Dusun Anggrek',
      kode: 'DSN-003',
      rw: [
        {
          nomor: '001',
          rt: [
            { nomor: '001', jumlahKK: 55, jumlahPenduduk: 192 },
            { nomor: '002', jumlahKK: 50, jumlahPenduduk: 175 },
          ],
        },
        {
          nomor: '002',
          rt: [
            { nomor: '001', jumlahKK: 48, jumlahPenduduk: 168 },
            { nomor: '002', jumlahKK: 52, jumlahPenduduk: 182 },
            { nomor: '003', jumlahKK: 45, jumlahPenduduk: 157 },
          ],
        },
      ],
    },
    {
      nama: 'Dusun Kenanga',
      kode: 'DSN-004',
      rw: [
        {
          nomor: '001',
          rt: [
            { nomor: '001', jumlahKK: 40, jumlahPenduduk: 140 },
            { nomor: '002', jumlahKK: 38, jumlahPenduduk: 133 },
            { nomor: '003', jumlahKK: 42, jumlahPenduduk: 147 },
            { nomor: '004', jumlahKK: 35, jumlahPenduduk: 122 },
          ],
        },
        {
          nomor: '002',
          rt: [
            { nomor: '001', jumlahKK: 45, jumlahPenduduk: 157 },
            { nomor: '002', jumlahKK: 48, jumlahPenduduk: 168 },
          ],
        },
      ],
    },
  ];

  // Clear existing data
  console.log('🗑️  Menghapus data wilayah lama...');
  await prisma.rT.deleteMany({});
  await prisma.rW.deleteMany({});
  await prisma.dusun.deleteMany({});
  console.log('✅ Data lama berhasil dihapus\n');

  // Insert new data
  let totalRW = 0;
  let totalRT = 0;
  let totalKK = 0;
  let totalPenduduk = 0;

  for (const dusun of wilayahData) {
    // Calculate totals for dusun
    let dusunKK = 0;
    let dusunPenduduk = 0;
    
    // Create Dusun
    const createdDusun = await prisma.dusun.create({
      data: {
        nama: dusun.nama,
        kode: dusun.kode,
      },
    });
    console.log(`📍 Membuat ${dusun.nama} (${dusun.kode})`);

    for (const rw of dusun.rw) {
      // Calculate totals for RW
      let rwKK = 0;
      let rwPenduduk = 0;

      // Create RW
      const createdRW = await prisma.rW.create({
        data: {
          nomor: rw.nomor,
          dusunId: createdDusun.id,
        },
      });
      console.log(`   └─ RW ${rw.nomor}`);
      totalRW++;

      for (const rt of rw.rt) {
        // Create RT
        await prisma.rT.create({
          data: {
            nomor: rt.nomor,
            jumlahKK: rt.jumlahKK,
            jumlahPenduduk: rt.jumlahPenduduk,
            rwId: createdRW.id,
          },
        });
        console.log(`       └─ RT ${rt.nomor}: ${rt.jumlahKK} KK, ${rt.jumlahPenduduk} jiwa`);
        
        rwKK += rt.jumlahKK;
        rwPenduduk += rt.jumlahPenduduk;
        totalRT++;
      }

      // Update RW totals
      await prisma.rW.update({
        where: { id: createdRW.id },
        data: { jumlahKK: rwKK, jumlahPenduduk: rwPenduduk },
      });

      dusunKK += rwKK;
      dusunPenduduk += rwPenduduk;
    }

    // Update Dusun totals
    await prisma.dusun.update({
      where: { id: createdDusun.id },
      data: { jumlahKK: dusunKK, jumlahPenduduk: dusunPenduduk },
    });

    totalKK += dusunKK;
    totalPenduduk += dusunPenduduk;
    console.log(`   📊 Total ${dusun.nama}: ${dusunKK} KK, ${dusunPenduduk} jiwa\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 RINGKASAN DATA WILAYAH');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 Total Dusun    : 4`);
  console.log(`📍 Total RW       : ${totalRW}`);
  console.log(`📍 Total RT       : ${totalRT}`);
  console.log(`👥 Total KK       : ${totalKK}`);
  console.log(`👥 Total Penduduk : ${totalPenduduk}`);
  console.log('═══════════════════════════════════════════');
  console.log('\n✅ Seeding data wilayah selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
