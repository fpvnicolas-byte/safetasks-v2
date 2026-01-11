'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { CrewDashboard } from '../../components/dashboard/CrewDashboard';
import { Skeleton } from '../../components/ui/skeleton';

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setRole(user.role);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        
        {/* Chart Skeleton */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // Default to CrewDashboard for non-admins (safe default)
  return <CrewDashboard />;
}
