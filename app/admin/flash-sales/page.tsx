import { formatDistanceToNowStrict } from "date-fns";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, RefreshCcw, Tag, Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type FlashProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  flashSalePrice: number | null;
  flashSaleEndsAt: Date | null;
  isActive: boolean;
  isFlashSale: boolean;
  stock: number;
  category: { name: string } | null;
  images: { url: string }[];
};

async function getFlashSaleProducts() {
  return prisma.product.findMany({
    where: {
      isFlashSale: true,
    },
    orderBy: { flashSaleEndsAt: "asc" },
    include: { category: true, images: true },
  });
}

function formatEndsAt(date: Date | null) {
  if (!date) return "No end date";
  const now = new Date();
  if (date < now) return "Expired";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export default async function AdminFlashSalesPage() {
  const products = await getFlashSaleProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
            <Clock className="h-8 w-8 text-accent" /> Flash Sale Manager
          </h1>
          <p className="text-muted-foreground mt-2">See upcoming flash sales, expiration status, and manage deals quickly.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new">
            <Button className="font-bold">Create New Product</Button>
          </Link>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/admin/products">All Products</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Current Flash Sale Products</CardTitle>
              <CardDescription>These products are currently marked as flash sale items.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCcw className="h-4 w-4" /> Updated live by product metadata.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No flash sale products configured yet.</div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => {
                  const now = new Date();
                  const endsAt = product.flashSaleEndsAt;
                  const isExpired = endsAt ? endsAt < now : false;
                  return (
                    <div key={product.id} className="grid gap-4 md:grid-cols-[1fr_auto] rounded-3xl border border-muted/30 bg-white p-6 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold">{product.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku || "N/A"}</p>
                          </div>
                          <Badge variant={product.isActive ? "secondary" : "outline"} className="uppercase text-[10px] font-bold tracking-[0.22em]">
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] font-bold">Regular Price</p>
                            <p>KES {product.price.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] font-bold">Flash Sale Price</p>
                            <p className="font-semibold text-accent">KES {(product.flashSalePrice ?? product.price).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] font-bold">Ends In</p>
                            <p className={isExpired ? "text-red-600 font-semibold" : "text-emerald-700 font-semibold"}>{formatEndsAt(endsAt)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] font-bold">Category</p>
                            <p>{product.category?.name || "Uncategorized"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] font-bold">Stock</p>
                            <p>{product.stock} pcs</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-3">
                        <Link href={`/admin/products/${product.id}`} className="rounded-2xl bg-accent px-4 py-3 text-center font-semibold text-accent-foreground hover:bg-accent/90">
                          Manage Sale
                        </Link>
                        <div className="rounded-2xl border border-muted/60 bg-muted/10 p-4">
                          <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-muted-foreground">Flash Sale Status</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p>{product.isFlashSale ? (isExpired ? "Expired" : "Live") : "Off"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Flash Sale Auto-Cleanup</CardTitle>
            <CardDescription>Expired flash sale items are automatically cleared by the nightly cron task.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>This page reflects flash sale products that are currently configured in the system. If the end time passes, the scheduled cleanup will disable the flash sale automatically and the product will no longer appear in the storefront flash section.</p>
              <p>If you want to create a new sale, edit a product and set the flash sale price, enable flash sale, and set an end date/time.</p>
            </div>
            <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              <ArrowRight className="h-4 w-4" /> Manage all products
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
