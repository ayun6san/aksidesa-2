import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all BPD members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    const bpd = await db.bPD.findMany({
      where,
      orderBy: [
        { urutan: 'asc' },
        { jabatan: 'asc' },
        { namaLengkap: 'asc' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      data: bpd
    });
  } catch (error) {
    console.error('Error fetching BPD:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data BPD' },
      { status: 500 }
    );
  }
}

// POST - Create new BPD member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get max urutan
    const maxUrutan = await db.bPD.aggregate({
      _max: { urutan: true }
    });
    const nextUrutan = (maxUrutan._max.urutan || 0) + 1;
    
    const bpd = await db.bPD.create({
      data: {
        namaLengkap: body.namaLengkap,
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        jenisKelamin: body.jenisKelamin,
        agama: body.agama || 'ISLAM',
        pendidikanTerakhir: body.pendidikanTerakhir || null,
        pekerjaan: body.pekerjaan || null,
        jabatan: body.jabatan,
        periodeMulai: body.periodeMulai ? new Date(body.periodeMulai) : null,
        periodeSelesai: body.periodeSelesai ? new Date(body.periodeSelesai) : null,
        skPengangkatan: body.skPengangkatan || null,
        tanggalSk: body.tanggalSk ? new Date(body.tanggalSk) : null,
        alamat: body.alamat || null,
        rt: body.rt || null,
        rw: body.rw || null,
        dusun: body.dusun || null,
        noHp: body.noHp || null,
        email: body.email || null,
        foto: body.foto || null,
        urutan: nextUrutan,
        isActive: body.isActive ?? true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: bpd,
      message: 'Data BPD berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating BPD:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan data BPD' },
      { status: 500 }
    );
  }
}
