import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menyimpan data Desa Bojongpicung...');

  // Data Desa Bojongpicung
  const desaData = {
    namaDesa: 'Bojongpicung',
    kodeDesa: '3203232006', // Kode Kemendagri untuk Desa Bojongpicung
    kodePos: '43263',
    kecamatan: 'Bojongpicung',
    kabupaten: 'Cianjur',
    provinsi: 'Jawa Barat',
    negara: 'Indonesia',
    alamatKantor: 'Jl. Raya Bojongpicung No. 1, Desa Bojongpicung, Kecamatan Bojongpicung, Kabupaten Cianjur, Jawa Barat 43263',
    telepon: '(0263) 123456',
    email: 'desabojongpicung@cianjurkab.go.id',
    website: null,
    // Data Geografis
    luasWilayah: '1.245 Ha',
    ketinggian: '450 mdpl',
    curahHujan: '2.500 mm/tahun',
    batasUtara: 'Desa Sukamaju',
    batasSelatan: 'Desa Sanca',
    batasTimur: 'Desa Sukaresmi',
    batasBarat: 'Desa Cisokan',
    // Visi Misi
    visi: 'Terwujudnya Desa Bojongpicung yang Maju, Mandiri, dan Sejahtera Berbasis Pertanian dan Pariwisata',
    misi: JSON.stringify([
      'Meningkatkan kualitas sumber daya manusia melalui pendidikan dan pelatihan',
      'Mengembangkan potensi pertanian dan perkebunan secara berkelanjutan',
      'Meningkatkan infrastruktur desa untuk mendukung kegiatan ekonomi masyarakat',
      'Mengembangkan potensi wisata alam dan budaya desa',
      'Meningkatkan pelayanan publik yang berkualitas dan transparan',
      'Mewujudkan tata kelola pemerintahan desa yang baik dan bersih',
      'Meningkatkan kesejahteraan masyarakat melalui program pemberdayaan'
    ]),
    // Sejarah
    tanggalBerdiri: new Date('1945-08-17'),
    hariJadi: '17 Agustus',
    sejarahSingkat: `Desa Bojongpicung merupakan salah satu desa yang terletak di Kecamatan Bojongpicung, Kabupaten Cianjur, Provinsi Jawa Barat. Desa ini memiliki sejarah panjang sejak era kemerdekaan Indonesia.

Nama "Bojongpicung" berasal dari dua kata dalam bahasa Sunda, yaitu "Bojong" yang berarti tanah tinggi atau bukit, dan "Picung" yang merupakan nama sejenis tumbuhan (pohon picung/Kepayang) yang banyak tumbuh di daerah ini pada masa lalu.

Desa Bojongpicung dikenal dengan potensi pertanian yang cukup besar, terutama produksi padi, palawija, dan sayuran. Selain itu, desa ini juga memiliki potensi wisata alam yang indah dengan pemandangan pegunungan dan persawahan yang asri.

Masyarakat Desa Bojongpicung mayoritas bermata pencaharian sebagai petani dan peternak. Gotong royong dan kebersamaan masih sangat kental dalam kehidupan sehari-hari masyarakat desa ini.`
  };

  // Cek apakah sudah ada data desa
  const existingDesa = await prisma.desa.findFirst();

  let desa;
  if (existingDesa) {
    // Update data desa yang ada
    desa = await prisma.desa.update({
      where: { id: existingDesa.id },
      data: desaData
    });
    console.log('✅ Data desa berhasil diperbarui!');
  } else {
    // Buat data desa baru
    desa = await prisma.desa.create({
      data: desaData
    });
    console.log('✅ Data desa berhasil dibuat!');
  }

  console.log('\n📋 Data Desa:');
  console.log(`   Nama Desa    : ${desa.namaDesa}`);
  console.log(`   Kode Desa    : ${desa.kodeDesa}`);
  console.log(`   Kode Pos     : ${desa.kodePos}`);
  console.log(`   Kecamatan    : ${desa.kecamatan}`);
  console.log(`   Kabupaten    : ${desa.kabupaten}`);
  console.log(`   Provinsi     : ${desa.provinsi}`);
  console.log(`   Luas Wilayah : ${desa.luasWilayah}`);
  console.log(`   Ketinggian   : ${desa.ketinggian}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
