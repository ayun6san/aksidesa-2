import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisPeristiwa, JenisKelamin, Agama, StatusPenduduk, StatusPerkawinan, StatusKTP, JenisDisabilitas, Kewarganegaraan } from '@prisma/client';

// GET - List all Peristiwa with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const jenisPeristiwa = searchParams.get('jenisPeristiwa') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { penduduk: { namaLengkap: { contains: search } } },
        { namaBayi: { contains: search } },
        { keterangan: { contains: search } },
      ];
    }
    
    if (jenisPeristiwa) {
      where.jenisPeristiwa = jenisPeristiwa as JenisPeristiwa;
    }

    // Get peristiwa
    const [peristiwaList, total] = await Promise.all([
      db.peristiwaKependudukan.findMany({
        where,
        include: {
          penduduk: {
            select: {
              id: true,
              nik: true,
              namaLengkap: true,
              jenisKelamin: true,
            }
          },
          kk: {
            select: {
              id: true,
              nomorKK: true,
            }
          }
        },
        orderBy: { tanggalPeristiwa: 'desc' },
        skip,
        take: limit,
      }),
      db.peristiwaKependudukan.count({ where }),
    ]);

    // Transform data
    const transformedData = peristiwaList.map(p => ({
      id: p.id,
      jenisPeristiwa: p.jenisPeristiwa,
      pendudukId: p.pendudukId,
      penduduk: p.penduduk,
      kkId: p.kkId,
      kk: p.kk,
      tanggalPeristiwa: p.tanggalPeristiwa?.toISOString() || null,
      tempat: p.tempat,
      keterangan: p.keterangan,
      alamatAsal: p.alamatAsal,
      alamatTujuan: p.alamatTujuan,
      penyebabKematian: p.penyebabKematian,
      namaBayi: p.namaBayi,
      jenisKelaminBayi: p.jenisKelaminBayi,
      beratBayi: p.beratBayi,
      panjangBayi: p.panjangBayi,
      isProcessed: p.isProcessed,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching Peristiwa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data Peristiwa' },
      { status: 500 }
    );
  }
}

