'use client';

import { useEffect, useState } from 'react';
import { authApi } from '../lib/api';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { CrewDashboard } from '../../components/dashboard/CrewDashboard';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando painel...</div>
      </div>
    );
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // Default to CrewDashboard for non-admins (safe default)
  return <CrewDashboard />;
}
