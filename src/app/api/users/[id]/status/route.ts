import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserStatus } from '@prisma/client';

// PATCH - Toggle user status (active/inactive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Cek user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah user adalah Super Admin
    if (existingUser.isFirstChild && status === 'INACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Super Admin tidak dapat dinonaktifkan' },
        { status: 400 }
      );
    }

    // Toggle status jika tidak ada status yang diberikan
    const newStatus = status || (existingUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    // Update status user
    const user = await db.user.update({
      where: { id },
      data: {
        status: newStatus as UserStatus,
      },
      select: {
        id: true,
        namaLengkap: true,
        username: true,
        status: true,
      },
    });

    // Jika dinonaktifkan, hapus semua session aktif
    if (newStatus === 'INACTIVE') {
      await db.session.updateMany({
        where: {
          userId: id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userId: id,
        userName: existingUser.username,
        aksi: newStatus === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE',
        modul: 'USER',
        deskripsi: `${newStatus === 'ACTIVE' ? 'Mengaktifkan' : 'Menonaktifkan'} user: ${user.namaLengkap}`,
        dataRef: JSON.stringify({ userId: id, newStatus }),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: `User berhasil ${newStatus === 'ACTIVE' ? 'diaktifkan' : 'dinonaktifkan'}`,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengubah status user' },
      { status: 500 }
    );
  }
}
