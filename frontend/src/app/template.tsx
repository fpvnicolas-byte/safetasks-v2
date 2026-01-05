'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function RootTemplate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // If we are inside the dashboard, we don't apply the animation here
    // because dashboard has its own internal template to isolate the sidebar.
    if (pathname?.startsWith('/dashboard')) {
        return <>{children}</>;
    }

    return (
        <div className="animate-fade-in">
            {children}
        </div>
    );
}
