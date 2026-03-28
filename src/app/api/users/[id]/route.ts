import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { UserStatus, UserRole } from '@prisma/client';

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        namaLengkap: true,
        username: true,
        email: true,
        noHp: true,
        role: true,
        status: true,
        isFirstChild: true,
        faceRecognitionEnabled: true,
        rfidEnabled: true,
        lastLoginAt: true,
        lastDeviceInfo: true,
        createdAt: true,
        updatedAt: true,
        sessions: {
          where: { isActive: true },
          select: {
            id: true,
            deviceInfo: true,
            lastActivityAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      namaLengkap,
      email,
      noHp,
      role,
      status,
      faceRecognitionEnabled,
      rfidEnabled,
      password,
    } = body;

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
    if (existingUser.isFirstChild && role && role !== existingUser.role) {
      return NextResponse.json(
        { success: false, error: 'Role Super Admin tidak dapat diubah' },
        { status: 400 }
      );
    }

    // Cek email duplikat
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (namaLengkap) updateData.namaLengkap = namaLengkap;
    if (email) updateData.email = email;
    if (noHp !== undefined) updateData.noHp = noHp || null;
    if (role && !existingUser.isFirstChild) updateData.role = role as UserRole;
    if (status && !existingUser.isFirstChild) updateData.status = status as UserStatus;
    if (faceRecognitionEnabled !== undefined) updateData.faceRecognitionEnabled = faceRecognitionEnabled;
    if (rfidEnabled !== undefined) updateData.rfidEnabled = rfidEnabled;
    
    // Hash password baru jika ada
    if (password && password.length >= 6) {
      updateData.password = await hash(password, 10);
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        namaLengkap: true,
        username: true,
        email: true,
        noHp: true,
        role: true,
        status: true,
        faceRecognitionEnabled: true,
        rfidEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'UPDATE',
        modul: 'USER',
        deskripsi: `Mengupdate user: ${user.namaLengkap} (${user.username})`,
        dataRef: JSON.stringify({ userId: user.id, changes: Object.keys(updateData) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    if (existingUser.isFirstChild) {
      return NextResponse.json(
        { success: false, error: 'Super Admin tidak dapat dihapus' },
        { status: 400 }
      );
    }

    // Hapus user
    await db.user.delete({
      where: { id },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'DELETE',
        modul: 'USER',
        deskripsi: `Menghapus user: ${existingUser.namaLengkap} (${existingUser.username})`,
        dataRef: JSON.stringify({ deletedUser: { id, username: existingUser.username } }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus user' },
      { status: 500 }
    );
  }
}
