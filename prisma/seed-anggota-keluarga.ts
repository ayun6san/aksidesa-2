import {
  PrismaClient,
  JenisKelamin,
  Agama,
  StatusPerkawinan,
  StatusPenduduk,
  StatusKTP,
  JenisDisabilitas,
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate NIK
function generateNIK(kkIndex: number, urutan: number): string {
  // Format: 320117 (kode wilayah) + 010101 (kecamatan/kelurahan) + DDMMYY (tanggal lahir) + 4 digit urutan
  const base = '320117010101';
  return `${base}${String(kkIndex + 1).padStart(2, '0')}${String(urutan).padStart(2, '0')}01`;
}

// Helper function to generate random date
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Mulai seeding data anggota keluarga...\n');

  // Ambil semua KK yang ada
  const kkList = await prisma.kK.findMany({
    include: {
      rt: {
        include: {
          rw: {
            include: {
              dusun: true,
            },
          },
        },
      },
    },
  });

  if (kkList.length === 0) {
    console.log('❌ Tidak ada data KK. Jalankan seed-kk.ts terlebih dahulu.');
    return;
  }

  console.log(`📋 Ditemukan ${kkList.length} KK\n`);

  // Clear existing penduduk data
  console.log('🗑️  Menghapus data penduduk lama...');
  await prisma.penduduk.deleteMany({});
  console.log('✅ Data penduduk lama berhasil dihapus\n');

  // Data anggota keluarga untuk setiap KK
  // Setiap KK memiliki komposisi keluarga yang berbeda
  const anggotaKeluargaData: {
    namaLengkap: string;
    jenisKelamin: JenisKelamin;
    tempatLahir: string;
    tanggalLahir: Date;
    hubunganKeluarga: string;
    statusPerkawinan: StatusPerkawinan;
    pekerjaan: string;
    pendidikan: string;
    golonganDarah: string;
    agama: Agama;
  }[][] = [
    // KK 1 - Keluarga Kepala Desa (4 anggota)
    [
      {
        namaLengkap: 'H. Ahmad Hidayat',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1970-03-15'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Kepala Desa',
        pendidikan: 'S1',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Hj. Siti Nurhaliza',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Bandung',
        tanggalLahir: new Date('1975-08-20'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'SMA',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Muhammad Rizki',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1998-05-10'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Wiraswasta',
        pendidikan: 'D3',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Aisyah Putri',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('2002-12-25'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Pelajar/Mahasiswa',
        pendidikan: 'SMA',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
    ],
    // KK 2 - Keluarga Petani (5 anggota)
    [
      {
        namaLengkap: 'Dadang Suryana',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1965-06-12'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Petani',
        pendidikan: 'SD',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Iyoh',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1968-11-05'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'SD',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Rina Marlina',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1992-02-28'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Guru',
        pendidikan: 'S1',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Agus Setiawan',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1995-07-18'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Buruh Tani',
        pendidikan: 'SMP',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Dedi Kurniawan',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('2005-04-03'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Pelajar/Mahasiswa',
        pendidikan: 'SMP',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
    ],
    // KK 3 - Keluarga PNS (3 anggota)
    [
      {
        namaLengkap: 'Ir. Bambang Wijaya',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Jakarta',
        tanggalLahir: new Date('1975-09-22'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'PNS',
        pendidikan: 'S1',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Dra. Dewi Kartika',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Bandung',
        tanggalLahir: new Date('1978-01-15'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Guru',
        pendidikan: 'S1',
        golonganDarah: 'AB',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Raka Wijaya',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('2008-06-30'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Pelajar/Mahasiswa',
        pendidikan: 'SMP',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
    ],
    // KK 4 - Keluarga Pedagang (4 anggota)
    [
      {
        namaLengkap: 'H. Ujang Suparman',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1960-12-01'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Pedagang',
        pendidikan: 'SMP',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Hj. Yayah',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1963-04-17'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Pedagang',
        pendidikan: 'SD',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Rendi Suparman',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1988-10-08'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Pedagang',
        pendidikan: 'SMA',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Sinta Maharani',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1990-03-25'),
        hubunganKeluarga: 'Menantu',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'SMA',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
    ],
    // KK 5 - Keluarga Muda (2 anggota)
    [
      {
        namaLengkap: 'Fajar Ramadhan',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1990-07-10'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Karyawan Swasta',
        pendidikan: 'S1',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Nurul Hidayah',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Bandung',
        tanggalLahir: new Date('1995-11-20'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Guru',
        pendidikan: 'S1',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
    ],
    // KK 6 - Keluarga Besar (6 anggota)
    [
      {
        namaLengkap: 'Komarudin',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1958-01-30'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Petani',
        pendidikan: 'Tidak Sekolah',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Entin',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1962-05-12'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'Tidak Sekolah',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Yayan',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1985-08-15'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Buruh Bangunan',
        pendidikan: 'SMP',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Wati',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1988-03-22'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Buruh Pabrik',
        pendidikan: 'SMA',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Asep',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1993-12-05'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Ojek Online',
        pendidikan: 'SMA',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Maya Sari',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('2000-06-18'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Pelajar/Mahasiswa',
        pendidikan: 'SMA',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
    ],
    // KK 7 - Keluarga Janda/Duda (2 anggota)
    [
      {
        namaLengkap: 'Mimin',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1950-02-14'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.CERAI_MATI,
        pekerjaan: 'Tidak Bekerja',
        pendidikan: 'SD',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Andi Hermawan',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1982-09-03'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Wiraswasta',
        pendidikan: 'SMA',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
    ],
    // KK 8 - Keluarga Perantau (3 anggota)
    [
      {
        namaLengkap: 'Endang Supriatna',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1972-04-08'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Wiraswasta',
        pendidikan: 'SMA',
        golonganDarah: 'AB',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Lilis',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1976-10-25'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'SMP',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Dian Puspita',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Jakarta',
        tanggalLahir: new Date('2003-01-12'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Pelajar/Mahasiswa',
        pendidikan: 'SMA',
        golonganDarah: 'AB',
        agama: Agama.ISLAM,
      },
    ],
    // KK 9 - Keluarga PNS Pensiunan (4 anggota)
    [
      {
        namaLengkap: 'Drs. Asep Sumarna',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Bandung',
        tanggalLahir: new Date('1955-08-17'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Pensiunan PNS',
        pendidikan: 'S1',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Tati Sumiati',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1958-12-10'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'SMA',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Dadan Sumarna',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1985-06-20'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Dokter',
        pendidikan: 'S2',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Rina Sumarna',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1988-11-15'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Perawat',
        pendidikan: 'S1',
        golonganDarah: 'B',
        agama: Agama.ISLAM,
      },
    ],
    // KK 10 - Keluarga Muda Baru Menikah (3 anggota + bayi)
    [
      {
        namaLengkap: 'Rizal Firmansyah',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('1995-02-28'),
        hubunganKeluarga: 'Kepala Keluarga',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Karyawan Swasta',
        pendidikan: 'S1',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Putri Amelia',
        jenisKelamin: JenisKelamin.PEREMPUAN,
        tempatLahir: 'Bandung',
        tanggalLahir: new Date('1998-05-05'),
        hubunganKeluarga: 'Istri',
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'Ibu Rumah Tangga',
        pendidikan: 'D3',
        golonganDarah: 'A',
        agama: Agama.ISLAM,
      },
      {
        namaLengkap: 'Baby Ahmad Faisal',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        tempatLahir: 'Cianjur',
        tanggalLahir: new Date('2024-01-15'),
        hubunganKeluarga: 'Anak',
        statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
        pekerjaan: 'Tidak Bekerja',
        pendidikan: 'Tidak Sekolah',
        golonganDarah: 'O',
        agama: Agama.ISLAM,
      },
    ],
  ];

  let totalPenduduk = 0;

  // Insert anggota keluarga untuk setiap KK
  for (let kkIndex = 0; kkIndex < kkList.length; kkIndex++) {
    const kk = kkList[kkIndex];
    const anggotaList = anggotaKeluargaData[kkIndex] || [];

    console.log(`\n📂 KK ${kkIndex + 1}: ${kk.nomorKK}`);
    console.log(`   📍 Alamat: ${kk.alamat}`);

    for (let urutan = 0; urutan < anggotaList.length; urutan++) {
      const anggota = anggotaList[urutan];
      const nik = generateNIK(kkIndex, urutan + 1);

      // Calculate age
      const today = new Date();
      const birthDate = new Date(anggota.tanggalLahir);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Determine status KTP based on age
      let statusKTP = StatusKTP.BELUM_BUAT;
      if (age >= 17) {
        statusKTP = StatusKTP.SUDAH_BUAT;
      }

      const penduduk = await prisma.penduduk.create({
        data: {
          nik: nik,
          namaLengkap: anggota.namaLengkap,
          tempatLahir: anggota.tempatLahir,
          tanggalLahir: anggota.tanggalLahir,
          jenisKelamin: anggota.jenisKelamin,
          golonganDarah: anggota.golonganDarah,
          agama: anggota.agama,
          statusPerkawinan: anggota.statusPerkawinan,
          pekerjaan: anggota.pekerjaan,
          pendidikan: anggota.pendidikan,
          kkId: kk.id,
          hubunganKeluarga: anggota.hubunganKeluarga,
          urutanDalamKK: urutan + 1,
          rtId: kk.rtId,
          dusunId: kk.dusunId,
          alamat: kk.alamat,
          statusKTP: statusKTP,
          status: StatusPenduduk.TETAP,
          isActive: true,
          kewarganegaraan: 'Indonesia',
          jenisNewabilitas: JenisDisabilitas.TIDAK_ADA,
        },
      });

      totalPenduduk++;

      // Update kepala keluarga reference
      if (anggota.hubunganKeluarga === 'Kepala Keluarga') {
        await prisma.kK.update({
          where: { id: kk.id },
          data: { kepalaKeluargaId: penduduk.id },
        });
      }

      console.log(`   ✅ ${urutan + 1}. ${anggota.namaLengkap}`);
      console.log(`      📝 NIK: ${nik}`);
      console.log(`      👤 ${anggota.jenisKelamin} | ${age} tahun`);
      console.log(`      👨‍👩‍👧‍👦 ${anggota.hubunganKeluarga}`);
    }
  }

  // Update counts for RT, RW, Dusun
  console.log('\n🔄 Memperbarui jumlah penduduk...');

  for (const kk of kkList) {
    if (kk.rtId) {
      const count = await prisma.penduduk.count({
        where: { rtId: kk.rtId, isActive: true },
      });
      await prisma.rT.update({
        where: { id: kk.rtId },
        data: { jumlahPenduduk: count },
      });
    }

    if (kk.dusunId) {
      const count = await prisma.penduduk.count({
        where: { dusunId: kk.dusunId, isActive: true },
      });
      await prisma.dusun.update({
        where: { id: kk.dusunId },
        data: { jumlahPenduduk: count },
      });
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RINGKASAN DATA ANGGOTA KELUARGA');
  console.log('═══════════════════════════════════════════');
  console.log(`📝 Total KK        : ${kkList.length}`);
  console.log(`👥 Total Penduduk  : ${totalPenduduk}`);
  console.log('═══════════════════════════════════════════');

  // Count by gender
  const lakiLaki = await prisma.penduduk.count({
    where: { jenisKelamin: JenisKelamin.LAKI_LAKI },
  });
  const perempuan = await prisma.penduduk.count({
    where: { jenisKelamin: JenisKelamin.PEREMPUAN },
  });
  console.log(`👨 Laki-laki       : ${lakiLaki}`);
  console.log(`👩 Perempuan       : ${perempuan}`);
  console.log('═══════════════════════════════════════════');

  console.log('\n✅ Seeding data anggota keluarga selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
