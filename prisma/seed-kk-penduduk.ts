import { PrismaClient, JenisKelamin, Agama, StatusPerkawinan, StatusPenduduk, StatusKTP, JenisTempatTinggal, Kewarganegaraan, JenisDisabilitas } from '@prisma/client';

const prisma = new PrismaClient();

// Data nama Indonesia
const namaLakiLaki = [
  'Ahmad', 'Budi', 'Cahyo', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hadi', 'Irfan', 'Joko',
  'Krisna', 'Lukman', 'Maman', 'Nana', 'Oki', 'Purnomo', 'Rahmat', 'Slamet', 'Tono', 'Udin',
  'Wahyu', 'Yanto', 'Zainal', 'Agus', 'Bambang', 'Cecep', 'Dadan', 'Endang', 'Ferry', 'Galih'
];

const namaPerempuan = [
  'Ani', 'Beti', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gina', 'Hana', 'Indah', 'Julia',
  'Kartini', 'Lina', 'Mira', 'Neni', 'Opi', 'Putri', 'Rina', 'Sari', 'Tina', 'Umi',
  'Vina', 'Wati', 'Yuni', 'Zara', 'Ayu', 'Bella', 'Cinta', 'Dina', 'Elsa', 'Fani'
];

const namaKeluarga = [
  'Wijaya', 'Kusuma', 'Pratama', 'Saputra', 'Hidayat', 'Rahayu', 'Permata', 'Dewantara',
  'Santoso', 'Hartono', 'Susanto', 'Wibowo', 'Setiawan', 'Purnama', 'Nugroho', 'Suryadi',
  'Rahardjo', 'Santika', 'Widjaja', 'Kusnadi', 'Prasetyo', 'Gunawan', 'Suryadi', 'Wicaksono', 'Haryanto'
];

const pekerjaanList = [
  'Petani', 'Nelayan', 'Pedagang', 'Wiraswasta', 'PNS', 'Guru', 'Dokter', 'Perawat',
  'TNI', 'Polisi', 'Sopir', 'Buruh', 'Tukang', 'Montir', 'Penjahit', 'IBU RUMAH TANGGA',
  'Pelajar', 'Mahasiswa', 'Pensiunan', 'Karyawan Swasta'
];

const pendidikanList = [
  'Tidak Sekolah', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'
];

const golDarahList = ['A', 'B', 'AB', 'O'];

// Generate NIK
function generateNIK(kodeKecamatan: string, tanggalLahir: Date, jenisKelamin: JenisKelamin, urutan: number): string {
  const tgl = tanggalLahir.getDate().toString().padStart(2, '0');
  const bln = (tanggalLahir.getMonth() + 1).toString().padStart(2, '0');
  const thn = tanggalLahir.getFullYear().toString().slice(-2);
  
  // Untuk perempuan, tanggal ditambah 40
  const tglNIK = jenisKelamin === 'PEREMPUAN' ? (parseInt(tgl) + 40).toString() : tgl;
  
  const urut = urutan.toString().padStart(4, '0');
  
  return `${kodeKecamatan}${tglNIK}${bln}${thn}${urut}`;
}

// Generate Nomor KK
function generateNomorKK(kodeKecamatan: string, urutan: number): string {
  const thn = new Date().getFullYear();
  const urut = urutan.toString().padStart(4, '0');
  return `${kodeKecamatan}${thn}${urut}`;
}

