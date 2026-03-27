'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  User,
  Users,
  MoreVertical,
  Filter,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FormPendudukUnified } from './form-penduduk-unified';
import { 
  Skeleton, 
  StatsCardsSkeleton, 
  TableSkeleton,
  TableRowSkeleton,
  PaginationSkeleton 
} from '@/components/ui/loading-skeleton';
import { AuditLogTimeline } from '@/components/kependudukan/audit-log-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Penduduk {
  id: string;
  nik: string;
  namaLengkap: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string;
  agama: string;
  pekerjaan: string | null;
  pendidikan: string | null;
  statusPerkawinan: string;
  hubunganKeluarga: string | null;
  status: string;
  isActive: boolean;
  // Alamat dan wilayah dari KK
  alamat: string | null;
  rt: string;
  rw: string;
  dusun: string;
  kkId: string | null;
  nomorKK: string;
  noHP?: string;
  email?: string;
  foto: string | null;
  createdAt: string;
}

interface WilayahOption {
  id: string;
  label: string;
  dusunId: string;
}

interface KKOption {
  id: string;
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  jumlahAnggota: number;
}

const statusPerkawinanLabels: Record<string, string> = {
  BELUM_KAWIN: 'Belum Kawin',
  KAWIN_TERCATAT: 'Kawin Tercatat',
  KAWIN_TIDAK_TERCATAT: 'Kawin Tidak Tercatat',
  CERAI_HIDUP_TERCATAT: 'Cerai Hidup Tercatat',
  CERAI_HIDUP_TIDAK_TERCATAT: 'Cerai Hidup Tidak Tercatat',
  CERAI_MATI: 'Cerai Mati',
};

