'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Home, 
  UserPlus, 
  HeartCrack, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Download,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

interface StatistikData {
  totalPenduduk: number;
  totalKK: number;
  pendatang: number;
  kematian: number;
  kelahiran: number;
  pindah: number;
}

interface DashboardContentProps {
  statistik: StatistikData;
}

// Sample data for charts
const monthlyData = [
  { bulan: 'Jan', penduduk: 5420, kelahiran: 12, kematian: 5 },
  { bulan: 'Feb', penduduk: 5435, kelahiran: 15, kematian: 8 },
  { bulan: 'Mar', penduduk: 5448, kelahiran: 18, kematian: 6 },
  { bulan: 'Apr', penduduk: 5460, kelahiran: 10, kematian: 7 },
  { bulan: 'Mei', penduduk: 5472, kelahiran: 14, kematian: 4 },
  { bulan: 'Jun', penduduk: 5485, kelahiran: 20, kematian: 9 },
];

const genderData = [
  { name: 'Laki-laki', value: 2750, color: '#10b981' },
  { name: 'Perempuan', value: 2735, color: '#f59e0b' },
];

const ageGroupData = [
  { kelompok: '0-17', jumlah: 1850 },
  { kelompok: '18-35', jumlah: 1650 },
  { kelompok: '36-50', jumlah: 1120 },
  { kelompok: '51-65', jumlah: 620 },
  { kelompok: '65+', jumlah: 245 },
];

const recentActivities = [
  { id: 1, user: 'Admin Desa', aksi: 'Menambah data penduduk baru', waktu: '5 menit lalu', modul: 'Kependudukan' },
  { id: 2, user: 'Operator', aksi: 'Mencetak surat keterangan', waktu: '15 menit lalu', modul: 'Surat' },
  { id: 3, user: 'Super Admin', aksi: 'Login ke sistem', waktu: '1 jam lalu', modul: 'Auth' },
  { id: 4, user: 'Admin Desa', aksi: 'Update data KK', waktu: '2 jam lalu', modul: 'Kependudukan' },
  { id: 5, user: 'Operator', aksi: 'Export laporan penduduk', waktu: '3 jam lalu', modul: 'Laporan' },
];

export function DashboardContent({ statistik }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      title: 'Total Penduduk',
      value: statistik.totalPenduduk,
      icon: Users,
      trend: '+2.3%',
      trendUp: true,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total KK',
      value: statistik.totalKK,
      icon: Home,
      trend: '+1.5%',
      trendUp: true,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Pendatang',
      value: statistik.pendatang,
      icon: UserPlus,
      trend: '+5.2%',
      trendUp: true,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Kematian',
      value: statistik.kematian,
      icon: HeartCrack,
      trend: '-1.2%',
      trendUp: false,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={cn('p-3 rounded-xl', stat.bgColor)}>
                      <Icon className={cn('w-5 h-5', stat.textColor)} />
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      stat.trendUp ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {stat.trend}
                      {stat.trendUp ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {stat.value.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Population Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Tren Penduduk
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="bulan" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="penduduk" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                      name="Total Penduduk"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="kelahiran" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      name="Kelahiran"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="kematian" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2 }}
                      name="Kematian"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Distribusi Jenis Kelamin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {genderData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.value.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Age Group & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Group Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Kelompok Usia
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroupData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="kelompok" stroke="#9ca3af" fontSize={12} width={60} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="jumlah" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Aktivitas Terbaru
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                Lihat Semua
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600">
                        {activity.user.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.aksi}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.waktu}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {activity.modul}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">Tambah Penduduk</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 hover:border-blue-300 hover:bg-blue-50"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Buat Surat</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 hover:border-amber-300 hover:bg-amber-50"
              >
                <Download className="w-5 h-5 text-amber-600" />
                <span className="text-sm">Export Data</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 hover:border-purple-300 hover:bg-purple-50"
              >
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm">Lihat Laporan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
