import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed data Desa Bojongpicung
  const desa = await prisma.desa.upsert({
    where: { kodeDesa: '3201172001' },
    update: {},
    create: {
      namaDesa: 'Bojongpicung',
      kodeDesa: '3201172001',
      kodePos: '43283',
      kecamatan: 'Bojongpicung',
      kabupaten: 'Cianjur',
      provinsi: 'Jawa Barat',
      negara: 'Indonesia',
      alamatKantor: 'Jl. Raya Bojongpicung No. 1, Kecamatan Bojongpicung, Kabupaten Cianjur, Jawa Barat 43283',
      telepon: '(0263) 123456',
      email: 'desabojongpicung@cianjurkab.go.id',
      website: 'https://bojongpicung-bojongpicung.kampungpinter.co.id',
      luasWilayah: '1.285 Ha',
      ketinggian: '450-650 m dpl',
      curahHujan: '2.500-3.000 mm/tahun',
      batasUtara: 'Desa Sukaratu dan Kecamatan Ciranjang',
      batasSelatan: 'Desa Cisuru dan Desa Mekarsari',
      batasTimur: 'Desa Sindanglaya dan Desa Sukarama',
      batasBarat: 'Kecamatan Cibeber',
      visi: 'Terwujudnya Desa Bojongpicung yang Maju, Mandiri, dan Sejahtera dalam wadah pemerintahan yang Bersih, Transparan dan Profesional',
      misi: JSON.stringify([
        'Meningkatkan kualitas pelayanan publik dan tata kelola pemerintahan desa yang baik',
        'Mengembangkan infrastruktur desa yang merata dan berkelanjutan',
        'Meningkatkan kesejahteraan masyarakat melalui pengembangan ekonomi lokal dan UMKM',
        'Meningkatkan kualitas sumber daya manusia melalui pendidikan dan pelatihan',
        'Melestarikan lingkungan hidup dan sumber daya alam untuk keberlanjutan desa',
        'Meningkatkan ketahanan sosial dan budaya masyarakat desa',
      ]),
      tanggalBerdiri: new Date('1982-01-01'),
      hariJadi: '1 Januari',
      sejarahSingkat: 'Desa Bojongpicung mempunyai sejarah yang latar belakangnya bahwa dulu di sini terdapat suatu bobojong atau tanah yang agak tinggi yang di atas bobojong tersebut tumbuh pohon picung (pohon dengan buah yang biasa digunakan sebagai bumbu masakan). Oleh karena itu, daerah tersebut dinamakan Bojongpicung, yang berasal dari kata Bojong (tanah tinggi/plateau) dan Picung (nama pohon). Seiring berjalannya waktu, wilayah ini berkembang menjadi sebuah desa yang produktif dengan pertanian sebagai mata pencaharian utama masyarakat. Saat ini Desa Bojongpicung terus berkembang dalam berbagai aspek kehidupan masyarakat, dengan potensi pertanian, perkebunan, dan wisata alam yang menjanjikan.',
    },
  });

  console.log('✅ Desa seeded:', desa.namaDesa);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
