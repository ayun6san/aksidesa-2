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

// PUT - Update RW
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
    const { nomor } = await request.json();

    const existing = await db.rW.findUnique({
      where: { id },
      include: { dusun: { select: { nama: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'RW tidak ditemukan' },
        { status: 404 }
      );
    }

    const formattedNomor = nomor?.trim().padStart(3, '0') || existing.nomor;

    const rw = await db.rW.update({
      where: { id },
      data: {
        nomor: formattedNomor,
      },
      include: { dusun: { select: { id: true, nama: true } } },
    });

    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'UPDATE',
        modul: 'WILAYAH',
        deskripsi: `Mengupdate RW ${rw.nomor} di ${rw.dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: rw,
      message: 'RW berhasil diupdate',
    });
  } catch (error) {
    console.error('[RW PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate' },
      { status: 500 }
    );
  }
}

// DELETE - Delete RW
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

    const rw = await db.rW.findUnique({
      where: { id },
      include: { dusun: { select: { nama: true } } },
    });

    if (!rw) {
      return NextResponse.json(
        { success: false, error: 'RW tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if RW has RT
    const rtCount = await db.rT.count({
      where: { rwId: id },
    });

    if (rtCount > 0) {
      return NextResponse.json(
        { success: false, error: `Tidak dapat menghapus RW yang memiliki ${rtCount} RT` },
        { status: 400 }
      );
    }

    await db.rW.delete({
      where: { id },
    });

    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'DELETE',
        modul: 'WILAYAH',
        deskripsi: `Menghapus RW ${rw.nomor} di ${rw.dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'RW berhasil dihapus',
    });
  } catch (error) {
    console.error('[RW DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menghapus' },
      { status: 500 }
    );
  }
}
