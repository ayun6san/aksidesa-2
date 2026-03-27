import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { UserStatus, UserRole } from '@prisma/client';

// User Management API - v2
// GET - List users with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { namaLengkap: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }
    
    if (role) {
      where.role = role as UserRole;
    }
    
    if (status) {
      where.status = status as UserStatus;
    }

    // Get users and count
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
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
          createdAt: true,
          sessions: {
            where: { isActive: true },
            select: { id: true },
            take: 1,
          },
          faceData: {
            select: { id: true },
          },
          rfidCards: {
            where: { isActive: true },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      namaLengkap: user.namaLengkap,
      username: user.username,
      email: user.email,
      noHp: user.noHp,
      role: user.role,
      status: user.status,
      isFirstChild: user.isFirstChild,
      faceRecognitionEnabled: user.faceRecognitionEnabled,
      rfidEnabled: user.rfidEnabled,
      hasFaceData: !!user.faceData,
      hasRfidCard: user.rfidCards.length > 0,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      isOnline: user.sessions.length > 0,
    }));

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      namaLengkap,
      username,
      email,
      noHp,
      password,
      role,
      status,
      faceRecognitionEnabled,
      rfidEnabled,
      resetCode,
    } = body;

    // Validasi field wajib
    if (!namaLengkap || !username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib harus diisi' },
        { status: 400 }
      );
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Cek username sudah ada
    const existingUsername = await db.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Cek email sudah ada
    const existingEmail = await db.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Hash reset code jika ada
    let hashedResetCode: string | null = null;
    if (resetCode) {
      hashedResetCode = await hash(resetCode, 10);
    }

    // Buat user baru
    const user = await db.user.create({
      data: {
        namaLengkap,
        username,
        email,
        noHp: noHp || null,
        password: hashedPassword,
        role: role as UserRole,
        status: (status || 'ACTIVE') as UserStatus,
        faceRecognitionEnabled: faceRecognitionEnabled || false,
        rfidEnabled: rfidEnabled || false,
        resetCode: hashedResetCode,
      },
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
      },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'CREATE',
        modul: 'USER',
        deskripsi: `Menambahkan user baru: ${user.namaLengkap} (${user.username})`,
        dataRef: JSON.stringify({ userId: user.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan user' },
      { status: 500 }
    );
  }
}
