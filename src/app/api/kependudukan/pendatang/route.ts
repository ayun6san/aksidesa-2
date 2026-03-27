import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisKelamin } from '@prisma/client';

// GET - List all Pendatang with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nik: { contains: search } },
        { namaLengkap: { contains: search } },
        { alamatAsal: { contains: search } },
      ];
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get pendatang
    const [pendatangList, total] = await Promise.all([
      db.pendatang.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.pendatang.count({ where }),
    ]);

    // Transform data
    const transformedData = pendatangList.map(p => ({
      id: p.id,
      nik: p.nik,
      namaLengkap: p.namaLengkap,
      tempatLahir: p.tempatLahir,
      tanggalLahir: p.tanggalLahir?.toISOString() || null,
      jenisKelamin: p.jenisKelamin,
      pekerjaan: p.pekerjaan,
      alamatAsal: p.alamatAsal,
      tujuanKedatangan: p.tujuanKedatangan,
      noTelp: p.noTelp,
      alamat: p.alamat,
      rt: p.rt?.nomor || '-',
      rw: p.rt?.rw?.nomor || '-',
      dusun: p.dusun?.nama || p.rt?.rw?.dusun?.nama || '-',
      rtId: p.rtId,
      dusunId: p.dusunId,
      tanggalDatang: p.tanggalDatang?.toISOString() || null,
      tanggalPulang: p.tanggalPulang?.toISOString() || null,
      lamaTinggal: p.lamaTinggal,
      isActive: p.isActive,
      keterangan: p.keterangan,
      foto: p.foto,
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
    console.error('Error fetching Pendatang:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data Pendatang' },
      { status: 500 }
    );
  }
}

// POST - Create new Pendatang
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nik,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      pekerjaan,
      alamatAsal,
      tujuanKedatangan,
      noTelp,
      alamat,
      rtId,
      dusunId,
      tanggalDatang,
      tanggalPulang,
      lamaTinggal,
      keterangan,
      foto,
    } = body;

    // Validasi field wajib
    if (!namaLengkap || !alamatAsal || !tujuanKedatangan || !jenisKelamin) {
      return NextResponse.json(
        { success: false, error: 'Nama, alamat asal, tujuan kedatangan, dan jenis kelamin wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi format NIK jika diisi
    if (nik && !/^\d{16}$/.test(nik)) {
      return NextResponse.json(
        { success: false, error: 'NIK harus 16 digit angka' },
        { status: 400 }
      );
    }

    // Buat pendatang baru
    const pendatang = await db.pendatang.create({
      data: {
        nik: nik || null,
        namaLengkap,
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        jenisKelamin: jenisKelamin as JenisKelamin,
        pekerjaan: pekerjaan || null,
        alamatAsal,
        tujuanKedatangan,
        noTelp: noTelp || null,
        alamat: alamat || null,
        rtId: rtId || null,
        dusunId: dusunId || null,
        tanggalDatang: tanggalDatang ? new Date(tanggalDatang) : new Date(),
        tanggalPulang: tanggalPulang ? new Date(tanggalPulang) : null,
        lamaTinggal: lamaTinggal || null,
        keterangan: keterangan || null,
        foto: foto || null,
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

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'CREATE',
        modul: 'KEPENDUDUKAN',
        deskripsi: `Menambahkan pendatang baru: ${namaLengkap}`,
        dataRef: JSON.stringify({ pendatangId: pendatang.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...pendatang,
        tanggalLahir: pendatang.tanggalLahir?.toISOString() || null,
        tanggalDatang: pendatang.tanggalDatang?.toISOString() || null,
        tanggalPulang: pendatang.tanggalPulang?.toISOString() || null,
      },
      message: 'Pendatang berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating Pendatang:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan Pendatang' },
      { status: 500 }
    );
  }
}
