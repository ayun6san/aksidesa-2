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

// GET - List all RFID cards or filter by userId
export async function GET(request: NextRequest) {
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

    const where: any = {};
    if (userId) where.userId = userId;

    const cards = await db.rFIDCard.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: cards });
  } catch (error) {
    console.error('[RFID GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// POST - Register new RFID card
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { userId, cardUid, cardName } = await request.json();

    if (!userId || !cardUid) {
      return NextResponse.json(
        { success: false, error: 'User ID dan Card UID wajib diisi' },
        { status: 400 }
      );
    }

    // Check if card already registered
    const existingCard = await db.rFIDCard.findUnique({
      where: { cardUid },
    });

    if (existingCard) {
      return NextResponse.json(
        { success: false, error: 'Kartu RFID sudah terdaftar' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Create RFID card
    const card = await db.rFIDCard.create({
      data: {
        userId,
        cardUid,
        cardName: cardName || `Kartu ${user.namaLengkap.split(' ')[0]}`,
        isActive: true,
      },
    });

    // Enable RFID for user if not already enabled
    if (!user.rfidEnabled) {
      await db.user.update({
        where: { id: userId },
        data: { rfidEnabled: true },
      });
    }

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'CREATE',
        modul: 'RFID',
        deskripsi: `Mendaftarkan kartu RFID ${cardUid} untuk user ${user.username}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: card,
      message: 'Kartu RFID berhasil didaftarkan',
    });
  } catch (error) {
    console.error('[RFID POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mendaftarkan kartu' },
      { status: 500 }
    );
  }
}
