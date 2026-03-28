import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Reorder BPD
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, direction } = body; // direction: 'up' or 'down'
    
    // Get current item
    const currentItem = await db.bPD.findUnique({
      where: { id }
    });
    
    if (!currentItem) {
      return NextResponse.json(
        { success: false, error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Get all items ordered by urutan
    const allItems = await db.bPD.findMany({
      orderBy: { urutan: 'asc' }
    });
    
    const currentIndex = allItems.findIndex(item => item.id === id);
    
    if (direction === 'up' && currentIndex === 0) {
      return NextResponse.json({
        success: false,
        error: 'Item sudah di posisi paling atas'
      });
    }
    
    if (direction === 'down' && currentIndex === allItems.length - 1) {
      return NextResponse.json({
        success: false,
        error: 'Item sudah di posisi paling bawah'
      });
    }
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetItem = allItems[targetIndex];
    
    // Swap urutan values
    await db.$transaction([
      db.bPD.update({
        where: { id: currentItem.id },
        data: { urutan: targetItem.urutan }
      }),
      db.bPD.update({
        where: { id: targetItem.id },
        data: { urutan: currentItem.urutan }
      })
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Urutan berhasil diubah'
    });
  } catch (error) {
    console.error('Error reordering BPD:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengubah urutan' },
      { status: 500 }
    );
  }
}
