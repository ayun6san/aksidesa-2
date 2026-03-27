import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  generateSessionToken,
  getClientIp,
  getUserAgent,
  isAccountLocked,
  calculateLockoutTime,
} from '@/lib/auth-utils';

// Helper to get device info
function getDeviceInfo(userAgent: string): string {
  if (userAgent.includes('Mobile')) {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Mobile';
    return 'Mobile Device';
  }
  if (userAgent.includes('Windows')) return 'Windows Desktop';
  if (userAgent.includes('Macintosh')) return 'Mac Desktop';
  if (userAgent.includes('Linux')) return 'Linux Desktop';
  return 'Unknown Device';
}

interface LoginRequest {
  identifier: string; // username or email
  password: string;
  rememberMe?: boolean;
}

// Session expiry times
const SESSION_EXPIRY_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_EXPIRY_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    if (!body.identifier?.trim() || !body.password?.trim()) {
      return NextResponse.json(
        { error: 'Username/Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const identifier = body.identifier.trim().toLowerCase();
    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Find user by username or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
      include: {
        sessions: {
          where: { isActive: true },
          orderBy: { lastActivityAt: 'desc' },
          take: 1,
        },
      },
    });

    // Log login attempt
    const logAttempt = async (success: boolean, reason?: string) => {
      await db.loginAttempt.create({
        data: {
          userId: user?.id || null,
          identifier,
          ipAddress: clientIp,
          userAgent,
          attemptType: 'PASSWORD',
          success,
          failureReason: reason,
        },
      });
    };

    // User not found
    if (!user) {
      await logAttempt(false, 'User not found');
      return NextResponse.json(
        { error: 'Username/Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(user.lockedUntil)) {
      await logAttempt(false, 'Account locked');
      return NextResponse.json(
        { 
          error: 'Akun terkunci. Silakan coba lagi nanti.',
          locked: true,
          lockedUntil: user.lockedUntil,
        },
        { status: 403 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      await logAttempt(false, 'Account inactive');
      return NextResponse.json(
        { error: 'Akun tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(body.password, user.password);

    if (!isValid) {
      // Increment failed attempts
      const newFailedCount = user.failedLoginCount + 1;
      const updateData: Record<string, unknown> = {
        failedLoginCount: newFailedCount,
      };

      // Lock account if max attempts reached
      if (newFailedCount >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = calculateLockoutTime(newFailedCount);
      }

      await db.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await logAttempt(false, 'Invalid password');

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - newFailedCount;
      if (remainingAttempts <= 0) {
        return NextResponse.json(
          { 
            error: 'Terlalu banyak percobaan. Akun terkunci.',
            locked: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: `Username/Email atau password salah. Sisa percobaan: ${remainingAttempts}`,
          remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Check if there's an active session - auto logout old session
    const activeSession = user.sessions[0];
    if (activeSession) {
      // Deactivate old session (auto-logout from other device)
      await db.session.update({
        where: { id: activeSession.id },
        data: { isActive: false },
      });
    }

    // Create new session
    const sessionToken = generateSessionToken();
    const expiryMs = body.rememberMe ? SESSION_EXPIRY_REMEMBER : SESSION_EXPIRY_DEFAULT;
    const expiresAt = new Date(Date.now() + expiryMs);

    const session = await db.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        deviceInfo: `${userAgent}`,
        ipAddress: clientIp,
        userAgent,
        expiresAt,
      },
    });

    // Reset failed attempts and update last login
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await logAttempt(true);

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: user.id,
        userName: user.username,
        aksi: 'LOGIN',
        modul: 'AUTH',
        deskripsi: `Login berhasil dari ${getDeviceInfo(userAgent)}`,
        dataRef: null,
        deviceInfo: getDeviceInfo(userAgent),
        ipAddress: clientIp,
        userAgent,
      },
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        namaLengkap: user.namaLengkap,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
