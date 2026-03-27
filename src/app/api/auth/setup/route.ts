import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  isValidEmail,
  isValidUsername,
  isValidPhone,
  isValidPassword,
  getClientIp,
  getUserAgent,
} from '@/lib/auth-utils';

interface SetupRequest {
  // Super Admin data
  namaLengkap: string;
  username: string;
  email: string;
  noHp: string;
  password: string;
  konfirmasiPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if already initialized
    const existingAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Sistem sudah diinisialisasi' },
        { status: 400 }
      );
    }

    const body: SetupRequest = await request.json();

    // Validate all fields
    const errors: string[] = [];

    // Validate super admin data
    if (!body.namaLengkap?.trim()) errors.push('Nama lengkap wajib diisi');
    
    if (!body.username?.trim()) {
      errors.push('Username wajib diisi');
    } else if (!isValidUsername(body.username)) {
      errors.push('Username minimal 3 karakter, hanya boleh huruf, angka, dan underscore');
    }

    if (!body.email?.trim()) {
      errors.push('Email wajib diisi');
    } else if (!isValidEmail(body.email)) {
      errors.push('Format email tidak valid');
    }

    if (!body.noHp?.trim()) {
      errors.push('Nomor HP wajib diisi');
    } else if (!isValidPhone(body.noHp)) {
      errors.push('Format nomor HP tidak valid');
    }

    if (!body.password) {
      errors.push('Password wajib diisi');
    } else if (!isValidPassword(body.password)) {
      errors.push('Password minimal 6 karakter');
    }

    if (body.password !== body.konfirmasiPassword) {
      errors.push('Konfirmasi password tidak cocok');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Check for duplicate username/email
    const duplicateUser = await db.user.findFirst({
      where: {
        OR: [
          { username: body.username.toLowerCase() },
          { email: body.email.toLowerCase() },
        ],
      },
    });

    if (duplicateUser) {
      if (duplicateUser.username === body.username.toLowerCase()) {
        return NextResponse.json(
          { error: 'Username sudah digunakan' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Create super admin
    const user = await db.user.create({
      data: {
        namaLengkap: body.namaLengkap.trim(),
        username: body.username.toLowerCase().trim(),
        email: body.email.toLowerCase().trim(),
        noHp: body.noHp.trim(),
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isFirstChild: true,
      },
    });

    // Log the setup attempt
    await db.loginAttempt.create({
      data: {
        userId: user.id,
        identifier: user.username,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        attemptType: 'PASSWORD',
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Setup berhasil, silakan login',
      data: {
        user: {
          id: user.id,
          namaLengkap: user.namaLengkap,
          username: user.username,
        },
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
