// Loading state IDÊNTICO ao layout real do AdminDashboard.tsx
export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-8">
            {/* Section 1: KPIs - 10 Cards Grid - IGUAL AO LAYOUT REAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div
                        key={i}
                        className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                            <div className="h-5 w-5 bg-slate-800 rounded-full animate-pulse" />
                        </div>
                        {/* Main Value */}
                        <div className="h-8 w-24 bg-slate-800 rounded animate-pulse mb-2" />
                        {/* Trend */}
                        <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Section 2: Charts - IGUAL AO LAYOUT REAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Main Chart (spans 2 cols) */}
                <div className="lg:col-span-2 bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                    <div className="h-6 w-48 bg-slate-800 rounded animate-pulse mb-6" />
                    <div className="h-[350px] w-full bg-slate-900/50 rounded animate-pulse" />
                </div>

                {/* Right: Top Clients */}
                <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                    <div className="h-6 w-32 bg-slate-800 rounded animate-pulse mb-6" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-slate-800 rounded-full animate-pulse" />
                                    <div className="h-4 w-28 bg-slate-800 rounded animate-pulse" />
                                </div>
                                <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 3: Table - Full width */}
            <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="h-6 w-40 bg-slate-800 rounded animate-pulse mb-6" />
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
                                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
