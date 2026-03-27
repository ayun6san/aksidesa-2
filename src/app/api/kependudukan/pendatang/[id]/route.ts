import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisKelamin } from '@prisma/client';

// GET - Get Pendatang details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pendatang = await db.pendatang.findUnique({
      where: { id },
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

    if (!pendatang) {
      return NextResponse.json(
        { success: false, error: 'Pendatang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Transform data
    const transformedData = {
      ...pendatang,
      tanggalLahir: pendatang.tanggalLahir?.toISOString() || null,
      tanggalDatang: pendatang.tanggalDatang?.toISOString() || null,
      tanggalPulang: pendatang.tanggalPulang?.toISOString() || null,
      rt: pendatang.rt?.nomor || '-',
      rw: pendatang.rt?.rw?.nomor || '-',
      dusun: pendatang.dusun?.nama || pendatang.rt?.rw?.dusun?.nama || '-',
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error('Error fetching Pendatang:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data Pendatang' },
      { status: 500 }
    );
  }
}

// PUT - Update Pendatang
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nik,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      pekerjaan,
      alamatAsal,
      tujuanKedatangan,
      noTelp,
      alamat,
      rtId,
      dusunId,
      tanggalDatang,
      tanggalPulang,
      lamaTinggal,
      isActive,
      keterangan,
      foto,
    } = body;

    // Cek pendatang ada
    const existingPendatang = await db.pendatang.findUnique({
      where: { id },
    });

    if (!existingPendatang) {
      return NextResponse.json(
        { success: false, error: 'Pendatang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi NIK jika diubah
    if (nik && nik !== existingPendatang.nik) {
      if (!/^\d{16}$/.test(nik)) {
        return NextResponse.json(
          { success: false, error: 'NIK harus 16 digit angka' },
          { status: 400 }
        );
      }
    }

    // Update pendatang
    const pendatang = await db.pendatang.update({
      where: { id },
      data: {
        ...(nik !== undefined && { nik: nik || null }),
        ...(namaLengkap && { namaLengkap }),
        ...(tempatLahir !== undefined && { tempatLahir: tempatLahir || null }),
        ...(tanggalLahir !== undefined && { tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null }),
        ...(jenisKelamin && { jenisKelamin: jenisKelamin as JenisKelamin }),
        ...(pekerjaan !== undefined && { pekerjaan: pekerjaan || null }),
        ...(alamatAsal && { alamatAsal }),
        ...(tujuanKedatangan && { tujuanKedatangan }),
        ...(noTelp !== undefined && { noTelp: noTelp || null }),
        ...(alamat !== undefined && { alamat: alamat || null }),
        ...(rtId !== undefined && { rtId: rtId || null }),
        ...(dusunId !== undefined && { dusunId: dusunId || null }),
        ...(tanggalDatang !== undefined && { tanggalDatang: tanggalDatang ? new Date(tanggalDatang) : null }),
        ...(tanggalPulang !== undefined && { tanggalPulang: tanggalPulang ? new Date(tanggalPulang) : null }),
        ...(lamaTinggal !== undefined && { lamaTinggal: lamaTinggal || null }),
        ...(isActive !== undefined && { isActive }),
        ...(keterangan !== undefined && { keterangan: keterangan || null }),
        ...(foto !== undefined && { foto: foto || null }),
      },
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

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'UPDATE',
        modul: 'KEPENDUDUKAN',
        deskripsi: `Mengupdate pendatang: ${pendatang.namaLengkap}`,
        dataRef: JSON.stringify({ pendatangId: pendatang.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...pendatang,
        tanggalLahir: pendatang.tanggalLahir?.toISOString() || null,
        tanggalDatang: pendatang.tanggalDatang?.toISOString() || null,
        tanggalPulang: pendatang.tanggalPulang?.toISOString() || null,
      },
      message: 'Pendatang berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating Pendatang:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate Pendatang' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Pendatang
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Cek pendatang ada
    const existingPendatang = await db.pendatang.findUnique({
      where: { id },
    });

    if (!existingPendatang) {
      return NextResponse.json(
        { success: false, error: 'Pendatang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus pendatang
    await db.pendatang.delete({
      where: { id },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'DELETE',
        modul: 'KEPENDUDUKAN',
        deskripsi: `Menghapus pendatang: ${existingPendatang.namaLengkap}`,
        dataRef: JSON.stringify({ namaLengkap: existingPendatang.namaLengkap }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pendatang berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting Pendatang:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus Pendatang' },
      { status: 500 }
    );
  }
}
