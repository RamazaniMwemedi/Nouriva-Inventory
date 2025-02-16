import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ProductsTable } from '../products-table';
import { getProducts } from '@/lib/db';
import { AddProductDialog } from '@/components/ui/dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { q: string; offset: string };
}) {
  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { products, newOffset, totalProducts } = await getProducts(
    search,
    Number(offset),
    parseInt(session?.user?.id!)
  );
  console.log('seller session:>> ', session);
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button
            // onClick={}
            size="sm"
            variant="outline"
            className="h-8 gap-1"
          >
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Link
            href={'/add-product'}
            className={cn(
              buttonVariants({
                size: 'sm',
                className: 'h-8 gap-1'
              })
            )}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Product
            </span>
          </Link>
        </div>
      </div>
      <TabsContent value="all">
        <ProductsTable
          products={products}
          offset={newOffset ?? 0}
          totalProducts={totalProducts}
        />
      </TabsContent>
    </Tabs>
  );
}
