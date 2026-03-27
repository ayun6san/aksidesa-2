// Face Registration API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface FaceRegisterRequest {
  userId: string;
  faceDescriptor: number[];
  faceImage?: string;
}

// Helper to get current session from cookie
async function getCurrentUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  
  console.log('[Face Register] Session token:', sessionToken ? 'exists' : 'not found');
  
  if (!sessionToken) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  console.log('[Face Register] Session found:', !!session, 'isActive:', session?.isActive);

  if (!session || !session.isActive || new Date() > session.expiresAt) {
    return null;
  }

  return session.user;
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    
    const body: FaceRegisterRequest = await request.json();
    const { userId, faceDescriptor, faceImage } = body;

    // Validate input
    if (!userId || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    if (faceDescriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Format data wajah tidak valid' },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Permission check - must be logged in
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    // Only allow self-registration or admin
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_DESA';
    if (currentUser.id !== userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses untuk user ini' },
        { status: 403 }
      );
    }

    // Save face data
    await db.faceData.upsert({
      where: { userId },
      create: {
        userId,
        faceEncoding: JSON.stringify(faceDescriptor),
        faceImage: faceImage || null,
        isActive: true,
      },
      update: {
        faceEncoding: JSON.stringify(faceDescriptor),
        faceImage: faceImage || null,
        isActive: true,
      },
    });

    // Update user
    await db.user.update({
      where: { id: userId },
      data: { faceRecognitionEnabled: true },
    });

    // Log
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'UPDATE',
        modul: 'FACE_RECOGNITION',
        deskripsi: `Mendaftarkan data wajah: ${user.namaLengkap}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data wajah berhasil disimpan',
    });
  } catch (error) {
    console.error('Face register error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    await db.faceData.deleteMany({ where: { userId } });
    await db.user.update({
      where: { id: userId },
      data: { faceRecognitionEnabled: false },
    });

    // Log
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'DELETE',
        modul: 'FACE_RECOGNITION',
        deskripsi: `Menghapus data wajah`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data wajah berhasil dihapus',
    });
  } catch (error) {
    console.error('Face delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
