import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisKelamin, Agama, StatusPerkawinan, StatusPenduduk, StatusKTP, JenisDisabilitas, Kewarganegaraan } from '@prisma/client';

// GET - List all Penduduk with pagination and search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const dusunId = searchParams.get('dusunId') || '';
    const rtId = searchParams.get('rtId') || '';
    const status = searchParams.get('status') || '';
    const jenisKelamin = searchParams.get('jenisKelamin') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nik: { contains: search } },
        { namaLengkap: { contains: search } },
      ];
    }
    
    // Filter by dusunId through KK relation
    if (dusunId) {
      where.kk = { dusunId };
    }
    
    // Filter by rtId through KK relation
    if (rtId) {
      where.kk = { ...where.kk, rtId };
    }
    
    if (status) {
      where.status = status as StatusPenduduk;
    }
    
    if (jenisKelamin) {
      where.jenisKelamin = jenisKelamin as JenisKelamin;
    }

    // Get penduduk
    const [pendudukList, total] = await Promise.all([
      db.penduduk.findMany({
        where,
        include: {
          kk: {
            include: {
              rt: {
                include: {
                  rw: {
                    include: {
                      dusun: true
                    }
                  }
                }
              },
              dusun: true
            }
          }
        },
        orderBy: [
          { namaLengkap: 'asc' }
        ],
        skip,
        take: limit,
      }),
      db.penduduk.count({ where }),
    ]);

    // Transform data - get alamat/wilayah from KK
    const transformedData = pendudukList.map(p => ({
      id: p.id,
      nik: p.nik,
      namaLengkap: p.namaLengkap,
      tempatLahir: p.tempatLahir,
      tanggalLahir: p.tanggalLahir?.toISOString() || null,
      jenisKelamin: p.jenisKelamin,
      golonganDarah: p.golonganDarah,
      agama: p.agama,
      suku: p.suku,
      statusPerkawinan: p.statusPerkawinan,
      aktaPerkawinan: p.aktaPerkawinan,
      tanggalPerkawinan: p.tanggalPerkawinan?.toISOString() || null,
      aktaPerceraian: p.aktaPerceraian,
      tanggalPerceraian: p.tanggalPerceraian?.toISOString() || null,
      pekerjaan: p.pekerjaan,
      pendidikan: p.pendidikan,
      penghasilan: p.penghasilan,
      kewarganegaraan: p.kewarganegaraan,
      negaraAsal: p.negaraAsal,
      noPaspor: p.noPaspor,
      noKitasKitap: p.noKitasKitap,
      tanggalMasuk: p.tanggalMasuk?.toISOString() || null,
      noAktaKelahiran: p.noAktaKelahiran,
      statusKTP: p.statusKTP,
      noBPJSKesehatan: p.noBPJSKesehatan,
      noBPJSTenagakerja: p.noBPJSTenagakerja,
      npwp: p.npwp,
      namaAyah: p.namaAyah,
      nikAyah: p.nikAyah,
      namaIbu: p.namaIbu,
      nikIbu: p.nikIbu,
      anakKe: p.anakKe,
      jumlahSaudara: p.jumlahSaudara,
      // Alamat dan wilayah dari KK
      alamat: p.kk?.alamat || '-',
      rt: p.kk?.rt?.nomor || '-',
      rw: p.kk?.rt?.rw?.nomor || '-',
      dusun: p.kk?.dusun?.nama || p.kk?.rt?.rw?.dusun?.nama || '-',
      kkId: p.kkId,
      nomorKK: p.kk?.nomorKK || '-',
      hubunganKeluarga: p.hubunganKeluarga,
      urutanDalamKK: p.urutanDalamKK,
      email: p.email,
      noHP: p.noHP,
      jenisNewabilitas: p.jenisNewabilitas,
      keteranganDisabilitas: p.keteranganDisabilitas,
      penyakitKronis: p.penyakitKronis,
      status: p.status,
      isActive: p.isActive,
      foto: p.foto,
      fotoKTP: p.fotoKTP,
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
    console.error('Error fetching Penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data Penduduk' },
      { status: 500 }
    );
  }
}

