import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch single Perangkat Desa by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const perangkat = await db.perangkatDesa.findUnique({
      where: { id }
    });
    
    if (!perangkat) {
      return NextResponse.json(
        { success: false, error: 'Data Perangkat Desa tidak ditemukan' },
        { status: 404 }
      );
    }
    
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

// PUT - Update Perangkat Desa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const perangkat = await db.perangkatDesa.update({
      where: { id },
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
        isActive: body.isActive ?? true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: perangkat,
      message: 'Data Perangkat Desa berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating Perangkat Desa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui data Perangkat Desa' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Perangkat Desa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.perangkatDesa.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Data Perangkat Desa berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting Perangkat Desa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus data Perangkat Desa' },
      { status: 500 }
    );
  }
}
