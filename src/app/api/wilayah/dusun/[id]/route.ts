import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getCurrentUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;

  const session = await db.session.findUnique({
    where: { token: sessionToken, isActive: true },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// PUT - Update Dusun
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { nama, kode } = await request.json();

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama dusun wajib diisi' },
        { status: 400 }
      );
    }

    // Check if name already exists (except this dusun)
    const existing = await db.dusun.findFirst({
      where: {
        nama: nama.trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Nama dusun sudah ada' },
        { status: 400 }
      );
    }

    const dusun = await db.dusun.update({
      where: { id },
      data: {
        nama: nama.trim(),
        kode: kode?.trim() || null,
      },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'UPDATE',
        modul: 'WILAYAH',
        deskripsi: `Mengupdate dusun: ${dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: dusun,
      message: 'Dusun berhasil diupdate',
    });
  } catch (error) {
    console.error('[Dusun PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Dusun
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if dusun has RW
    const rwCount = await db.rW.count({
      where: { dusunId: id },
    });

    if (rwCount > 0) {
      return NextResponse.json(
        { success: false, error: `Tidak dapat menghapus dusun yang memiliki ${rwCount} RW` },
        { status: 400 }
      );
    }

    const dusun = await db.dusun.findUnique({
      where: { id },
    });

    if (!dusun) {
      return NextResponse.json(
        { success: false, error: 'Dusun tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.dusun.delete({
      where: { id },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'DELETE',
        modul: 'WILAYAH',
        deskripsi: `Menghapus dusun: ${dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Dusun berhasil dihapus',
    });
  } catch (error) {
    console.error('[Dusun DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menghapus' },
      { status: 500 }
    );
  }
}
