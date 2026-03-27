import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to get current user from cookie
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

// PUT - Update Dusun/RW/RT
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
    const body = await request.json();
    const { level, data } = body;

    if (level === 'dusun') {
      const dusun = await db.dusun.update({
        where: { id },
        data: {
          nama: data.nama,
          kode: data.kode || null,
          jumlahKK: data.jumlahKK || 0,
          jumlahPenduduk: data.jumlahPenduduk || 0,
        },
      });

      await db.logAktivitas.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.username,
          aksi: 'UPDATE',
          modul: 'WILAYAH',
          deskripsi: `Update dusun: ${dusun.nama}`,
        },
      });

      return NextResponse.json({ success: true, data: dusun });
    }

    if (level === 'rw') {
      const rw = await db.rW.update({
        where: { id },
        data: {
          nomor: data.nomor,
          jumlahKK: data.jumlahKK || 0,
          jumlahPenduduk: data.jumlahPenduduk || 0,
        },
      });

      await db.logAktivitas.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.username,
          aksi: 'UPDATE',
          modul: 'WILAYAH',
          deskripsi: `Update RW ${rw.nomor}`,
        },
      });

      return NextResponse.json({ success: true, data: rw });
    }

    if (level === 'rt') {
      const rt = await db.rT.update({
        where: { id },
        data: {
          nomor: data.nomor,
          jumlahKK: data.jumlahKK || 0,
          jumlahPenduduk: data.jumlahPenduduk || 0,
        },
      });

      await db.logAktivitas.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.username,
          aksi: 'UPDATE',
          modul: 'WILAYAH',
          deskripsi: `Update RT ${rt.nomor}`,
        },
      });

      return NextResponse.json({ success: true, data: rt });
    }

    return NextResponse.json(
      { success: false, error: 'Level tidak valid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Wilayah PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Dusun/RW/RT
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
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (level === 'dusun') {
      // Check if dusun has RW
      const rwCount = await db.rW.count({ where: { dusunId: id } });
      if (rwCount > 0) {
        return NextResponse.json(
          { success: false, error: `Tidak dapat menghapus dusun yang masih memiliki ${rwCount} RW` },
          { status: 400 }
        );
      }

      const dusun = await db.dusun.delete({ where: { id } });

      await db.logAktivitas.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.username,
          aksi: 'DELETE',
          modul: 'WILAYAH',
          deskripsi: `Hapus dusun: ${dusun.nama}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Dusun berhasil dihapus' });
    }

    if (level === 'rw') {
      // Check if RW has RT
      const rtCount = await db.rT.count({ where: { rwId: id } });
      if (rtCount > 0) {
        return NextResponse.json(
          { success: false, error: `Tidak dapat menghapus RW yang masih memiliki ${rtCount} RT` },
          { status: 400 }
        );
      }

      const rw = await db.rW.delete({ where: { id } });

      await db.logAktivitas.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.username,
          aksi: 'DELETE',
          modul: 'WILAYAH',
          deskripsi: `Hapus RW ${rw.nomor}`,
        },
      });

      return NextResponse.json({ success: true, message: 'RW berhasil dihapus' });
    }

    if (level === 'rt') {
      const rt = await db.rT.delete({ where: { id } });

      await db.logAktivitas.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.username,
          aksi: 'DELETE',
          modul: 'WILAYAH',
          deskripsi: `Hapus RT ${rt.nomor}`,
        },
      });

      return NextResponse.json({ success: true, message: 'RT berhasil dihapus' });
    }

    return NextResponse.json(
      { success: false, error: 'Level tidak valid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Wilayah DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
