import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisPeristiwa, JenisKelamin, StatusPenduduk } from '@prisma/client';

// GET - Get monitoring data (summary statistics)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());
    const bulan = parseInt(searchParams.get('bulan') || (new Date().getMonth() + 1).toString());

    // Get current statistics
    const [
      totalPenduduk,
      totalLakiLaki,
      totalPerempuan,
      totalKK,
      pendatangAktif,
    ] = await Promise.all([
      db.penduduk.count({
        where: { status: StatusPenduduk.TETAP, isActive: true }
      }),
      db.penduduk.count({
        where: { 
          status: StatusPenduduk.TETAP, 
          isActive: true, 
          jenisKelamin: JenisKelamin.LAKI_LAKI 
        }
      }),
      db.penduduk.count({
        where: { 
          status: StatusPenduduk.TETAP, 
          isActive: true, 
          jenisKelamin: JenisKelamin.PEREMPUAN 
        }
      }),
      db.kK.count({
        where: { isActive: true }
      }),
      db.pendatang.count({
        where: { isActive: true }
      }),
    ]);

    // Get peristiwa statistics for the month
    const startOfMonth = new Date(tahun, bulan - 1, 1);
    const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59);

    const [
      kelahiran,
      kematian,
      pindahMasuk,
      pindahKeluar,
      perkawinan,
      perceraian,
    ] = await Promise.all([
      db.peristiwaKependudukan.count({
        where: {
          jenisPeristiwa: JenisPeristiwa.KELAHIRAN,
          tanggalPeristiwa: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      db.peristiwaKependudukan.count({
        where: {
          jenisPeristiwa: JenisPeristiwa.KEMATIAN,
          tanggalPeristiwa: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      db.peristiwaKependudukan.count({
        where: {
          jenisPeristiwa: JenisPeristiwa.PINDAH_MASUK,
          tanggalPeristiwa: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      db.peristiwaKependudukan.count({
        where: {
          jenisPeristiwa: JenisPeristiwa.PINDAH_KELUAR,
          tanggalPeristiwa: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      db.peristiwaKependudukan.count({
        where: {
          jenisPeristiwa: JenisPeristiwa.PERKAWINAN,
          tanggalPeristiwa: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      db.peristiwaKependudukan.count({
        where: {
          jenisPeristiwa: JenisPeristiwa.PERCERAIAN,
          tanggalPeristiwa: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
    ]);

    // Get statistics by dusun
    const dusunStats = await db.dusun.findMany({
      include: {
        _count: {
          select: {
            kk: { where: { isActive: true } }
          }
        }
      }
    });

    // Get penduduk count per dusun through KK
    const pendudukPerDusun = await db.penduduk.groupBy({
      by: ['kkId'],
      where: { status: StatusPenduduk.TETAP, isActive: true },
      _count: { id: true }
    });

    // Get KK to Dusun mapping
    const kkDusunMap = await db.kK.findMany({
      where: { isActive: true, dusunId: { not: null } },
      select: { id: true, dusunId: true }
    });
    const kkToDusun: Record<string, string> = {};
    kkDusunMap.forEach(kk => {
      if (kk.dusunId) kkToDusun[kk.id] = kk.dusunId;
    });

    // Calculate penduduk count per dusun
    const pendudukCountPerDusun: Record<string, number> = {};
    pendudukPerDusun.forEach(p => {
      if (p.kkId && kkToDusun[p.kkId]) {
        const dusunId = kkToDusun[p.kkId];
        pendudukCountPerDusun[dusunId] = (pendudukCountPerDusun[dusunId] || 0) + p._count.id;
      }
    });

    // Get monthly data for the year (for charts)
    const monthlyData: Array<{
      bulan: number;
      namaBulan: string;
      kelahiran: number;
      kematian: number;
      pindahMasuk: number;
      pindahKeluar: number;
    }> = [];
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(tahun, m - 1, 1);
      const monthEnd = new Date(tahun, m, 0, 23, 59, 59);

      const [
        monthKelahiran,
        monthKematian,
        monthPindahMasuk,
        monthPindahKeluar,
      ] = await Promise.all([
        db.peristiwaKependudukan.count({
          where: {
            jenisPeristiwa: JenisPeristiwa.KELAHIRAN,
            tanggalPeristiwa: { gte: monthStart, lte: monthEnd }
          }
        }),
        db.peristiwaKependudukan.count({
          where: {
            jenisPeristiwa: JenisPeristiwa.KEMATIAN,
            tanggalPeristiwa: { gte: monthStart, lte: monthEnd }
          }
        }),
        db.peristiwaKependudukan.count({
          where: {
            jenisPeristiwa: JenisPeristiwa.PINDAH_MASUK,
            tanggalPeristiwa: { gte: monthStart, lte: monthEnd }
          }
        }),
        db.peristiwaKependudukan.count({
          where: {
            jenisPeristiwa: JenisPeristiwa.PINDAH_KELUAR,
            tanggalPeristiwa: { gte: monthStart, lte: monthEnd }
          }
        }),
      ]);

      monthlyData.push({
        bulan: m,
        namaBulan: new Date(tahun, m - 1, 1).toLocaleString('id-ID', { month: 'long' }),
        kelahiran: monthKelahiran,
        kematian: monthKematian,
        pindahMasuk: monthPindahMasuk,
        pindahKeluar: monthPindahKeluar,
      });
    }

    // Get age distribution
    const pendudukWithAge = await db.penduduk.findMany({
      where: { status: StatusPenduduk.TETAP, isActive: true },
      select: { tanggalLahir: true, jenisKelamin: true }
    });

    const now = new Date();
    const ageGroups = {
      '0-5': { lakiLaki: 0, perempuan: 0 },
      '6-12': { lakiLaki: 0, perempuan: 0 },
      '13-17': { lakiLaki: 0, perempuan: 0 },
      '18-25': { lakiLaki: 0, perempuan: 0 },
      '26-40': { lakiLaki: 0, perempuan: 0 },
      '41-60': { lakiLaki: 0, perempuan: 0 },
      '60+': { lakiLaki: 0, perempuan: 0 },
    };

    pendudukWithAge.forEach(p => {
      if (!p.tanggalLahir) return;
      const age = Math.floor((now.getTime() - p.tanggalLahir.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      let group: keyof typeof ageGroups;
      if (age <= 5) group = '0-5';
      else if (age <= 12) group = '6-12';
      else if (age <= 17) group = '13-17';
      else if (age <= 25) group = '18-25';
      else if (age <= 40) group = '26-40';
      else if (age <= 60) group = '41-60';
      else group = '60+';

      if (p.jenisKelamin === JenisKelamin.LAKI_LAKI) {
        ageGroups[group].lakiLaki++;
      } else {
        ageGroups[group].perempuan++;
      }
    });

    // Get religion distribution
    const agamaStats = await db.penduduk.groupBy({
      by: ['agama'],
      where: { status: StatusPenduduk.TETAP, isActive: true },
      _count: { id: true }
    });

    // Get pekerjaan distribution
    const pekerjaanStats = await db.penduduk.groupBy({
      by: ['pekerjaan'],
      where: { status: StatusPenduduk.TETAP, isActive: true },
      _count: { id: true }
    });

    // Get pendidikan distribution
    const pendidikanStats = await db.penduduk.groupBy({
      by: ['pendidikan'],
      where: { status: StatusPenduduk.TETAP, isActive: true },
      _count: { id: true }
    });

    // Get status perkawinan distribution
    const statusPerkawinanStats = await db.penduduk.groupBy({
      by: ['statusPerkawinan'],
      where: { status: StatusPenduduk.TETAP, isActive: true },
      _count: { id: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        periode: { tahun, bulan },
        summary: {
          totalPenduduk,
          totalLakiLaki,
          totalPerempuan,
          totalKK,
          pendatangAktif,
        },
        peristiwaBulanIni: {
          kelahiran,
          kematian,
          pindahMasuk,
          pindahKeluar,
          perkawinan,
          perceraian,
        },
        dusunStats: dusunStats.map(d => ({
          id: d.id,
          nama: d.nama,
          jumlahPenduduk: pendudukCountPerDusun[d.id] || 0,
          jumlahKK: d._count.kk,
        })),
        monthlyData,
        ageDistribution: Object.entries(ageGroups).map(([group, counts]) => ({
          group,
          lakiLaki: counts.lakiLaki,
          perempuan: counts.perempuan,
          total: counts.lakiLaki + counts.perempuan,
        })),
        agamaDistribution: agamaStats.map(a => ({
          agama: a.agama,
          jumlah: a._count.id
        })),
        pekerjaanDistribution: pekerjaanStats.map(p => ({
          pekerjaan: p.pekerjaan || 'Tidak Diketahui',
          jumlah: p._count.id
        })),
        pendidikanDistribution: pendidikanStats.map(p => ({
          pendidikan: p.pendidikan || 'Tidak Diketahui',
          jumlah: p._count.id
        })),
        statusPerkawinanDistribution: statusPerkawinanStats.map(s => ({
          status: s.statusPerkawinan,
          jumlah: s._count.id
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data monitoring' },
      { status: 500 }
    );
  }
}
