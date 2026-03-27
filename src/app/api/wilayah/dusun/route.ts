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

// GET - List all Dusun with RW and RT counts
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const dusunList = await db.dusun.findMany({
      include: {
        _count: {
          select: { rw: true },
        },
        rw: {
          include: {
            _count: {
              select: { rt: true },
            },
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    // Calculate total RW, RT, and add counts
    const result = dusunList.map(dusun => {
      const totalRW = dusun._count.rw;
      const totalRT = dusun.rw.reduce((sum, rw) => sum + rw._count.rt, 0);
      
      return {
        id: dusun.id,
        nama: dusun.nama,
        kode: dusun.kode,
        jumlahKK: dusun.jumlahKK,
        jumlahPenduduk: dusun.jumlahPenduduk,
        totalRW,
        totalRT,
        createdAt: dusun.createdAt,
        updatedAt: dusun.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Dusun GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// POST - Create new Dusun
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { nama } = await request.json();

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama dusun wajib diisi' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await db.dusun.findFirst({
      where: { nama: nama.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Nama dusun sudah ada' },
        { status: 400 }
      );
    }

    // Generate auto kode dusun (3 digit: 001, 002, ...)
    const lastDusun = await db.dusun.findFirst({
      where: { kode: { not: null } },
      orderBy: { kode: 'desc' },
      select: { kode: true },
    });

    let nextKode = '001';
    if (lastDusun?.kode) {
      const lastNum = parseInt(lastDusun.kode, 10);
      nextKode = String(lastNum + 1).padStart(3, '0');
    }

    const dusun = await db.dusun.create({
      data: {
        nama: nama.trim(),
        kode: nextKode,
      },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'CREATE',
        modul: 'WILAYAH',
        deskripsi: `Membuat dusun baru: ${dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: dusun,
      message: 'Dusun berhasil ditambahkan',
    });
  } catch (error) {
    console.error('[Dusun POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan' },
      { status: 500 }
    );
  }
}
