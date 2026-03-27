import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import type { User, FaceData } from '@prisma/client';

// Threshold for face matching (0.5 = very strict, 0.6 = strict, 0.7 = standard)
const MATCH_THRESHOLD = 0.5;

function calculateDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

export async function POST(request: NextRequest) {
  try {
    const { faceDescriptor } = await request.json();

    // Validate
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Data wajah tidak valid' },
        { status: 400 }
      );
    }

    // Get users with face data
    const users = await db.user.findMany({
      where: {
        status: 'ACTIVE',
        faceRecognitionEnabled: true,
        faceData: { isNot: null },
      },
      include: { faceData: true },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada user terdaftar dengan data wajah' },
        { status: 404 }
      );
    }

    // Find best match
    type UserWithFaceData = User & { faceData: FaceData | null };
    let bestMatch: UserWithFaceData | null = null;
    let bestDistance = Infinity;

    for (const user of users) {
      if (!user.faceData?.faceEncoding) continue;

      try {
        const storedDescriptor = JSON.parse(user.faceData.faceEncoding);
        const distance = calculateDistance(faceDescriptor, storedDescriptor);

        console.log(`[Face Login] ${user.username}: distance=${distance.toFixed(4)}`);

        if (distance < bestDistance && distance < MATCH_THRESHOLD) {
          bestDistance = distance;
          bestMatch = user;
        }
      } catch (e) {
        console.error(`[Face Login] Error parsing descriptor for ${user.username}`);
      }
    }

    if (!bestMatch) {
      const closestDistance = bestDistance === Infinity ? null : bestDistance;
      console.log(`[Face Login] No match found. Closest: ${closestDistance?.toFixed(4)}, Threshold: ${MATCH_THRESHOLD}`);
      
      return NextResponse.json({
        success: false,
        error: 'Wajah tidak dikenali. Pastikan Anda sudah terdaftar.',
        debug: {
          threshold: MATCH_THRESHOLD,
          closestDistance,
          usersChecked: users.length,
        },
      }, { status: 401 });
    }

    // Create session
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Invalidate old sessions
    await db.session.updateMany({
      where: { userId: bestMatch.id, isActive: true },
      data: { isActive: false },
    });

    // Create new session
    await db.session.create({
      data: {
        userId: bestMatch.id,
        token,
        deviceInfo: 'Face Recognition',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        isActive: true,
        expiresAt,
      },
    });

    // Update last login
    await db.user.update({
      where: { id: bestMatch.id },
      data: { lastLoginAt: new Date() },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: bestMatch.id,
        userName: bestMatch.username,
        aksi: 'LOGIN',
        modul: 'AUTH',
        deskripsi: `Login via Face Recognition`,
      },
    });

    console.log(`[Face Login] Success: ${bestMatch.username}, distance: ${bestDistance.toFixed(4)}`);

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: bestMatch.id,
        namaLengkap: bestMatch.namaLengkap,
        username: bestMatch.username,
        role: bestMatch.role,
      },
      token,
      distance: bestDistance,
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
    console.error('[Face Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat verifikasi' },
      { status: 500 }
    );
  }
}
