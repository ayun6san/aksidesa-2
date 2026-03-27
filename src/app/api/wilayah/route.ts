import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all wilayah (Dusun, RW, RT) for dropdown filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dusunId = searchParams.get('dusunId') || '';

    // Get all Dusun with RW and RT
    const dusunList = await db.dusun.findMany({
      select: {
        id: true,
        nama: true,
        kode: true,
        rw: {
          select: {
            id: true,
            nomor: true,
            rt: {
              select: {
                id: true,
                nomor: true,
              },
              orderBy: { nomor: 'asc' }
            }
          },
          orderBy: { nomor: 'asc' }
        }
      },
      orderBy: { nama: 'asc' }
    });

    // If dusunId is provided, get RT list for that dusun
    let rtList: any[] = [];
    if (dusunId) {
      const dusun = await db.dusun.findUnique({
        where: { id: dusunId },
        include: {
          rw: {
            include: {
              rt: {
                select: {
                  id: true,
                  nomor: true,
                  _count: {
                    select: { kk: true }
                  }
                },
                orderBy: { nomor: 'asc' }
              }
            },
            orderBy: { nomor: 'asc' }
          }
        }
      });

      if (dusun) {
        rtList = dusun.rw.flatMap(rw => 
          rw.rt.map(rt => ({
            id: rt.id,
            nomor: rt.nomor,
            rwNomor: rw.nomor,
            label: `RT ${rt.nomor} / RW ${rw.nomor}`,
            jumlahKK: rt._count.kk
          }))
        );
      }
    }

    // Transform dusun data - count RT through RW
    const transformedDusun = dusunList.map(dusun => {
      const allRT = dusun.rw.flatMap(rw => rw.rt);
      return {
        id: dusun.id,
        nama: dusun.nama,
        kode: dusun.kode,
        jumlahRT: allRT.length,
        rwList: dusun.rw.map(rw => ({
          id: rw.id,
          nomor: rw.nomor,
          jumlahRT: rw.rt.length,
          rtList: rw.rt
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        dusun: transformedDusun,
        rt: rtList,
      }
    });
  } catch (error) {
    console.error('Error fetching wilayah:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data wilayah' },
      { status: 500 }
    );
  }
}
