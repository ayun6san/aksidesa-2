'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { DashboardContent } from './dashboard-content';
import { UserManagement } from './user-management';
import { WilayahManagement } from './wilayah-management';
import { PengaturanDesa } from './pengaturan-desa';
import { DataKK } from '@/components/kependudukan/data-kk';
import { DataPenduduk } from '@/components/kependudukan/data-penduduk';
import { PendatangSementara } from '@/components/kependudukan/pendatang-sementara';
import { PeristiwaKependudukan } from '@/components/kependudukan/peristiwa-kependudukan';
import { MonitoringData } from '@/components/kependudukan/monitoring-data';
import { cn } from '@/lib/utils';

interface CurrentUser {
  id: string;
  namaLengkap: string;
  username: string;
  email: string;
  role: string;
}

interface DesaData {
  id: string;
  namaDesa: string;
  logo: string | null;
  kecamatan: string;
  kabupaten: string;
}

interface DashboardLayoutProps {
  user: CurrentUser;
  onLogout: () => void;
}

interface Notification {
  id: string;
  judul: string;
  pesan: string;
  tipe: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

// Sample notifications - in real app, this would come from API
const sampleNotifications: Notification[] = [
  {
    id: '1',
    judul: 'Penduduk Baru',
    pesan: 'Data penduduk baru dengan NIK 3201234567890001 berhasil ditambahkan',
    tipe: 'SUCCESS',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '2',
    judul: 'Surat Baru',
    pesan: 'Ada permintaan surat keterangan baru dari warga',
    tipe: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: '3',
    judul: 'Perhatian',
    pesan: 'Sistem akan maintenance pada tanggal 25 Desember 2024',
    tipe: 'WARNING',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [desa, setDesa] = useState<DesaData | null>(null);
  const [statistik, setStatistik] = useState({
    totalPenduduk: 5485,
    totalKK: 1523,
    pendatang: 45,
    kematian: 12,
    kelahiran: 28,
    pindah: 8,
  });
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Handle logout function - defined first
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  }, [onLogout]);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT);
  }, [handleLogout]);

  // Auto logout on idle
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [resetIdleTimer]);

  // Fetch statistics and desa data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch statistik
        const statResponse = await fetch('/api/dashboard/statistik');
        if (statResponse.ok) {
          const statData = await statResponse.json();
          setStatistik(statData);
        }

        // Fetch desa data
        const desaResponse = await fetch('/api/desa');
        if (desaResponse.ok) {
          const desaData = await desaResponse.json();
          if (desaData.success) {
            setDesa(desaData.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const handleMarkNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardContent statistik={statistik} />;
      
      case 'master-data':
        return <WilayahManagement />;
      
      case 'kependudukan':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kependudukan</h2>
            <p className="text-gray-600">Silakan pilih sub menu Kependudukan di sidebar...</p>
          </div>
        );
      
      case 'data-kk':
        return <DataKK />;
      
      case 'data-penduduk':
        return <DataPenduduk />;
      
      case 'pendatang-sementara':
        return <PendatangSementara />;
      
      case 'peristiwa-kependudukan':
        return <PeristiwaKependudukan />;
      
      case 'monitoring-data':
        return <MonitoringData />;
      
      case 'bansos':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bansos</h2>
            <p className="text-gray-600">Halaman Bantuan Sosial dalam pengembangan...</p>
          </div>
        );
      
      case 'dhkp-pbb':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">DHKP PBB</h2>
            <p className="text-gray-600">Halaman DHKP PBB dalam pengembangan...</p>
          </div>
        );
      
      case 'gis':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">GIS</h2>
            <p className="text-gray-600">Halaman GIS dalam pengembangan...</p>
          </div>
        );
      
      case 'user':
        return <UserManagement />;
      
      case 'pengaturan':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pengaturan</h2>
            <p className="text-gray-600">Silakan pilih sub menu pengaturan di sidebar...</p>
          </div>
        );
      
      case 'pengaturan-desa':
        return <PengaturanDesa />;
      
      case 'pengaturan-aplikasi':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pengaturan Aplikasi</h2>
            <p className="text-gray-600">Halaman pengaturan aplikasi dalam pengembangan...</p>
          </div>
        );
      
      case 'laporan':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Laporan</h2>
            <p className="text-gray-600">Halaman laporan dalam pengembangan...</p>
          </div>
        );
      
      case 'log-aktivitas':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Log Aktivitas</h2>
            <p className="text-gray-600">Halaman log aktivitas dalam pengembangan...</p>
          </div>
        );
      
      default:
        return <DashboardContent statistik={statistik} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        onLogout={handleLogout}
        userName={user.namaLengkap}
        userRole={user.role}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        desaName={desa?.namaDesa}
        desaLogo={desa?.logo}
      />

      {/* Main Content Area - responsive to sidebar state */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        {/* Header */}
        <Header
          userName={user.namaLengkap}
          userRole={user.role}
          notifications={notifications}
          onLogout={handleLogout}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        />

        {/* Page Content */}
        <main className="flex-1">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </main>

        {/* Footer - sticky to bottom */}
        <footer className="mt-auto bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2024 AKSIDESA - Sistem Informasi Digital Desa</p>
            <p>Versi 1.0.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
