import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to get current user from cookie
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

// DELETE - Remove RFID card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get card info before deleting
    const card = await db.rFIDCard.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kartu RFID tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete card
    await db.rFIDCard.delete({
      where: { id },
    });

    // Check if user has other cards
    const otherCards = await db.rFIDCard.count({
      where: { userId: card.userId },
    });

    // Disable RFID for user if no more cards
    if (otherCards === 0) {
      await db.user.update({
        where: { id: card.userId },
        data: { rfidEnabled: false },
      });
    }

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'DELETE',
        modul: 'RFID',
        deskripsi: `Menghapus kartu RFID ${card.cardUid} dari user ${card.user.username}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kartu RFID berhasil dihapus',
    });
  } catch (error) {
    console.error('[RFID DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menghapus kartu' },
      { status: 500 }
    );
  }
}

// PATCH - Update RFID card (toggle active or rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { isActive, cardName } = await request.json();

    const card = await db.rFIDCard.findUnique({
      where: { id },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kartu RFID tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (cardName) updateData.cardName = cardName;

    const updatedCard = await db.rFIDCard.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.logAktivitas.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.username,
        aksi: 'UPDATE',
        modul: 'RFID',
        deskripsi: `Mengupdate kartu RFID ${card.cardUid}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCard,
      message: 'Kartu RFID berhasil diupdate',
    });
  } catch (error) {
    console.error('[RFID PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate kartu' },
      { status: 500 }
    );
  }
}
