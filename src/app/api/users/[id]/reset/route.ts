import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Reset user (force logout)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Cek user exists
    const existingUser = await db.user.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { isActive: true },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus semua session aktif user
    const deletedSessions = await db.session.updateMany({
      where: {
        userId: id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userId: id,
        userName: existingUser.username,
        aksi: 'RESET',
        modul: 'USER',
        deskripsi: `Reset user: ${existingUser.namaLengkap} - ${deletedSessions.count} session dihapus`,
        dataRef: JSON.stringify({ userId: id, sessionsDeleted: deletedSessions.count }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `User berhasil direset. ${deletedSessions.count} session dihapus.`,
      data: {
        sessionsDeleted: deletedSessions.count,
      },
    });
  } catch (error) {
    console.error('Error resetting user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mereset user' },
      { status: 500 }
    );
  }
}
