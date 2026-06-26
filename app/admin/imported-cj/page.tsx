import ImportedCJReviewClient from '@/components/admin/ImportedCJReviewClient';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ImportedCJPage() {
    const session = await auth();
    if (!session || (session.user as { role?: string }).role !== 'admin') {
        notFound();
    }

    return (
        <div className="p-8">
            <ImportedCJReviewClient />
        </div>
    );
}
