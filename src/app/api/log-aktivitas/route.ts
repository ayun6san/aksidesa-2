import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const modul = searchParams.get('modul');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (modul) where.modul = modul;
    if (userId) where.userId = userId;

    const logs = await db.logAktivitas.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.logAktivitas.count({ where });

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST - Create activity log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const log = await db.logAktivitas.create({
      data: {
        userId: body.userId || null,
        userName: body.userName,
        aksi: body.aksi,
        modul: body.modul,
        deskripsi: body.deskripsi,
        dataRef: body.dataRef ? JSON.stringify(body.dataRef) : null,
        deviceInfo: body.deviceInfo || null,
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
