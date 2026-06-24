import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const expiredProducts = await prisma.product.findMany({
      where: {
        isFlashSale: true,
        flashSaleEndsAt: {
          lt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (expiredProducts.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired flash sale products to update.', updatedCount: 0 });
    }

    const updated = await prisma.product.updateMany({
      where: {
        id: { in: expiredProducts.map((p) => p.id) },
      },
      data: {
        isFlashSale: false,
        flashSalePrice: null,
        flashSaleEndsAt: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Expired flash sale products cleaned up.', updatedCount: updated.count });
  } catch (error) {
    console.error('Flash sale cleanup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
