import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch single BPD member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const bpd = await db.bPD.findUnique({
      where: { id }
    });
    
    if (!bpd) {
      return NextResponse.json(
        { success: false, error: 'Data BPD tidak ditemukan' },
        { status: 404 }
      );
    }
    
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

// PUT - Update BPD member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const bpd = await db.bPD.update({
      where: { id },
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
        isActive: body.isActive ?? true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: bpd,
      message: 'Data BPD berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating BPD:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui data BPD' },
      { status: 500 }
    );
  }
}

// DELETE - Delete BPD member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.bPD.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Data BPD berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting BPD:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus data BPD' },
      { status: 500 }
    );
  }
}
