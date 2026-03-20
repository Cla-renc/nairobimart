export default function Loading() {
    return (
        <div className="space-y-12 pb-12">
            {/* Hero Skeleton */}
            <div className="relative h-[500px] w-full bg-muted animate-pulse rounded-3xl" />

            {/* Categories Skeleton */}
            <div className="container px-4 space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            </div>

            {/* Featured Products Skeleton */}
            <div className="container px-4 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
                    <div className="h-6 w-24 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map((i) => (
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
    );
}
