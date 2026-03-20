export default function Loading() {
    return (
        <div className="container px-4 py-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Skeleton */}
                <div className="w-full md:w-64 space-y-8">
                    <div className="space-y-4">
                        <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-4 w-full bg-muted animate-pulse rounded-sm" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
                        <div className="h-8 w-full bg-muted animate-pulse rounded-md" />
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="flex-1 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-48 bg-muted animate-pulse rounded-sm" />
                        <div className="h-10 w-40 bg-muted animate-pulse rounded-md" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />
                                <div className="space-y-2">
                                    <div className="h-4 w-2/3 bg-muted animate-pulse rounded-sm" />
                                    <div className="h-6 w-1/3 bg-muted animate-pulse rounded-sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
