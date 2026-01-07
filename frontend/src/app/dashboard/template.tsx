'use client';

import React from 'react';

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    // Note: Background orbs were moved to layout.tsx to allow persistent movement transitions.
    // This template handles only the page content fade-in.
    return (
        <div className="animate-fade-in relative z-10 w-full h-full">
            {children}
        </div>
    );
}
