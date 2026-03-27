import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data Wilayah Desa Bojongpicung
// Sumber: Data administratif Desa Bojongpicung, Kec. Bojongpicung, Kab. Cianjur

const wilayahData = [
  {
    dusun: {
      nama: 'Pamoyanan',
      kode: '001',
      rw: [
        {
          nomor: '001',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009']
        },
        {
          nomor: '002',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009']
        },
        {
          nomor: '003',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009']
        }
      ]
    }
  },
  {
    dusun: {
      nama: 'Bojongpicung',
      kode: '002',
      rw: [
        {
          nomor: '001',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013']
        },
        {
          nomor: '002',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014']
        }
      ]
    }
  },
  {
    dusun: {
      nama: 'Pasirhuni',
      kode: '003',
      rw: [
        {
          nomor: '001',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013']
        },
        {
          nomor: '002',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014']
        }
      ]
    }
  },
  {
    dusun: {
      nama: 'Sinagar',
      kode: '004',
      rw: [
        {
          nomor: '001',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008']
        },
        {
          nomor: '002',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009']
        }
      ]
    }
  },
  {
    dusun: {
      nama: 'Mekarasih',
      kode: '005',
      rw: [
        {
          nomor: '001',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010']
        },
        {
          nomor: '002',
          rt: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011']
        }
      ]
    }
  }
];

async function main() {
  console.log('🌱 Mulai seeding data wilayah...\n');

  // Get desa
  const desa = await prisma.desa.findFirst();
  
  if (!desa) {
    console.log('❌ Data desa tidak ditemukan. Jalankan seed-desa.ts terlebih dahulu.');
    return;
  }

  let totalDusun = 0;
  let totalRW = 0;
  let totalRT = 0;

  for (const item of wilayahData) {
    const dusunData = item.dusun;
    
    // Create Dusun
    const dusun = await prisma.dusun.create({
      data: {
        nama: dusunData.nama,
        kode: dusunData.kode,
        desaId: desa.id,
      }
    });
    totalDusun++;
    console.log(`✅ Dusun: ${dusun.nama}`);

    // Create RW and RT
    for (const rwData of dusunData.rw) {
      const rw = await prisma.rW.create({
        data: {
          nomor: rwData.nomor,
          dusunId: dusun.id,
        }
      });
      totalRW++;
      console.log(`   └── RW ${rw.nomor}`);

      // Create RT
      for (const nomorRT of rwData.rt) {
        await prisma.rT.create({
          data: {
            nomor: nomorRT,
            rwId: rw.id,
          }
        });
        totalRT++;
      }
      console.log(`       └── ${rwData.rt.length} RT`);
    }
  }

  console.log('\n========================================');
  console.log('📊 Ringkasan Data Wilayah:');
  console.log(`   Dusun : ${totalDusun}`);
  console.log(`   RW    : ${totalRW}`);
  console.log(`   RT    : ${totalRT}`);
  console.log('========================================');
  console.log('\n✅ Seeding wilayah selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