// Random date between two dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Starting seed KK & Penduduk...');

  // 1. Create Desa if not exists
  let desa = await prisma.desa.findFirst();
  if (!desa) {
    desa = await prisma.desa.create({
      data: {
        namaDesa: 'Sukamaju',
        kodeDesa: '3201012001',
        kodePos: '46111',
        kecamatan: 'Cikembar',
        kabupaten: 'Sukabumi',
        provinsi: 'Jawa Barat',
        negara: 'Indonesia',
        alamatKantor: 'Jl. Desa Sukamaju No. 1',
        telepon: '0266-123456',
      }
    });
    console.log('✅ Created Desa:', desa.namaDesa);
  }

  // 2. Create Dusun, RW, RT
  const dusunData = [
    { nama: 'Cimanggis', kode: '001' },
    { nama: 'Cibeureum', kode: '002' },
    { nama: 'Cikahuripan', kode: '003' },
  ];

  const dusunList = [];
  for (const d of dusunData) {
    let dusun = await prisma.dusun.findFirst({ where: { nama: d.nama } });
    if (!dusun) {
      dusun = await prisma.dusun.create({
        data: {
          nama: d.nama,
          kode: d.kode,
          desaId: desa.id,
        }
      });
    }
    dusunList.push(dusun);
  }
  console.log('✅ Created/Fetch Dusun:', dusunList.length);

  // Create RW for each Dusun
  const rwList = [];
  for (const dusun of dusunList) {
    for (let i = 1; i <= 2; i++) {
      const nomor = i.toString().padStart(3, '0');
      let rw = await prisma.rW.findFirst({ where: { dusunId: dusun.id, nomor } });
      if (!rw) {
        rw = await prisma.rW.create({
          data: {
            nomor,
            dusunId: dusun.id,
          }
        });
      }
      rwList.push({ ...rw, dusunId: dusun.id });
    }
  }
  console.log('✅ Created/Fetch RW:', rwList.length);

  // Create RT for each RW
  const rtList = [];
  for (const rw of rwList) {
    for (let i = 1; i <= 3; i++) {
      const nomor = i.toString().padStart(3, '0');
      let rt = await prisma.rT.findFirst({ where: { rwId: rw.id, nomor } });
      if (!rt) {
        rt = await prisma.rT.create({
          data: {
            nomor,
            rwId: rw.id,
          }
        });
      }
      rtList.push({ ...rt, dusunId: rw.dusunId });
    }
  }
  console.log('✅ Created/Fetch RT:', rtList.length);

  // Kode Kecamatan untuk NIK (contoh: Cikembar - Sukabumi)
  const kodeKecamatan = '320101';

  // 3. Create 25 KK with family members
  const jumlahKK = 25;
  let nikUrutan = 1;
  let kkUrutan = 1;

  for (let i = 0; i < jumlahKK; i++) {
    // Pilih RT secara acak
    const rt = randomElement(rtList);
    const dusun = dusunList.find(d => d.id === rt.dusunId);

    // Generate Nomor KK
    const nomorKK = generateNomorKK(kodeKecamatan, kkUrutan++);
    
    // Nama keluarga
    const namaFam = namaKeluarga[i % namaKeluarga.length];
    
    // Jenis tempat tinggal
    const jenisTempatTinggal = randomElement(Object.values(JenisTempatTinggal));

    // Alamat
    const alamat = `KP. ${dusun?.nama || 'Sukamaju'} RT ${rt.nomor}/RW ${rwList.find(rw => rw.id === rt.rwId)?.nomor}`;

    // Create KK
    const kk = await prisma.kK.create({
      data: {
        nomorKK,
        alamat,
        jenisTempatTinggal,
        rtId: rt.id,
        dusunId: rt.dusunId,
        tanggalTerbit: randomDate(new Date(2020, 0, 1), new Date()),
        isActive: true,
      }
    });

    // Generate anggota keluarga (3-6 orang per KK)
    const jumlahAnggota = Math.floor(Math.random() * 4) + 3; // 3-6 orang
    
    // Kepala Keluarga (ayah)
    const namaAyah = randomElement(namaLakiLaki);
    const tglLahirAyah = randomDate(new Date(1970, 0, 1), new Date(1990, 11, 31));
    const nikAyah = generateNIK(kodeKecamatan, tglLahirAyah, JenisKelamin.LAKI_LAKI, nikUrutan++);

    // Ibu
    const namaIbu = randomElement(namaPerempuan);
    const tglLahirIbu = randomDate(new Date(1975, 0, 1), new Date(1995, 11, 31));
    const nikIbu = generateNIK(kodeKecamatan, tglLahirIbu, JenisKelamin.PEREMPUAN, nikUrutan++);

    // Create Kepala Keluarga
    const kepalaKeluarga = await prisma.penduduk.create({
      data: {
        nik: nikAyah,
        namaLengkap: `${namaAyah} ${namaFam}`,
        tempatLahir: randomElement(['Sukabumi', 'Bogor', 'Bandung', 'Jakarta', 'Cianjur']),
        tanggalLahir: tglLahirAyah,
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        golonganDarah: randomElement(golDarahList),
        agama: randomElement([Agama.ISLAM, Agama.ISLAM, Agama.ISLAM, Agama.KRISTEN, Agama.HINDU]),
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: randomElement(pekerjaanList.filter(p => !['Pelajar', 'Mahasiswa', 'IBU RUMAH TANGGA'].includes(p))),
        pendidikan: randomElement(['SMA', 'D3', 'S1', 'SMP']),
        kewarganegaraan: Kewarganegaraan.WNI,
        statusKTP: StatusKTP.SUDAH_BUAT,
        namaAyah: `${randomElement(namaLakiLaki)} ${namaKeluarga[(i + 5) % namaKeluarga.length]}`,
        namaIbu: `${randomElement(namaPerempuan)} ${namaKeluarga[(i + 10) % namaKeluarga.length]}`,
        kkId: kk.id,
        hubunganKeluarga: 'Kepala Keluarga',
        urutanDalamKK: 1,
        status: StatusPenduduk.TETAP,
        isActive: true,
      }
    });

    // Update KK dengan kepala keluarga
    await prisma.kK.update({
      where: { id: kk.id },
      data: { kepalaKeluargaId: kepalaKeluarga.id }
    });

    // Create Ibu
    await prisma.penduduk.create({
      data: {
        nik: nikIbu,
        namaLengkap: `${namaIbu} ${namaFam}`,
        tempatLahir: randomElement(['Sukabumi', 'Bogor', 'Bandung', 'Jakarta', 'Cianjur']),
        tanggalLahir: tglLahirIbu,
        jenisKelamin: JenisKelamin.PEREMPUAN,
        golonganDarah: randomElement(golDarahList),
        agama: randomElement([Agama.ISLAM, Agama.ISLAM, Agama.ISLAM, Agama.KRISTEN, Agama.HINDU]),
        statusPerkawinan: StatusPerkawinan.KAWIN,
        pekerjaan: 'IBU RUMAH TANGGA',
        pendidikan: randomElement(['SMA', 'D3', 'S1', 'SMP']),
        kewarganegaraan: Kewarganegaraan.WNI,
        statusKTP: StatusKTP.SUDAH_BUAT,
        namaAyah: `${randomElement(namaLakiLaki)} ${namaKeluarga[(i + 15) % namaKeluarga.length]}`,
        namaIbu: `${randomElement(namaPerempuan)} ${namaKeluarga[(i + 20) % namaKeluarga.length]}`,
        kkId: kk.id,
        hubunganKeluarga: 'Istri',
        urutanDalamKK: 2,
        status: StatusPenduduk.TETAP,
        isActive: true,
      }
    });

    // Create anak-anak (1-4 anak)
    const jumlahAnak = jumlahAnggota - 2;
    for (let j = 0; j < jumlahAnak; j++) {
      const jenisKelaminAnak = Math.random() > 0.5 ? JenisKelamin.LAKI_LAKI : JenisKelamin.PEREMPUAN;
      const namaDepan = jenisKelaminAnak === JenisKelamin.LAKI_LAKI 
        ? randomElement(namaLakiLaki) 
        : randomElement(namaPerempuan);
      const tglLahirAnak = randomDate(new Date(2000, 0, 1), new Date(2018, 11, 31));
      const nikAnak = generateNIK(kodeKecamatan, tglLahirAnak, jenisKelaminAnak, nikUrutan++);
      
      const umur = new Date().getFullYear() - tglLahirAnak.getFullYear();
      const pekerjaanAnak = umur < 6 ? 'Belum Bekerja' : umur < 18 ? 'Pelajar' : randomElement(['Mahasiswa', 'Pelajar', 'Wiraswasta', 'Karyawan Swasta']);
      const pendidikanAnak = umur < 6 ? 'Belum Sekolah' : umur < 12 ? 'SD' : umur < 15 ? 'SMP' : umur < 18 ? 'SMA' : randomElement(['SMA', 'D3', 'S1']);

      await prisma.penduduk.create({
        data: {
          nik: nikAnak,
          namaLengkap: `${namaDepan} ${namaFam}`,
          tempatLahir: randomElement(['Sukabumi', 'Bogor', 'Bandung', 'Jakarta', 'Cianjur']),
          tanggalLahir: tglLahirAnak,
          jenisKelamin: jenisKelaminAnak,
          golonganDarah: randomElement(golDarahList),
          agama: randomElement([Agama.ISLAM, Agama.ISLAM, Agama.ISLAM, Agama.KRISTEN, Agama.HINDU]),
          statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
          pekerjaan: pekerjaanAnak,
          pendidikan: pendidikanAnak,
          kewarganegaraan: Kewarganegaraan.WNI,
          statusKTP: umur >= 17 ? StatusKTP.SUDAH_BUAT : StatusKTP.BELUM_BUAT,
          namaAyah: `${namaAyah} ${namaFam}`,
          namaIbu: `${namaIbu} ${namaFam}`,
          anakKe: j + 1,
          kkId: kk.id,
          hubunganKeluarga: 'Anak',
          urutanDalamKK: 3 + j,
          status: StatusPenduduk.TETAP,
          isActive: true,
        }
      });
    }

    console.log(`✅ Created KK ${i + 1}/${jumlahKK}: ${nomorKK} - ${namaAyah} ${namaFam}`);
  }

  // 4. Update jumlah KK dan Penduduk di Dusun, RW, RT
  for (const rt of rtList) {
    const count = await prisma.kK.count({ where: { rtId: rt.id, isActive: true } });
    const pendudukCount = await prisma.penduduk.count({
      where: {
        kk: { rtId: rt.id },
        isActive: true
      }
    });
    await prisma.rT.update({
      where: { id: rt.id },
      data: { jumlahKK: count, jumlahPenduduk: pendudukCount }
    });
  }

  for (const rw of rwList) {
    const rtInRw = rtList.filter(rt => rt.rwId === rw.id);
    const totalKK = rtInRw.reduce((sum, rt) => sum + rt.jumlahKK, 0);
    const totalPenduduk = rtInRw.reduce((sum, rt) => sum + rt.jumlahPenduduk, 0);
    await prisma.rW.update({
      where: { id: rw.id },
      data: { jumlahKK: totalKK, jumlahPenduduk: totalPenduduk }
    });
  }

  for (const dusun of dusunList) {
    const rwInDusun = rwList.filter(rw => rw.dusunId === dusun.id);
    const totalKK = rwInDusun.reduce((sum, rw) => sum + rw.jumlahKK, 0);
    const totalPenduduk = rwInDusun.reduce((sum, rw) => sum + rw.jumlahPenduduk, 0);
    await prisma.dusun.update({
      where: { id: dusun.id },
      data: { jumlahKK: totalKK, jumlahPenduduk: totalPenduduk }
    });
  }

  // Summary
  const totalKK = await prisma.kK.count();
  const totalPenduduk = await prisma.penduduk.count();
  const totalLakiLaki = await prisma.penduduk.count({ where: { jenisKelamin: JenisKelamin.LAKI_LAKI } });
  const totalPerempuan = await prisma.penduduk.count({ where: { jenisKelamin: JenisKelamin.PEREMPUAN } });

  console.log('\n🎉 Seed completed!');
  console.log('==========================================');
  console.log(`📊 Total KK: ${totalKK}`);
  console.log(`📊 Total Penduduk: ${totalPenduduk}`);
  console.log(`   👨 Laki-laki: ${totalLakiLaki}`);
  console.log(`   👩 Perempuan: ${totalPerempuan}`);
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
