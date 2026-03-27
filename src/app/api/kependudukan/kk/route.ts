import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisTempatTinggal } from '@prisma/client';

// GET - List all KK with pagination, search, and filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const dusunId = searchParams.get('dusunId') || '';
    const rtId = searchParams.get('rtId') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nomorKK: { contains: search } },
        { 
          anggota: {
            some: {
              hubunganKeluarga: 'Kepala Keluarga',
              namaLengkap: { contains: search }
            }
          }
        }
      ];
    }

    // Filter by Dusun
    if (dusunId) {
      where.dusunId = dusunId;
    }

    // Filter by RT
    if (rtId) {
      where.rtId = rtId;
    }

    // Filter by status
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get KK with anggota count
    const [kkList, total] = await Promise.all([
      db.kK.findMany({
        where,
        include: {
          anggota: {
            where: { hubunganKeluarga: 'Kepala Keluarga' },
            select: {
              id: true,
              namaLengkap: true,
            }
          },
          rt: {
            include: {
              rw: {
                include: {
                  dusun: true
                }
              }
            }
          },
          dusun: true,
          _count: {
            select: { anggota: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.kK.count({ where }),
    ]);

    // Transform data
    const transformedData = kkList.map(kk => ({
      id: kk.id,
      nomorKK: kk.nomorKK,
      kepalaKeluarga: kk.anggota[0]?.namaLengkap || '-',
      alamat: kk.alamat,
      rt: kk.rt?.nomor || '-',
      rw: kk.rt?.rw?.nomor || '-',
      dusun: kk.dusun?.nama || kk.rt?.rw?.dusun?.nama || '-',
      rtId: kk.rtId,
      dusunId: kk.dusunId,
      tanggalTerbit: kk.tanggalTerbit,
      jenisTempatTinggal: kk.jenisTempatTinggal,
      latitude: kk.latitude,
      longitude: kk.longitude,
      scanKK: kk.scanKK,
      fotoRumah: kk.fotoRumah,
      jumlahAnggota: kk._count.anggota,
      isActive: kk.isActive,
      createdAt: kk.createdAt,
    }));

    // Get statistics
    const [totalKK, totalAnggota, kkAktif, kkNonaktif] = await Promise.all([
      db.kK.count(),
      db.penduduk.count({ where: { kkId: { not: null } } }),
      db.kK.count({ where: { isActive: true } }),
      db.kK.count({ where: { isActive: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics: {
        totalKK,
        totalAnggota,
        kkAktif,
        kkNonaktif,
        rataRataAnggota: totalKK > 0 ? (totalAnggota / totalKK).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching KK:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data KK' },
      { status: 500 }
    );
  }
}

// POST - Create new KK
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nomorKK, 
      tanggalTerbit,
      jenisTempatTinggal,
      alamat, 
      rtId, 
      dusunId,
      latitude,
      longitude,
      scanKK,
      fotoRumah
    } = body;

    // Validasi field wajib
    if (!nomorKK) {
      return NextResponse.json(
        { success: false, error: 'Nomor KK wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi format nomor KK (16 digit)
    if (!/^\d{16}$/.test(nomorKK)) {
      return NextResponse.json(
        { success: false, error: 'Nomor KK harus 16 digit angka' },
        { status: 400 }
      );
    }

    // Cek nomor KK sudah ada
    const existingKK = await db.kK.findUnique({
      where: { nomorKK },
    });

    if (existingKK) {
      return NextResponse.json(
        { success: false, error: 'Nomor KK sudah terdaftar' },
        { status: 400 }
      );
    }

    // Validasi jenis tempat tinggal
    const jenisTT = jenisTempatTinggal || 'MILIK_SENDIRI';
    if (!Object.values(JenisTempatTinggal).includes(jenisTT as JenisTempatTinggal)) {
      return NextResponse.json(
        { success: false, error: 'Jenis tempat tinggal tidak valid' },
        { status: 400 }
      );
    }

    // Buat KK baru
    const kk = await db.kK.create({
      data: {
        nomorKK,
        tanggalTerbit: tanggalTerbit ? new Date(tanggalTerbit) : null,
        jenisTempatTinggal: jenisTT as JenisTempatTinggal,
        alamat: alamat || '',
        rtId: rtId || null,
        dusunId: dusunId || null,
        latitude: latitude || null,
        longitude: longitude || null,
        scanKK: scanKK || null,
        fotoRumah: fotoRumah || null,
      },
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
        dusun: true,
      }
    });

    // Catat log aktivitas dengan detail
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'CREATE',
        modul: 'KK',
        deskripsi: `Menambahkan KK baru: ${nomorKK}`,
        dataRef: JSON.stringify({ 
          kkId: kk.id, 
          nomorKK,
          alamat,
          rtId,
          dusunId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: kk,
      message: 'KK berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating KK:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan KK' },
      { status: 500 }
    );
  }
}
