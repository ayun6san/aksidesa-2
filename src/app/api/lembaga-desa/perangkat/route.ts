import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all Perangkat Desa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    const perangkat = await db.perangkatDesa.findMany({
      where,
      orderBy: [
        { urutan: 'asc' },
        { jabatan: 'asc' },
        { namaLengkap: 'asc' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: perangkat
    });
  } catch (error) {
    console.error('Error fetching Perangkat Desa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data Perangkat Desa' },
      { status: 500 }
    );
  }
}

// POST - Create new Perangkat Desa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get max urutan
    const maxUrutan = await db.perangkatDesa.aggregate({
      _max: { urutan: true }
    });
    const nextUrutan = (maxUrutan._max.urutan || 0) + 1;
    
    const perangkat = await db.perangkatDesa.create({
      data: {
        nip: body.nip || null,
        nipd: body.nipd || null,
        namaLengkap: body.namaLengkap,
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        jenisKelamin: body.jenisKelamin,
        agama: body.agama || 'ISLAM',
        pendidikanTerakhir: body.pendidikanTerakhir || null,
        jabatan: body.jabatan,
        jabatanLainnya: body.jabatanLainnya || null,
        masaJabatanMulai: body.masaJabatanMulai ? new Date(body.masaJabatanMulai) : null,
        masaJabatanSelesai: body.masaJabatanSelesai ? new Date(body.masaJabatanSelesai) : null,
        skPengangkatan: body.skPengangkatan || null,
        tanggalSk: body.tanggalSk ? new Date(body.tanggalSk) : null,
        alamat: body.alamat || null,
        noHp: body.noHp || null,
        email: body.email || null,
        foto: body.foto || null,
        urutan: nextUrutan,
        isActive: body.isActive ?? true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: perangkat,
      message: 'Data Perangkat Desa berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating Perangkat Desa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan data Perangkat Desa' },
      { status: 500 }
    );
  }
}
