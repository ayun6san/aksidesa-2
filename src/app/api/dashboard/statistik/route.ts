import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Return sample data for now (database not fully set up)
    return NextResponse.json({
      totalPenduduk: 5485,
      totalKK: 1523,
      pendatang: 45,
      kematian: 12,
      kelahiran: 28,
      pindah: 8,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
