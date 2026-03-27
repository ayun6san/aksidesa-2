import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

// GET - List RW by Dusun
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
    const dusunId = searchParams.get('dusunId');

    const where: any = {};
    if (dusunId) where.dusunId = dusunId;

    const rwList = await db.rW.findMany({
      where,
      include: {
        dusun: {
          select: { id: true, nama: true },
        },
        _count: {
          select: { rt: true },
        },
      },
      orderBy: [{ dusun: { nama: 'asc' } }, { nomor: 'asc' }],
    });

    const result = rwList.map(rw => ({
      id: rw.id,
      nomor: rw.nomor,
      jumlahKK: rw.jumlahKK,
      jumlahPenduduk: rw.jumlahPenduduk,
      totalRT: rw._count.rt,
      dusunId: rw.dusunId,
      dusun: rw.dusun,
      createdAt: rw.createdAt,
      updatedAt: rw.updatedAt,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[RW GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// POST - Create new RW
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { dusunId, nomor } = await request.json();

    if (!dusunId) {
      return NextResponse.json(
        { success: false, error: 'Dusun wajib dipilih' },
        { status: 400 }
      );
    }

    if (!nomor || !nomor.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nomor RW wajib diisi' },
        { status: 400 }
      );
    }

    // Format nomor to 3 digits
    const formattedNomor = nomor.trim().padStart(3, '0');

    // Check if RW already exists in this dusun
    const existing = await db.rW.findUnique({
      where: {
        dusunId_nomor: {
          dusunId,
          nomor: formattedNomor,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'RW sudah ada di dusun ini' },
        { status: 400 }
      );
    }

    // Check if dusun exists
    const dusun = await db.dusun.findUnique({
      where: { id: dusunId },
    });

    if (!dusun) {
      return NextResponse.json(
        { success: false, error: 'Dusun tidak ditemukan' },
        { status: 404 }
      );
    }

    const rw = await db.rW.create({
      data: {
        dusunId,
        nomor: formattedNomor,
      },
      include: {
        dusun: { select: { id: true, nama: true } },
      },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'CREATE',
        modul: 'WILAYAH',
        deskripsi: `Membuat RW ${rw.nomor} di ${dusun.nama}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: rw,
      message: 'RW berhasil ditambahkan',
    });
  } catch (error) {
    console.error('[RW POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan' },
      { status: 500 }
    );
  }
}
