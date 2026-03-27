import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { cardUid } = await request.json();

    if (!cardUid) {
      return NextResponse.json(
        { success: false, error: 'Card UID wajib diisi' },
        { status: 400 }
      );
    }

    // Find RFID card with user data
    const rfidCard = await db.rFIDCard.findUnique({
      where: { 
        cardUid: cardUid.toUpperCase(),
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!rfidCard) {
      return NextResponse.json(
        { success: false, error: 'Kartu RFID tidak terdaftar atau tidak aktif' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (rfidCard.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User tidak aktif. Hubungi administrator.' },
        { status: 401 }
      );
    }

    // Create session
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Invalidate old sessions
    await db.session.updateMany({
      where: { userId: rfidCard.userId, isActive: true },
      data: { isActive: false },
    });

    // Create new session
    await db.session.create({
      data: {
        userId: rfidCard.userId,
        token,
        deviceInfo: 'RFID Reader',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        isActive: true,
        expiresAt,
      },
    });

    // Update last used time for RFID card
    await db.rFIDCard.update({
      where: { id: rfidCard.id },
      data: { lastUsedAt: new Date() },
    });

    // Update last login for user
    await db.user.update({
      where: { id: rfidCard.userId },
      data: { lastLoginAt: new Date() },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: rfidCard.userId,
        userName: rfidCard.user.username,
        aksi: 'LOGIN',
        modul: 'AUTH',
        deskripsi: `Login via RFID Card ${rfidCard.cardUid}`,
      },
    });

    console.log(`[RFID Login] Success: ${rfidCard.user.username} via card ${rfidCard.cardUid}`);

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: rfidCard.user,
      token,
      cardName: rfidCard.cardName,
    });

    // Set session cookie
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[RFID Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat verifikasi kartu' },
      { status: 500 }
    );
  }
}