// POST - Create new Peristiwa with automatic data processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jenisPeristiwa,
      pendudukId,
      kkId,
      tanggalPeristiwa,
      tempat,
      keterangan,
      alamatAsal,
      alamatTujuan,
      penyebabKematian,
      namaBayi,
      jenisKelaminBayi,
      beratBayi,
      panjangBayi,
      // Additional fields
      namaAyah,
      nikAyah,
      namaIbu,
      nikIbu,
      // For Pindah Masuk
      pendudukBaru,
      rtIdTujuan,
      dusunIdTujuan,
      // For Pindah Keluar
      alamatPindah,
      // For Perkawinan
      tanggalPerkawinan,
      aktaPerkawinan,
      // For Perceraian
      tanggalPerceraian,
      aktaPerceraian,
      buatKKBaru,
      alamatKKBaru,
      rtIdKKBaru,
      dusunIdKKBaru,
    } = body;

    // Validasi field wajib
    if (!jenisPeristiwa || !tanggalPeristiwa) {
      return NextResponse.json(
        { success: false, error: 'Jenis peristiwa dan tanggal wajib diisi' },
        { status: 400 }
      );
    }

    let createdPendudukId: string | null = null;
    let createdKKId: string | null = kkId || null;
    let processedData: any = {};

    // Process based on event type
    switch (jenisPeristiwa) {
      case 'KELAHIRAN': {
        // Create new penduduk for kelahiran
        if (!namaBayi) {
          return NextResponse.json(
            { success: false, error: 'Nama bayi wajib diisi untuk kelahiran' },
            { status: 400 }
          );
        }

        // Check if NIK already exists
        const nikBayi = pendudukBaru?.nik || generateNIK(tanggalPeristiwa, jenisKelaminBayi || 'LAKI_LAKI');
        const existingNIK = await db.penduduk.findUnique({ where: { nik: nikBayi } });
        if (existingNIK) {
          return NextResponse.json(
            { success: false, error: 'NIK sudah terdaftar' },
            { status: 400 }
          );
        }

        // Create new penduduk
        const newPenduduk = await db.penduduk.create({
          data: {
            nik: nikBayi,
            namaLengkap: namaBayi,
            tempatLahir: pendudukBaru?.tempatLahir || tempat || null,
            tanggalLahir: pendudukBaru?.tanggalLahir ? new Date(pendudukBaru.tanggalLahir) : new Date(tanggalPeristiwa),
            jenisKelamin: (jenisKelaminBayi || 'LAKI_LAKI') as JenisKelamin,
            agama: (pendudukBaru?.agama || 'ISLAM') as Agama,
            statusPerkawinan: 'BELUM_KAWIN' as StatusPerkawinan,
            status: 'TETAP' as StatusPenduduk,
            statusKTP: 'BELUM_BUAT' as StatusKTP,
            kewarganegaraan: 'WNI' as Kewarganegaraan,
            jenisNewabilitas: 'TIDAK_ADA' as JenisDisabilitas,
            kkId: kkId || null,
            hubunganKeluarga: 'Anak',
            urutanDalamKK: 1,
            namaAyah: namaAyah || null,
            nikAyah: nikAyah || null,
            namaIbu: namaIbu || null,
            nikIbu: nikIbu || null,
          }
        });

        createdPendudukId = newPenduduk.id;
        processedData = {
          pendudukBaru: {
            id: newPenduduk.id,
            nik: newPenduduk.nik,
            namaLengkap: newPenduduk.namaLengkap,
          }
        };
        break;
      }

      case 'KEMATIAN': {
        if (!pendudukId) {
          return NextResponse.json(
            { success: false, error: 'Penduduk wajib dipilih untuk kematian' },
            { status: 400 }
          );
        }

        // Check if penduduk exists
        const existingPenduduk = await db.penduduk.findUnique({ where: { id: pendudukId } });
        if (!existingPenduduk) {
          return NextResponse.json(
            { success: false, error: 'Penduduk tidak ditemukan' },
            { status: 404 }
          );
        }

        // Update status to MENINGGAL
        await db.penduduk.update({
          where: { id: pendudukId },
          data: {
            status: 'MENINGGAL' as StatusPenduduk,
            isActive: false,
          }
        });

        processedData = {
          pendudukDiupdate: {
            id: pendudukId,
            nik: existingPenduduk.nik,
            namaLengkap: existingPenduduk.namaLengkap,
            statusBaru: 'MENINGGAL'
          }
        };
        break;
      }

      case 'PINDAH_MASUK': {
        // Create new penduduk for pindah masuk
        if (!pendudukBaru?.namaLengkap) {
          return NextResponse.json(
            { success: false, error: 'Nama lengkap wajib diisi untuk pindah masuk' },
            { status: 400 }
          );
        }

        // Check if NIK already exists
        const nikPendatang = pendudukBaru?.nik || generateNIK(tanggalPeristiwa, pendudukBaru.jenisKelamin || 'LAKI_LAKI');
        const existingNIK = await db.penduduk.findUnique({ where: { nik: nikPendatang } });
        if (existingNIK) {
          return NextResponse.json(
            { success: false, error: 'NIK sudah terdaftar' },
            { status: 400 }
          );
        }

        // Create new penduduk with status TETAP
        const newPenduduk = await db.penduduk.create({
          data: {
            nik: nikPendatang,
            namaLengkap: pendudukBaru.namaLengkap,
            tempatLahir: pendudukBaru.tempatLahir || null,
            tanggalLahir: pendudukBaru.tanggalLahir ? new Date(pendudukBaru.tanggalLahir) : null,
            jenisKelamin: (pendudukBaru.jenisKelamin || 'LAKI_LAKI') as JenisKelamin,
            agama: (pendudukBaru.agama || 'ISLAM') as Agama,
            pekerjaan: pendudukBaru.pekerjaan || null,
            pendidikan: pendudukBaru.pendidikan || null,
            noHP: pendudukBaru.noHP || null,
            statusPerkawinan: (pendudukBaru.statusPerkawinan || 'BELUM_KAWIN') as StatusPerkawinan,
            status: 'TETAP' as StatusPenduduk,
            statusKTP: (pendudukBaru.statusKTP || 'SUDAH_BUAT') as StatusKTP,
            kewarganegaraan: 'WNI' as Kewarganegaraan,
            jenisNewabilitas: 'TIDAK_ADA' as JenisDisabilitas,
            kkId: kkId || null,
            hubunganKeluarga: pendudukBaru.hubunganKeluarga || null,
          }
        });

        createdPendudukId = newPenduduk.id;
        processedData = {
          pendudukBaru: {
            id: newPenduduk.id,
            nik: newPenduduk.nik,
            namaLengkap: newPenduduk.namaLengkap,
            status: 'TETAP'
          }
        };
        break;
      }

      case 'PINDAH_KELUAR': {
        if (!pendudukId) {
          return NextResponse.json(
            { success: false, error: 'Penduduk wajib dipilih untuk pindah keluar' },
            { status: 400 }
          );
        }

        // Check if penduduk exists
        const existingPenduduk = await db.penduduk.findUnique({ where: { id: pendudukId } });
        if (!existingPenduduk) {
          return NextResponse.json(
            { success: false, error: 'Penduduk tidak ditemukan' },
            { status: 404 }
          );
        }

        // Update status to PINDAH
        await db.penduduk.update({
          where: { id: pendudukId },
          data: {
            status: 'PINDAH' as StatusPenduduk,
            isActive: false,
          }
        });

        processedData = {
          pendudukDiupdate: {
            id: pendudukId,
            nik: existingPenduduk.nik,
            namaLengkap: existingPenduduk.namaLengkap,
            statusBaru: 'PINDAH'
          }
        };
        break;
      }

      case 'PERKAWINAN': {
        if (!pendudukId) {
          return NextResponse.json(
            { success: false, error: 'Penduduk wajib dipilih untuk perkawinan' },
            { status: 400 }
          );
        }

        // Check if penduduk exists
        const existingPenduduk = await db.penduduk.findUnique({ where: { id: pendudukId } });
        if (!existingPenduduk) {
          return NextResponse.json(
            { success: false, error: 'Penduduk tidak ditemukan' },
            { status: 404 }
          );
        }

        // Update status perkawinan
        await db.penduduk.update({
          where: { id: pendudukId },
          data: {
            statusPerkawinan: 'KAWIN' as StatusPerkawinan,
            tanggalPerkawinan: tanggalPerkawinan ? new Date(tanggalPerkawinan) : new Date(tanggalPeristiwa),
            aktaPerkawinan: aktaPerkawinan || null,
          }
        });

        processedData = {
          pendudukDiupdate: {
            id: pendudukId,
            nik: existingPenduduk.nik,
            namaLengkap: existingPenduduk.namaLengkap,
            statusPerkawinanBaru: 'KAWIN'
          }
        };
        break;
      }

      case 'PERCERAIAN': {
        if (!pendudukId) {
          return NextResponse.json(
            { success: false, error: 'Penduduk wajib dipilih untuk perceraian' },
            { status: 400 }
          );
        }

        // Check if penduduk exists
        const existingPenduduk = await db.penduduk.findUnique({ 
          where: { id: pendudukId },
          include: { kk: true }
        });
        if (!existingPenduduk) {
          return NextResponse.json(
            { success: false, error: 'Penduduk tidak ditemukan' },
            { status: 404 }
          );
        }

        // Update status perkawinan
        await db.penduduk.update({
          where: { id: pendudukId },
          data: {
            statusPerkawinan: 'CERAI_HIDUP' as StatusPerkawinan,
            tanggalPerceraian: tanggalPerceraian ? new Date(tanggalPerceraian) : new Date(tanggalPeristiwa),
            aktaPerceraian: aktaPerceraian || null,
          }
        });

        processedData = {
          pendudukDiupdate: {
            id: pendudukId,
            nik: existingPenduduk.nik,
            namaLengkap: existingPenduduk.namaLengkap,
            statusPerkawinanBaru: 'CERAI_HIDUP'
          }
        };

        // Create new KK if requested
        if (buatKKBaru && alamatKKBaru) {
          const nomorKKBaru = generateKKNumber();
          const newKK = await db.kK.create({
            data: {
              nomorKK: nomorKKBaru,
              alamat: alamatKKBaru,
              rtId: rtIdKKBaru || null,
              dusunId: dusunIdKKBaru || null,
              jenisTempatTinggal: 'MILIK_SENDIRI',
            }
          });

          // Update penduduk to be kepala keluarga of new KK
          await db.penduduk.update({
            where: { id: pendudukId },
            data: {
              kkId: newKK.id,
              hubunganKeluarga: 'Kepala Keluarga',
            }
          });

          createdKKId = newKK.id;
          processedData.kkBaru = {
            id: newKK.id,
            nomorKK: newKK.nomorKK,
          };
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Jenis peristiwa tidak valid' },
          { status: 400 }
        );
    }

    // Buat peristiwa baru
    const peristiwa = await db.peristiwaKependudukan.create({
      data: {
        jenisPeristiwa: jenisPeristiwa as JenisPeristiwa,
        pendudukId: createdPendudukId || pendudukId || null,
        kkId: createdKKId || null,
        tanggalPeristiwa: tanggalPeristiwa ? new Date(tanggalPeristiwa) : new Date(),
        tempat: tempat || null,
        keterangan: keterangan || null,
        alamatAsal: alamatAsal || alamatPindah || null,
        alamatTujuan: alamatTujuan || null,
        penyebabKematian: penyebabKematian || null,
        namaBayi: namaBayi || null,
        jenisKelaminBayi: jenisKelaminBayi as JenisKelamin || null,
        beratBayi: beratBayi || null,
        panjangBayi: panjangBayi || null,
        isProcessed: true, // Auto processed
      },
      include: {
        penduduk: {
          select: {
            id: true,
            nik: true,
            namaLengkap: true,
            jenisKelamin: true,
          }
        },
        kk: {
          select: {
            id: true,
            nomorKK: true,
          }
        }
      }
    });

    // Catat log aktivitas
    const logDescriptions: Record<string, string> = {
      KELAHIRAN: `Kelahiran: ${namaBayi} (${processedData.pendudukBaru?.nik})`,
      KEMATIAN: `Kematian: ${processedData.pendudukDiupdate?.namaLengkap} (${processedData.pendudukDiupdate?.nik})`,
      PINDAH_MASUK: `Pindah Masuk: ${processedData.pendudukBaru?.namaLengkap} (${processedData.pendudukBaru?.nik})`,
      PINDAH_KELUAR: `Pindah Keluar: ${processedData.pendudukDiupdate?.namaLengkap} (${processedData.pendudukDiupdate?.nik})`,
      PERKAWINAN: `Perkawinan: ${processedData.pendudukDiupdate?.namaLengkap}`,
      PERCERAIAN: `Perceraian: ${processedData.pendudukDiupdate?.namaLengkap}`,
    };

    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'CREATE',
        modul: 'PENDUDUK',
        deskripsi: logDescriptions[jenisPeristiwa] || `Peristiwa ${jenisPeristiwa}`,
        dataRef: JSON.stringify({
          peristiwaId: peristiwa.id,
          jenisPeristiwa,
          ...processedData
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...peristiwa,
        tanggalPeristiwa: peristiwa.tanggalPeristiwa?.toISOString() || null,
        processedData,
      },
      message: 'Peristiwa berhasil ditambahkan dan data telah diproses',
    });
  } catch (error) {
    console.error('Error creating Peristiwa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan Peristiwa' },
      { status: 500 }
    );
  }
}

// Helper function to generate NIK
function generateNIK(tanggalPeristiwa: string, jenisKelamin: string): string {
  const kodeKecamatan = '320117';
  const tanggal = new Date(tanggalPeristiwa);
  const tgl = tanggal.getDate();
  const bln = (tanggal.getMonth() + 1).toString().padStart(2, '0');
  const thn = tanggal.getFullYear().toString().slice(-2);
  
  // Female: tanggal + 40
  const tglLahir = jenisKelamin === 'PEREMPUAN' 
    ? (tgl + 40).toString().padStart(2, '0')
    : tgl.toString().padStart(2, '0');
  
  const kodeUnik = Math.floor(Math.random() * 9000) + 1000;
  
  return `${kodeKecamatan}${tglLahir}${bln}${thn}${kodeUnik}`;
}

// Helper function to generate KK number
function generateKKNumber(): string {
  const base = '320117010101';
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${base}${random}0001`;
}