export function DataPenduduk() {
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenisKelamin, setFilterJenisKelamin] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Wilayah & KK options
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [kkOptions, setKKOptions] = useState<KKOption[]>([]);

  // View mode: 'list' | 'formBaru' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'formBaru' | 'edit'>('list');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingPenduduk, setEditingPenduduk] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPenduduk, setSelectedPenduduk] = useState<Penduduk | null>(null);
  const [detailData, setDetailData] = useState<any>(null);

  // Fetch wilayah options
  const fetchWilayah = useCallback(async () => {
    try {
      const response = await fetch('/api/wilayah');
      const data = await response.json();

      if (data.success) {
        const combinedOptions: WilayahOption[] = [];
        
        data.data.dusun.forEach((dusun: any) => {
          dusun.rwList.forEach((rw: any) => {
            rw.rtList.forEach((rt: any) => {
              combinedOptions.push({
                id: rt.id,
                label: `${dusun.nama} - RW ${rw.nomor} - RT ${rt.nomor}`,
                dusunId: dusun.id,
              });
            });
          });
        });

        combinedOptions.sort((a, b) => a.label.localeCompare(b.label));
        setWilayahOptions(combinedOptions);
      }
    } catch (error) {
      console.error('Error fetching wilayah:', error);
    }
  }, []);

  // Fetch KK options
  const fetchKK = useCallback(async () => {
    try {
      const response = await fetch('/api/kependudukan/kk?limit=1000');
      const data = await response.json();

      if (data.success) {
        const kkOpts: KKOption[] = data.data.map((kk: any) => ({
          id: kk.id,
          nomorKK: kk.nomorKK,
          kepalaKeluarga: kk.kepalaKeluarga,
          alamat: kk.alamat || '-',
          rt: kk.rt || '-',
          rw: kk.rw || '-',
          dusun: kk.dusun || '-',
          jumlahAnggota: kk.jumlahAnggota || 0,
        }));
        setKKOptions(kkOpts);
      }
    } catch (error) {
      console.error('Error fetching KK:', error);
    }
  }, []);

  // Fetch penduduk list
  const fetchPenduduk = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      if (filterJenisKelamin) params.append('jenisKelamin', filterJenisKelamin);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/kependudukan/penduduk?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPendudukList(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching Penduduk:', error);
      toast.error('Gagal mengambil data Penduduk');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterJenisKelamin, page]);

  useEffect(() => {
    fetchWilayah();
    fetchKK();
  }, [fetchWilayah, fetchKK]);

  useEffect(() => {
    fetchPenduduk();
  }, [fetchPenduduk]);

  // Open add form (new resident with KK option)
  const openAddForm = () => {
    setEditingPenduduk(null);
    setViewMode('formBaru');
  };

  // Open edit modal
  const openEditModal = (penduduk: Penduduk) => {
    setEditingPenduduk(penduduk);
    setViewMode('edit');
  };

  // Submit form for edit
  const handleEditSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const url = `/api/kependudukan/penduduk/${editingPenduduk.id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Penduduk berhasil diupdate');
        setViewMode('list');
        setEditingPenduduk(null);
        fetchPenduduk();
        fetchKK();
      } else {
        toast.error(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit new resident (with possible new KK)
  const handleNewPendudukSubmit = async (data: any, kkBaru?: { nomorKK: string; alamat: string; rtId: string; dusunId: string } | null) => {
    setSubmitting(true);
    try {
      let kkId = data.kkId;
      
      // If creating new KK
      if (kkBaru) {
        const kkResponse = await fetch('/api/kependudukan/kk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomorKK: kkBaru.nomorKK,
            alamat: kkBaru.alamat,
            rtId: kkBaru.rtId,
            dusunId: kkBaru.dusunId,
            jenisTempatTinggal: 'MILIK_SENDIRI',
          }),
        });
        
        const kkResult = await kkResponse.json();
        
        if (!kkResult.success) {
          toast.error(kkResult.error || 'Gagal membuat KK baru');
          return;
        }
        
        kkId = kkResult.data.id;
      }
      
      // Create penduduk
      const response = await fetch('/api/kependudukan/penduduk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          kkId,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Penduduk berhasil ditambahkan');
        setViewMode('list');
        fetchPenduduk();
        fetchKK();
      } else {
        toast.error(result.error || 'Gagal menambahkan penduduk');
      }
    } catch (error) {
      console.error('Error submitting penduduk baru:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Penduduk
  const handleDelete = async () => {
    if (!selectedPenduduk) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/kependudukan/penduduk/${selectedPenduduk.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Penduduk berhasil dihapus');
        setShowDeleteConfirm(false);
        setSelectedPenduduk(null);
        fetchPenduduk();
      } else {
        toast.error(data.error || 'Gagal menghapus Penduduk');
      }
    } catch (error) {
      console.error('Error deleting Penduduk:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // View detail
  const handleViewDetail = async (penduduk: Penduduk) => {
    try {
      const response = await fetch(`/api/kependudukan/penduduk/${penduduk.id}`);
      const data = await response.json();

      if (data.success) {
        setDetailData(data.data);
        setShowDetail(true);
      } else {
        toast.error('Gagal mengambil detail Penduduk');
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      toast.info('Mengunduh data penduduk...');

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      params.append('limit', '10000');

      const response = await fetch(`/api/kependudukan/penduduk?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const pendudukData = data.data;

        const headers = ['No', 'NIK', 'Nama Lengkap', 'JK', 'Tempat Lahir', 'Tgl Lahir', 'Agama', 'Pekerjaan', 'Pendidikan', 'Status Kawin', 'Alamat', 'RT/RW', 'Dusun', 'No HP', 'Status'];
        const rows = pendudukData.map((p: Penduduk, index: number) => [
          index + 1,
          `'${p.nik}`,
          p.namaLengkap,
          p.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P',
          p.tempatLahir || '-',
          p.tanggalLahir ? new Date(p.tanggalLahir).toLocaleDateString('id-ID') : '-',
          p.agama,
          p.pekerjaan || '-',
          p.pendidikan || '-',
          statusPerkawinanLabels[p.statusPerkawinan] || p.statusPerkawinan,
          p.alamat || '-',
          `RT ${p.rt}/RW ${p.rw}`,
          p.dusun,
          p.noHP || '-',
          p.status
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row: string[]) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `data_penduduk_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Data penduduk berhasil diunduh');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Gagal mengunduh data');
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      TETAP: { color: 'bg-emerald-100 text-emerald-700', label: 'Tetap' },
      PENDATANG: { color: 'bg-blue-100 text-blue-700', label: 'Pendatang' },
      PINDAH: { color: 'bg-amber-100 text-amber-700', label: 'Pindah' },
      MENINGGAL: { color: 'bg-gray-100 text-gray-700', label: 'Meninggal' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Get full name
  const getFullName = (p: Penduduk) => {
    return p.namaLengkap;
  };

  // Show form penduduk baru
  if (viewMode === 'formBaru') {
    return (
      <FormPendudukUnified
        mode="penduduk-baru"
        layout="full-page"
        wilayahOptions={wilayahOptions}
        kkOptions={kkOptions}
        onBack={() => setViewMode('list')}
        onSubmit={handleNewPendudukSubmit}
      />
    );
  }

  // Show edit form
  if (viewMode === 'edit' && editingPenduduk) {
    return (
      <FormPendudukUnified
        mode="edit"
        layout="full-page"
        editingPenduduk={editingPenduduk}
        wilayahOptions={wilayahOptions}
        kkOptions={kkOptions}
        onBack={() => {
          setViewMode('list');
          setEditingPenduduk(null);
        }}
        onSubmit={async (data) => {
          await handleEditSubmit(data);
        }}
        loading={submitting}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Penduduk</h2>
          <p className="text-gray-500 mt-1">Kelola data penduduk di desa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-gray-300"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={openAddForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Penduduk
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          <StatsCardsSkeleton />
        ) : (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Penduduk</p>
                    <p className="text-xl font-bold text-gray-900">{total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Laki-laki</p>
                    <p className="text-xl font-bold text-gray-900">
                      {pendudukList.filter(p => p.jenisKelamin === 'LAKI_LAKI').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-lg">
                    <User className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Perempuan</p>
                    <p className="text-xl font-bold text-gray-900">
                      {pendudukList.filter(p => p.jenisKelamin === 'PEREMPUAN').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Filter className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-xl font-bold text-gray-900">
                      {new Set(pendudukList.map(p => p.status)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari NIK atau nama..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value === 'all' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="TETAP">Tetap</SelectItem>
                <SelectItem value="PENDATANG">Pendatang</SelectItem>
                <SelectItem value="PINDAH">Pindah</SelectItem>
                <SelectItem value="MENINGGAL">Meninggal</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterJenisKelamin}
              onValueChange={(value) => {
                setFilterJenisKelamin(value === 'all' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Semua JK" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua JK</SelectItem>
                <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    NIK
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    JK
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tempat/Tgl Lahir
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Agama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pekerjaan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-5 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pendudukList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-10 h-10 text-gray-300" />
                        <span className="text-gray-500">Tidak ada data penduduk</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendudukList.map((penduduk, index) => (
                    <motion.tr
                      key={penduduk.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm text-gray-900">{penduduk.nik}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {penduduk.namaLengkap.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{getFullName(penduduk)}</p>
                            <p className="text-xs text-gray-500">
                              RT {penduduk.rt}/RW {penduduk.rw} - {penduduk.dusun}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={penduduk.jenisKelamin === 'LAKI_LAKI' ? 'border-blue-300 text-blue-700' : 'border-pink-300 text-pink-700'}>
                          {penduduk.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {penduduk.tempatLahir || '-'}, {formatDate(penduduk.tanggalLahir)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{penduduk.agama}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{penduduk.pekerjaan || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(penduduk.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(penduduk)}
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(penduduk)}
                            className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:bg-gray-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPenduduk(penduduk);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Menampilkan {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} dari {total} data
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-8 h-8 p-0',
                          page === pageNum && 'bg-emerald-600 hover:bg-emerald-700'
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Penduduk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedPenduduk?.namaLengkap}? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Penduduk</DialogTitle>
          </DialogHeader>
          {detailData && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informasi</TabsTrigger>
                <TabsTrigger value="riwayat" className="gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Riwayat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-medium">
                        {detailData.namaLengkap?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {detailData.namaLengkap}
                      </h3>
                      <p className="text-gray-500">NIK: {detailData.nik}</p>
                      {getStatusBadge(detailData.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tempat/Tanggal Lahir</p>
                      <p className="font-medium">
                        {detailData.tempatLahir || '-'}, {formatDate(detailData.tanggalLahir)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jenis Kelamin</p>
                      <p className="font-medium">
                        {detailData.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Agama</p>
                      <p className="font-medium">{detailData.agama}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status Perkawinan</p>
                      <p className="font-medium">
                        {statusPerkawinanLabels[detailData.statusPerkawinan] || detailData.statusPerkawinan}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pekerjaan</p>
                      <p className="font-medium">{detailData.pekerjaan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pendidikan</p>
                      <p className="font-medium">{detailData.pendidikan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="font-medium">{detailData.alamat || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RT/RW/Dusun</p>
                      <p className="font-medium">
                        RT {detailData.rt} / RW {detailData.rw} - {detailData.dusun}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hubungan Keluarga</p>
                      <p className="font-medium">{detailData.hubunganKeluarga || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">No. KK</p>
                      <p className="font-mono font-medium">{detailData.kk?.nomorKK || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">No. HP</p>
                      <p className="font-medium">{detailData.noHP || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{detailData.email || '-'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="riwayat" className="mt-4">
                <AuditLogTimeline
                  pendudukId={detailData.id}
                  title="Riwayat Perubahan Data Penduduk"
                  maxHeight="400px"
                  showFilters={true}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
