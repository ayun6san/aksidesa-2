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

// PUT - Update RT
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

    const existing = await db.rT.findUnique({
      where: { id },
      include: {
        rw: {
          include: { dusun: { select: { nama: true } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'RT tidak ditemukan' },
        { status: 404 }
      );
    }

    const formattedNomor = nomor?.trim().padStart(3, '0') || existing.nomor;

    const rt = await db.rT.update({
      where: { id },
      data: {
        nomor: formattedNomor,
      },
      include: {
        rw: {
          include: { dusun: { select: { id: true, nama: true } } },
        },
      },
    });

    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'UPDATE',
        modul: 'WILAYAH',
        deskripsi: `Mengupdate RT ${rt.nomor} di RW ${rt.rw.nomor} ${rt.rw.dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: rt,
      message: 'RT berhasil diupdate',
    });
  } catch (error) {
    console.error('[RT PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate' },
      { status: 500 }
    );
  }
}

// DELETE - Delete RT
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

    const rt = await db.rT.findUnique({
      where: { id },
      include: {
        rw: {
          include: { dusun: { select: { nama: true } } },
        },
      },
    });

    if (!rt) {
      return NextResponse.json(
        { success: false, error: 'RT tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.rT.delete({
      where: { id },
    });

    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'DELETE',
        modul: 'WILAYAH',
        deskripsi: `Menghapus RT ${rt.nomor} di RW ${rt.rw.nomor} ${rt.rw.dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'RT berhasil dihapus',
    });
  } catch (error) {
    console.error('[RT DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menghapus' },
      { status: 500 }
    );
  }
}
