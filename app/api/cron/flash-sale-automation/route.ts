import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Clear existing flash sales
    await prisma.product.updateMany({
      where: {
        isFlashSale: true,
      },
      data: {
        isFlashSale: false,
        flashSalePrice: null,
        flashSaleEndsAt: null,
      },
    });

    // 2. Find eligible discounted products (comparePrice > price) and active
    const potentialProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        comparePrice: { gt: 0 },
      },
      select: {
        id: true,
        price: true,
        comparePrice: true,
      },
    });

    // Filter in-memory for actual discounts
    let discountedProducts = potentialProducts.filter(
      (p) => p.comparePrice && p.comparePrice > p.price
    );

    // 3. Shuffle and pick up to 8
    for (let i = discountedProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [discountedProducts[i], discountedProducts[j]] = [discountedProducts[j], discountedProducts[i]];
    }
    
    const selectedProducts = discountedProducts.slice(0, 8);

    if (selectedProducts.length === 0) {
        return NextResponse.json({ success: true, message: 'No eligible discounted products found.', count: 0 });
    }

    // 4. Update the selected products
    const now = new Date();
    const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    let updatedCount = 0;
    for (const product of selectedProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          isFlashSale: true,
          flashSalePrice: product.price, // the 'price' is the already-discounted price
          flashSaleEndsAt: endsAt,
        },
      });
      updatedCount++;
    }

    return NextResponse.json({ 
        success: true, 
        message: `Successfully rotated ${updatedCount} products into Flash Sale.`, 
        count: updatedCount 
    });
  } catch (error) {
    console.error('Flash sale automation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
