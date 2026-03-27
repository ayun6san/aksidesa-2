import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Upload logo (base64)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, image } = body;

    // type: 'logo' | 'logoKabupaten' | 'logoProvinsi'
    if (!type || !['logo', 'logoKabupaten', 'logoProvinsi'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipe logo tidak valid' },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Gambar tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate image size (base64)
    // Base64 string size ~ 1.37x the original file size
    // 2MB file = ~2.74MB base64
    const maxSize = 2 * 1024 * 1024 * 1.37; // ~2.74MB in base64
    if (image.length > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file maksimal 2MB' },
        { status: 400 }
      );
    }

    // Get existing desa
    let desa = await db.desa.findFirst();

    if (!desa) {
      // Create new desa with logo
      desa = await db.desa.create({
        data: {
          namaDesa: 'Desa Baru',
          kodeDesa: '000000',
          kecamatan: 'Kecamatan',
          kabupaten: 'Kabupaten',
          provinsi: 'Provinsi',
          negara: 'Indonesia',
          [type]: image,
        },
      });
    } else {
      // Update existing desa
      desa = await db.desa.update({
        where: { id: desa.id },
        data: {
          [type]: image,
        },
      });
    }

    // Log activity
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'UPDATE',
        modul: 'DESA',
        deskripsi: `Mengunggah ${type === 'logo' ? 'logo desa' : type === 'logoKabupaten' ? 'logo kabupaten' : 'logo provinsi'}`,
        dataRef: JSON.stringify({ desaId: desa.id, type }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { [type]: image },
      message: 'Logo berhasil diunggah',
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah logo' },
      { status: 500 }
    );
  }
}

// DELETE - Remove logo
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type || !['logo', 'logoKabupaten', 'logoProvinsi'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipe logo tidak valid' },
        { status: 400 }
      );
    }

    const desa = await db.desa.findFirst();

    if (!desa) {
      return NextResponse.json(
        { success: false, error: 'Data desa tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.desa.update({
      where: { id: desa.id },
      data: {
        [type]: null,
      },
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userName: 'System',
        aksi: 'DELETE',
        modul: 'DESA',
        deskripsi: `Menghapus ${type === 'logo' ? 'logo desa' : type === 'logoKabupaten' ? 'logo kabupaten' : 'logo provinsi'}`,
        dataRef: JSON.stringify({ desaId: desa.id, type }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Logo berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus logo' },
      { status: 500 }
    );
  }
}