// POST - Create new Penduduk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi field wajib
    if (!body.nik || !body.namaLengkap || !body.jenisKelamin) {
      return NextResponse.json(
        { success: false, error: 'NIK, nama lengkap, dan jenis kelamin wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi format NIK (16 digit)
    if (!/^\d{16}$/.test(body.nik)) {
      return NextResponse.json(
        { success: false, error: 'NIK harus 16 digit angka' },
        { status: 400 }
      );
    }

    // Cek NIK sudah ada
    const existingPenduduk = await db.penduduk.findUnique({
      where: { nik: body.nik },
    });

    if (existingPenduduk) {
      return NextResponse.json(
        { success: false, error: 'NIK sudah terdaftar' },
        { status: 400 }
      );
    }

    // Buat penduduk baru
    const penduduk = await db.penduduk.create({
      data: {
        nik: body.nik,
        namaLengkap: body.namaLengkap,
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        jenisKelamin: body.jenisKelamin as JenisKelamin,
        golonganDarah: body.golonganDarah || null,
        agama: (body.agama || 'ISLAM') as Agama,
        suku: body.suku || null,
        statusPerkawinan: (body.statusPerkawinan || 'BELUM_KAWIN') as StatusPerkawinan,
        aktaPerkawinan: body.aktaPerkawinan || null,
        tanggalPerkawinan: body.tanggalPerkawinan ? new Date(body.tanggalPerkawinan) : null,
        aktaPerceraian: body.aktaPerceraian || null,
        tanggalPerceraian: body.tanggalPerceraian ? new Date(body.tanggalPerceraian) : null,
        pekerjaan: body.pekerjaan || null,
        pendidikan: body.pendidikan || null,
        penghasilan: body.penghasilan || null,
        kewarganegaraan: (body.kewarganegaraan || 'WNI') as Kewarganegaraan,
        negaraAsal: body.negaraAsal || null,
        noPaspor: body.noPaspor || null,
        noKitasKitap: body.noKitasKitap || null,
        tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : null,
        noAktaKelahiran: body.noAktaKelahiran || null,
        statusKTP: (body.statusKTP || 'BELUM_BUAT') as StatusKTP,
        noBPJSKesehatan: body.noBPJSKesehatan || null,
        noBPJSTenagakerja: body.noBPJSTenagakerja || null,
        npwp: body.npwp || null,
        namaAyah: body.namaAyah || null,
        nikAyah: body.nikAyah || null,
        namaIbu: body.namaIbu || null,
        nikIbu: body.nikIbu || null,
        anakKe: body.anakKe ? parseInt(body.anakKe) : null,
        jumlahSaudara: body.jumlahSaudara ? parseInt(body.jumlahSaudara) : null,
        // alamat, rtId, dusunId dihapus - menggunakan dari KK
        kkId: body.kkId || null,
        hubunganKeluarga: body.hubunganKeluarga || null,
        urutanDalamKK: body.urutanDalamKK || 1,
        email: body.email || null,
        noHP: body.noHP || null,
        jenisNewabilitas: (body.jenisNewabilitas || 'TIDAK_ADA') as JenisDisabilitas,
        keteranganDisabilitas: body.keteranganDisabilitas || null,
        penyakitKronis: body.penyakitKronis || null,
        status: (body.status || 'TETAP') as StatusPenduduk,
        foto: body.foto || null,
        fotoKTP: body.fotoKTP || null,
      },
      include: {
        kk: {
          include: {
            rt: {
              include: {
                rw: {
                  include: {
                    dusun: true
                  }
                }
              }
            },
            dusun: true
          }
        }
      }
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'CREATE',
        modul: 'KEPENDUDUKAN',
        deskripsi: `Menambahkan penduduk baru: ${body.namaLengkap} (${body.nik})`,
        dataRef: JSON.stringify({ pendudukId: penduduk.id, nik: body.nik }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...penduduk,
        tanggalLahir: penduduk.tanggalLahir?.toISOString() || null,
        tanggalPerkawinan: penduduk.tanggalPerkawinan?.toISOString() || null,
        tanggalPerceraian: penduduk.tanggalPerceraian?.toISOString() || null,
        tanggalMasuk: penduduk.tanggalMasuk?.toISOString() || null,
      },
      message: 'Penduduk berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating Penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan Penduduk' },
      { status: 500 }
    );
  }
}
