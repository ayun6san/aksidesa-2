import { PrismaClient, JenisTempatTinggal } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding data KK...\n');

  // Ambil data wilayah yang ada
  const dusunList = await prisma.dusun.findMany({
    include: {
      rw: {
        include: {
          rt: true,
        },
      },
    },
  });

  if (dusunList.length === 0) {
    console.log('❌ Tidak ada data wilayah. Jalankan seed-wilayah.ts terlebih dahulu.');
    return;
  }

  // Kumpulkan semua RT
  const allRT: { id: string; nomor: string; rwNomor: string; dusunNama: string; dusunId: string }[] = [];
  for (const dusun of dusunList) {
    for (const rw of dusun.rw) {
      for (const rt of rw.rt) {
        allRT.push({
          id: rt.id,
          nomor: rt.nomor,
          rwNomor: rw.nomor,
          dusunNama: dusun.nama,
          dusunId: dusun.id,
        });
      }
    }
  }

  // Data KK Sample
  const kkData = [
    {
      nomorKK: '3201170101010001',
      tanggalTerbit: new Date('2020-05-15'),
      jenisTempatTinggal: JenisTempatTinggal.MILIK_SENDIRI,
      alamat: 'Jl. Melati No. 1',
      rtIndex: 0,
    },
    {
      nomorKK: '3201170101010002',
      tanggalTerbit: new Date('2019-08-20'),
      jenisTempatTinggal: JenisTempatTinggal.MILIK_SENDIRI,
      alamat: 'Jl. Melati No. 5',
      rtIndex: 1,
    },
    {
      nomorKK: '3201170101010003',
      tanggalTerbit: new Date('2021-03-10'),
      jenisTempatTinggal: JenisTempatTinggal.KONTRAK,
      alamat: 'Jl. Mawar Indah No. 12',
      rtIndex: 2,
    },
    {
      nomorKK: '3201170101010004',
      tanggalTerbit: new Date('2018-11-25'),
      jenisTempatTinggal: JenisTempatTinggal.MILIK_SENDIRI,
      alamat: 'Jl. Anggrek Blok A No. 3',
      rtIndex: 3,
    },
    {
      nomorKK: '3201170101010005',
      tanggalTerbit: new Date('2022-01-05'),
      jenisTempatTinggal: JenisTempatTinggal.RUMAH_ORANGTUA,
      alamat: 'Jl. Kenanga No. 8',
      rtIndex: 4,
    },
    {
      nomorKK: '3201170101010006',
      tanggalTerbit: new Date('2020-07-18'),
      jenisTempatTinggal: JenisTempatTinggal.MILIK_SENDIRI,
      alamat: 'Jl. Melati Indah No. 22',
      rtIndex: 5,
    },
    {
      nomorKK: '3201170101010007',
      tanggalTerbit: new Date('2019-02-28'),
      jenisTempatTinggal: JenisTempatTinggal.SEWA,
      alamat: 'Jl. Mawar No. 15',
      rtIndex: 6,
    },
    {
      nomorKK: '3201170101010008',
      tanggalTerbit: new Date('2021-09-12'),
      jenisTempatTinggal: JenisTempatTinggal.MILIK_SENDIRI,
      alamat: 'Jl. Anggrek No. 7',
      rtIndex: 7,
    },
    {
      nomorKK: '3201170101010009',
      tanggalTerbit: new Date('2020-12-03'),
      jenisTempatTinggal: JenisTempatTinggal.RUMAH_DINAS,
      alamat: 'Kompleks Perumnah Blok C No. 5',
      rtIndex: 8,
    },
    {
      nomorKK: '3201170101010010',
      tanggalTerbit: new Date('2022-06-30'),
      jenisTempatTinggal: JenisTempatTinggal.MILIK_SENDIRI,
      alamat: 'Jl. Kenanga Indah No. 10',
      rtIndex: 9,
    },
  ];

  // Clear existing KK data
  console.log('🗑️  Menghapus data KK lama...');
  await prisma.kK.deleteMany({});
  console.log('✅ Data KK lama berhasil dihapus\n');

  // Insert KK data
  let count = 0;
  for (const kk of kkData) {
    const rt = allRT[kk.rtIndex % allRT.length];
    
    const createdKK = await prisma.kK.create({
      data: {
        nomorKK: kk.nomorKK,
        tanggalTerbit: kk.tanggalTerbit,
        jenisTempatTinggal: kk.jenisTempatTinggal,
        alamat: kk.alamat,
        rtId: rt.id,
        dusunId: rt.dusunId,
        latitude: `-6.81${String(count).padStart(2, '0')}`,
        longitude: `107.35${String(count).padStart(2, '0')}`,
        isActive: true,
      },
    });
    
    count++;
    console.log(`✅ KK ${count}: ${createdKK.nomorKK}`);
    console.log(`   📍 Alamat: ${createdKK.alamat}`);
    console.log(`   🏠 Tempat Tinggal: ${createdKK.jenisTempatTinggal}`);
    console.log(`   🗺️  Wilayah: ${rt.dusunNama} - RW ${rt.rwNomor} - RT ${rt.nomor}\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 RINGKASAN DATA KK');
  console.log('═══════════════════════════════════════════');
  console.log(`📝 Total KK Baru  : ${count}`);
  console.log('═══════════════════════════════════════════');
  console.log('\n✅ Seeding data KK selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
