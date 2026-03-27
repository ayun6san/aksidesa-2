import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JenisKelamin, Agama, StatusPerkawinan, StatusPenduduk, StatusKTP, JenisDisabilitas, Kewarganegaraan } from '@prisma/client';
import { computeChangedFields } from '@/lib/activity-logger';

// GET - Get Penduduk details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const penduduk = await db.penduduk.findUnique({
      where: { id },
      include: {
        kk: {
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
            anggota: {
              where: { hubunganKeluarga: 'Kepala Keluarga' },
              select: { namaLengkap: true }
            }
          }
        }
      }
    });

    if (!penduduk) {
      return NextResponse.json(
        { success: false, error: 'Penduduk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Transform data - get alamat/wilayah from KK
    const transformedData = {
      ...penduduk,
      tanggalLahir: penduduk.tanggalLahir?.toISOString() || null,
      tanggalPerkawinan: penduduk.tanggalPerkawinan?.toISOString() || null,
      tanggalPerceraian: penduduk.tanggalPerceraian?.toISOString() || null,
      tanggalMasuk: penduduk.tanggalMasuk?.toISOString() || null,
      // Alamat dan wilayah dari KK
      alamat: penduduk.kk?.alamat || '-',
      rt: penduduk.kk?.rt?.nomor || '-',
      rw: penduduk.kk?.rt?.rw?.nomor || '-',
      dusun: penduduk.kk?.dusun?.nama || penduduk.kk?.rt?.rw?.dusun?.nama || '-',
      namaKepalaKeluarga: penduduk.kk?.anggota[0]?.namaLengkap || '-',
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error('Error fetching Penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data Penduduk' },
      { status: 500 }
    );
  }
}

// PUT - Update Penduduk
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Cek penduduk ada
    const existingPenduduk = await db.penduduk.findUnique({
      where: { id },
    });

    if (!existingPenduduk) {
      return NextResponse.json(
        { success: false, error: 'Penduduk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi NIK jika diubah
    if (body.nik && body.nik !== existingPenduduk.nik) {
      if (!/^\d{16}$/.test(body.nik)) {
        return NextResponse.json(
          { success: false, error: 'NIK harus 16 digit angka' },
          { status: 400 }
        );
      }

      const duplicateNIK = await db.penduduk.findUnique({
        where: { nik: body.nik },
      });

      if (duplicateNIK) {
        return NextResponse.json(
          { success: false, error: 'NIK sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    
    // Identitas
    if (body.nik) updateData.nik = body.nik;
    if (body.namaLengkap) updateData.namaLengkap = body.namaLengkap;
    if (body.tempatLahir !== undefined) updateData.tempatLahir = body.tempatLahir || null;
    if (body.tanggalLahir !== undefined) updateData.tanggalLahir = body.tanggalLahir ? new Date(body.tanggalLahir) : null;
    if (body.jenisKelamin) updateData.jenisKelamin = body.jenisKelamin as JenisKelamin;
    if (body.golonganDarah !== undefined) updateData.golonganDarah = body.golonganDarah || null;
    if (body.agama) updateData.agama = body.agama as Agama;
    if (body.suku !== undefined) updateData.suku = body.suku || null;
    
    // Status Perkawinan
    if (body.statusPerkawinan) updateData.statusPerkawinan = body.statusPerkawinan as StatusPerkawinan;
    if (body.aktaPerkawinan !== undefined) updateData.aktaPerkawinan = body.aktaPerkawinan || null;
    if (body.tanggalPerkawinan !== undefined) updateData.tanggalPerkawinan = body.tanggalPerkawinan ? new Date(body.tanggalPerkawinan) : null;
    if (body.aktaPerceraian !== undefined) updateData.aktaPerceraian = body.aktaPerceraian || null;
    if (body.tanggalPerceraian !== undefined) updateData.tanggalPerceraian = body.tanggalPerceraian ? new Date(body.tanggalPerceraian) : null;
    
    // Pekerjaan & Pendidikan
    if (body.pekerjaan !== undefined) updateData.pekerjaan = body.pekerjaan || null;
    if (body.pendidikan !== undefined) updateData.pendidikan = body.pendidikan || null;
    if (body.penghasilan !== undefined) updateData.penghasilan = body.penghasilan || null;
    
    // Kewarganegaraan
    if (body.kewarganegaraan) updateData.kewarganegaraan = body.kewarganegaraan as Kewarganegaraan;
    if (body.negaraAsal !== undefined) updateData.negaraAsal = body.negaraAsal || null;
    if (body.noPaspor !== undefined) updateData.noPaspor = body.noPaspor || null;
    if (body.noKitasKitap !== undefined) updateData.noKitasKitap = body.noKitasKitap || null;
    if (body.tanggalMasuk !== undefined) updateData.tanggalMasuk = body.tanggalMasuk ? new Date(body.tanggalMasuk) : null;
    
    // Dokumen
    if (body.noAktaKelahiran !== undefined) updateData.noAktaKelahiran = body.noAktaKelahiran || null;
    if (body.statusKTP) updateData.statusKTP = body.statusKTP as StatusKTP;
    if (body.noBPJSKesehatan !== undefined) updateData.noBPJSKesehatan = body.noBPJSKesehatan || null;
    if (body.noBPJSTenagakerja !== undefined) updateData.noBPJSTenagakerja = body.noBPJSTenagakerja || null;
    if (body.npwp !== undefined) updateData.npwp = body.npwp || null;
    
    // Data Orang Tua
    if (body.namaAyah !== undefined) updateData.namaAyah = body.namaAyah || null;
    if (body.nikAyah !== undefined) updateData.nikAyah = body.nikAyah || null;
    if (body.namaIbu !== undefined) updateData.namaIbu = body.namaIbu || null;
    if (body.nikIbu !== undefined) updateData.nikIbu = body.nikIbu || null;
    if (body.anakKe !== undefined) updateData.anakKe = body.anakKe ? parseInt(body.anakKe) : null;
    if (body.jumlahSaudara !== undefined) updateData.jumlahSaudara = body.jumlahSaudara ? parseInt(body.jumlahSaudara) : null;
    
    // alamat, rtId, dusunId dihapus - menggunakan dari KK
    
    // KK
    if (body.kkId !== undefined) updateData.kkId = body.kkId || null;
    if (body.hubunganKeluarga !== undefined) updateData.hubunganKeluarga = body.hubunganKeluarga || null;
    if (body.urutanDalamKK !== undefined) updateData.urutanDalamKK = body.urutanDalamKK;
    
    // Kontak
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.noHP !== undefined) updateData.noHP = body.noHP || null;
    
    // Kesehatan & Disabilitas
    if (body.jenisNewabilitas) updateData.jenisNewabilitas = body.jenisNewabilitas as JenisDisabilitas;
    if (body.keteranganDisabilitas !== undefined) updateData.keteranganDisabilitas = body.keteranganDisabilitas || null;
    if (body.penyakitKronis !== undefined) updateData.penyakitKronis = body.penyakitKronis || null;
    
    // Status
    if (body.status) updateData.status = body.status as StatusPenduduk;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // Foto
    if (body.foto !== undefined) updateData.foto = body.foto || null;
    if (body.fotoKTP !== undefined) updateData.fotoKTP = body.fotoKTP || null;

    // Update penduduk
    const penduduk = await db.penduduk.update({
      where: { id },
      data: updateData,
      include: {
        kk: {
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
            dusun: true
          }
        }
      }
    });

    // Compute changed fields for audit log
    const { changedFields, before, after } = computeChangedFields(
      {
        ...existingPenduduk,
        tanggalLahir: existingPenduduk.tanggalLahir?.toISOString()?.split('T')[0],
        tanggalPerkawinan: existingPenduduk.tanggalPerkawinan?.toISOString()?.split('T')[0],
        tanggalPerceraian: existingPenduduk.tanggalPerceraian?.toISOString()?.split('T')[0],
        tanggalMasuk: existingPenduduk.tanggalMasuk?.toISOString()?.split('T')[0],
      },
      {
        ...penduduk,
        tanggalLahir: penduduk.tanggalLahir?.toISOString()?.split('T')[0],
        tanggalPerkawinan: penduduk.tanggalPerkawinan?.toISOString()?.split('T')[0],
        tanggalPerceraian: penduduk.tanggalPerceraian?.toISOString()?.split('T')[0],
        tanggalMasuk: penduduk.tanggalMasuk?.toISOString()?.split('T')[0],
      }
    );

    // Catat log aktivitas dengan detail perubahan
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'UPDATE',
        modul: 'PENDUDUK',
        deskripsi: `Mengupdate data penduduk: ${penduduk.namaLengkap} (${penduduk.nik})`,
        dataRef: JSON.stringify({
          pendudukId: penduduk.id,
          nik: penduduk.nik,
          nama: penduduk.namaLengkap,
          changedFields,
          before,
          after,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...penduduk,
        tanggalLahir: penduduk.tanggalLahir?.toISOString() || null,
        tanggalPerkawinan: penduduk.tanggalPerkawinan?.toISOString() || null,
        tanggalPerceraian: penduduk.tanggalPerceraian?.toISOString() || null,
        tanggalMasuk: penduduk.tanggalMasuk?.toISOString() || null,
      },
      message: 'Penduduk berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating Penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate Penduduk' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Penduduk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Cek penduduk ada
    const existingPenduduk = await db.penduduk.findUnique({
      where: { id },
    });

    if (!existingPenduduk) {
      return NextResponse.json(
        { success: false, error: 'Penduduk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus penduduk
    await db.penduduk.delete({
      where: { id },
    });

    // Catat log aktivitas
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'DELETE',
        modul: 'KEPENDUDUKAN',
        deskripsi: `Menghapus penduduk: ${existingPenduduk.namaLengkap} (${existingPenduduk.nik})`,
        dataRef: JSON.stringify({ nik: existingPenduduk.nik }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Penduduk berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting Penduduk:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus Penduduk' },
      { status: 500 }
    );
  }
}
