import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
            email: true,
            role: true,
            status: true,
            desaId: true,
          },
        },
      },
    });

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      // Clean up expired session
      if (session) {
        await db.session.update({
          where: { id: session.id },
          data: { isActive: false },
        });
      }
      return NextResponse.json({ authenticated: false });
    }

    // Update last activity
    await db.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      session: {
        id: session.id,
        deviceInfo: session.deviceInfo,
        lastActivityAt: session.lastActivityAt,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
