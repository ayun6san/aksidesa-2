import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get Desa settings
export async function GET() {
  try {
    // Get the first (and should be only) desa
    let desa = await db.desa.findFirst();

    // If no desa exists, create a default one
    if (!desa) {
      desa = await db.desa.create({
        data: {
          namaDesa: 'Desa Baru',
          kodeDesa: '000000',
          kecamatan: 'Kecamatan',
          kabupaten: 'Kabupaten',
          provinsi: 'Provinsi',
          negara: 'Indonesia',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: desa,
    });
  } catch (error) {
    console.error('Error fetching desa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data desa' },
      { status: 500 }
    );
  }
}

// PUT - Update Desa settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get existing desa
    let desa = await db.desa.findFirst();

    if (!desa) {
      // Create new desa if not exists
      desa = await db.desa.create({
        data: {
          namaDesa: body.namaDesa || 'Desa Baru',
          kodeDesa: body.kodeDesa || '000000',
          kodePos: body.kodePos || null,
          kecamatan: body.kecamatan || 'Kecamatan',
          kabupaten: body.kabupaten || 'Kabupaten',
          provinsi: body.provinsi || 'Provinsi',
          negara: body.negara || 'Indonesia',
          alamatKantor: body.alamatKantor || null,
          telepon: body.telepon || null,
          email: body.email || null,
          website: body.website || null,
          logo: body.logo || null,
          logoKabupaten: body.logoKabupaten || null,
          logoProvinsi: body.logoProvinsi || null,
          visi: body.visi || null,
          misi: body.misi || null,
          luasWilayah: body.luasWilayah || null,
          ketinggian: body.ketinggian || null,
          curahHujan: body.curahHujan || null,
          batasUtara: body.batasUtara || null,
          batasSelatan: body.batasSelatan || null,
          batasTimur: body.batasTimur || null,
          batasBarat: body.batasBarat || null,
          tanggalBerdiri: body.tanggalBerdiri ? new Date(body.tanggalBerdiri) : null,
          hariJadi: body.hariJadi || null,
          sejarahSingkat: body.sejarahSingkat || null,
        },
      });

      // Log activity
      await db.logAktivitas.create({
        data: {
          userName: 'System',
          aksi: 'CREATE',
          modul: 'DESA',
          deskripsi: 'Membuat data desa baru',
          dataRef: JSON.stringify({ desaId: desa.id }),
        },
      });

      return NextResponse.json({
        success: true,
        data: desa,
        message: 'Data desa berhasil dibuat',
      });
    }

    // Update existing desa
    const updatedDesa = await db.desa.update({
      where: { id: desa.id },
      data: {
        namaDesa: body.namaDesa,
        kodeDesa: body.kodeDesa,
        kodePos: body.kodePos || null,
        kecamatan: body.kecamatan,
        kabupaten: body.kabupaten,
        provinsi: body.provinsi,
        negara: body.negara || 'Indonesia',
        alamatKantor: body.alamatKantor || null,
        telepon: body.telepon || null,
        email: body.email || null,
        website: body.website || null,
        logo: body.logo,
        logoKabupaten: body.logoKabupaten,
        logoProvinsi: body.logoProvinsi,
        visi: body.visi || null,
        misi: body.misi || null,
        luasWilayah: body.luasWilayah || null,
        ketinggian: body.ketinggian || null,
        curahHujan: body.curahHujan || null,
        batasUtara: body.batasUtara || null,
        batasSelatan: body.batasSelatan || null,
        batasTimur: body.batasTimur || null,
        batasBarat: body.batasBarat || null,
        tanggalBerdiri: body.tanggalBerdiri ? new Date(body.tanggalBerdiri) : null,
        hariJadi: body.hariJadi || null,
        sejarahSingkat: body.sejarahSingkat || null,
      },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'UPDATE',
        modul: 'DESA',
        deskripsi: 'Memperbarui data desa',
        dataRef: JSON.stringify({ desaId: updatedDesa.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDesa,
      message: 'Data desa berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating desa:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui data desa' },
      { status: 500 }
    );
  }
}
