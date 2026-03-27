import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisTempatTinggal } from '@prisma/client';
import { computeChangedFields } from '@/lib/activity-logger';

// GET - Get KK details with all anggota
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const kk = await db.kK.findUnique({
      where: { id },
      include: {
        anggota: {
          orderBy: { urutanDalamKK: 'asc' },
          select: {
            id: true,
            nik: true,
            namaLengkap: true,
            tempatLahir: true,
            tanggalLahir: true,
            jenisKelamin: true,
            agama: true,
            pekerjaan: true,
            pendidikan: true,
            statusPerkawinan: true,
            hubunganKeluarga: true,
            urutanDalamKK: true,
            status: true,
            isActive: true,
            foto: true,
          }
        },
        rt: {
          include: {
            rw: {
              include: {
                dusun: true
              }
            }
          }
        },
        dusun: true,
      }
    });

    if (!kk) {
      return NextResponse.json(
        { success: false, error: 'KK tidak ditemukan' },
        { status: 404 }
      );
    }

    // Transform data
    const transformedData = {
      id: kk.id,
      nomorKK: kk.nomorKK,
      alamat: kk.alamat,
      rt: kk.rt?.nomor || '-',
      rw: kk.rt?.rw?.nomor || '-',
      dusun: kk.dusun?.nama || kk.rt?.rw?.dusun?.nama || '-',
      rtId: kk.rtId,
      dusunId: kk.dusunId,
      tanggalTerbit: kk.tanggalTerbit,
      jenisTempatTinggal: kk.jenisTempatTinggal,
      latitude: kk.latitude,
      longitude: kk.longitude,
      scanKK: kk.scanKK,
      fotoRumah: kk.fotoRumah,
      isActive: kk.isActive,
      createdAt: kk.createdAt,
      updatedAt: kk.updatedAt,
      anggota: kk.anggota.map(a => ({
        ...a,
        tanggalLahir: a.tanggalLahir?.toISOString() || null,
      }))
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error('Error fetching KK:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data KK' },
      { status: 500 }
    );
  }
}

// PUT - Update KK
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      nomorKK, 
      tanggalTerbit,
      jenisTempatTinggal,
      alamat, 
      rtId, 
      dusunId, 
      latitude,
      longitude,
      scanKK,
      fotoRumah,
      isActive 
    } = body;

    // Cek KK ada
    const existingKK = await db.kK.findUnique({
      where: { id },
    });

    if (!existingKK) {
      return NextResponse.json(
        { success: false, error: 'KK tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi nomor KK jika diubah
    if (nomorKK && nomorKK !== existingKK.nomorKK) {
      if (!/^\d{16}$/.test(nomorKK)) {
        return NextResponse.json(
          { success: false, error: 'Nomor KK harus 16 digit angka' },
          { status: 400 }
        );
      }

      const duplicateKK = await db.kK.findUnique({
        where: { nomorKK },
      });

      if (duplicateKK) {
        return NextResponse.json(
          { success: false, error: 'Nomor KK sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Validasi jenis tempat tinggal jika diubah
    if (jenisTempatTinggal && !Object.values(JenisTempatTinggal).includes(jenisTempatTinggal as JenisTempatTinggal)) {
      return NextResponse.json(
        { success: false, error: 'Jenis tempat tinggal tidak valid' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (nomorKK) updateData.nomorKK = nomorKK;
    if (tanggalTerbit !== undefined) updateData.tanggalTerbit = tanggalTerbit ? new Date(tanggalTerbit) : null;
    if (jenisTempatTinggal) updateData.jenisTempatTinggal = jenisTempatTinggal;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (rtId !== undefined) updateData.rtId = rtId || null;
    if (dusunId !== undefined) updateData.dusunId = dusunId || null;
    if (latitude !== undefined) updateData.latitude = latitude || null;
    if (longitude !== undefined) updateData.longitude = longitude || null;
    if (scanKK !== undefined) updateData.scanKK = scanKK || null;
    if (fotoRumah !== undefined) updateData.fotoRumah = fotoRumah || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update KK
    const kk = await db.kK.update({
      where: { id },
      data: updateData,
      include: {
        rt: {
          include: {
            rw: {
              include: {
                dusun: true
              }
            }
          }
        },
        dusun: true,
      }
    });

    // Compute changed fields for audit log
    const { changedFields, before, after } = computeChangedFields(existingKK, kk);

    // Catat log aktivitas dengan detail perubahan
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'UPDATE',
        modul: 'KK',
        deskripsi: `Mengupdate data KK: ${kk.nomorKK}`,
        dataRef: JSON.stringify({
          kkId: kk.id,
          nomorKK: kk.nomorKK,
          changedFields,
          before,
          after,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: kk,
      message: 'KK berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating KK:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate KK' },
      { status: 500 }
    );
  }
}

// DELETE - Delete KK
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Cek KK ada
    const existingKK = await db.kK.findUnique({
      where: { id },
      include: {
        _count: {
          select: { anggota: true }
        }
      }
    });

    if (!existingKK) {
      return NextResponse.json(
        { success: false, error: 'KK tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek apakah ada anggota
    if (existingKK._count.anggota > 0) {
      return NextResponse.json(
        { success: false, error: 'KK tidak dapat dihapus karena masih memiliki anggota' },
        { status: 400 }
      );
    }

    // Hapus KK
    await db.kK.delete({
      where: { id },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'DELETE',
        modul: 'KK',
        deskripsi: `Menghapus KK: ${existingKK.nomorKK}`,
        dataRef: JSON.stringify({ nomorKK: existingKK.nomorKK }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'KK berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting KK:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus KK' },
      { status: 500 }
    );
  }
}
