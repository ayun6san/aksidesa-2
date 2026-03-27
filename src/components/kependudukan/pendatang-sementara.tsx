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
  UserCheck,
  MapPin,
  Calendar,
  MoreVertical,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Skeleton, StatsCardsSkeleton } from '@/components/ui/loading-skeleton';

interface Pendatang {
  id: string;
  nik: string | null;
  namaLengkap: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string;
  pekerjaan: string | null;
  alamatAsal: string;
  tujuanKedatangan: string;
  noTelp: string | null;
  alamat: string | null;
  rt: string;
  rw: string;
  dusun: string;
  rtId: string | null;
  dusunId: string | null;
  tanggalDatang: string | null;
  tanggalPulang: string | null;
  lamaTinggal: string | null;
  isActive: boolean;
  keterangan: string | null;
  foto: string | null;
  createdAt: string;
}

interface PendatangFormData {
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  pekerjaan: string;
  alamatAsal: string;
  tujuanKedatangan: string;
  noTelp: string;
  alamat: string;
  rtId: string;
  dusunId: string;
  tanggalDatang: string;
  tanggalPulang: string;
  lamaTinggal: string;
  keterangan: string;
}

const initialFormData: PendatangFormData = {
  nik: '',
  namaLengkap: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'LAKI_LAKI',
  pekerjaan: '',
  alamatAsal: '',
  tujuanKedatangan: '',
  noTelp: '',
  alamat: '',
  rtId: '',
  dusunId: '',
  tanggalDatang: new Date().toISOString().split('T')[0],
  tanggalPulang: '',
  lamaTinggal: '',
  keterangan: '',
};

export function PendatangSementara() {
  const [pendatangList, setPendatangList] = useState<Pendatang[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingPendatang, setEditingPendatang] = useState<Pendatang | null>(null);
  const [formData, setFormData] = useState<PendatangFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<PendatangFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedPendatang, setSelectedPendatang] = useState<Pendatang | null>(null);
  const [detailData, setDetailData] = useState<Pendatang | null>(null);

  // Fetch pendatang list
  const fetchPendatang = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/kependudukan/pendatang?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPendatangList(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching Pendatang:', error);
      toast.error('Gagal mengambil data Pendatang');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, page]);

  useEffect(() => {
    fetchPendatang();
  }, [fetchPendatang]);

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setEditingPendatang(null);
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowForm(true);
  };

  // Open edit modal
  const openEditModal = (pendatang: Pendatang) => {
    setEditingPendatang(pendatang);
    setFormData({
      nik: pendatang.nik || '',
      namaLengkap: pendatang.namaLengkap,
      tempatLahir: pendatang.tempatLahir || '',
      tanggalLahir: pendatang.tanggalLahir ? pendatang.tanggalLahir.split('T')[0] : '',
      jenisKelamin: pendatang.jenisKelamin,
      pekerjaan: pendatang.pekerjaan || '',
      alamatAsal: pendatang.alamatAsal,
      tujuanKedatangan: pendatang.tujuanKedatangan,
      noTelp: pendatang.noTelp || '',
      alamat: pendatang.alamat || '',
      rtId: pendatang.rtId || '',
      dusunId: pendatang.dusunId || '',
      tanggalDatang: pendatang.tanggalDatang ? pendatang.tanggalDatang.split('T')[0] : '',
      tanggalPulang: pendatang.tanggalPulang ? pendatang.tanggalPulang.split('T')[0] : '',
      lamaTinggal: pendatang.lamaTinggal || '',
      keterangan: pendatang.keterangan || '',
    });
    setShowForm(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<PendatangFormData> = {};

    if (!formData.namaLengkap.trim()) {
      errors.namaLengkap = 'Nama lengkap wajib diisi';
    }
    if (!formData.alamatAsal.trim()) {
      errors.alamatAsal = 'Alamat asal wajib diisi';
    }
    if (!formData.tujuanKedatangan.trim()) {
      errors.tujuanKedatangan = 'Tujuan kedatangan wajib diisi';
    }
    if (!formData.jenisKelamin) {
      errors.jenisKelamin = 'Jenis kelamin wajib dipilih';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = editingPendatang 
        ? `/api/kependudukan/pendatang/${editingPendatang.id}` 
        : '/api/kependudukan/pendatang';
      const method = editingPendatang ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingPendatang ? 'Pendatang berhasil diupdate' : 'Pendatang berhasil ditambahkan');
        setShowForm(false);
        resetForm();
        fetchPendatang();
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

  // Delete Pendatang
  const handleDelete = async () => {
    if (!selectedPendatang) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/kependudukan/pendatang/${selectedPendatang.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pendatang berhasil dihapus');
        setShowDeleteConfirm(false);
        setSelectedPendatang(null);
        fetchPendatang();
      } else {
        toast.error(data.error || 'Gagal menghapus Pendatang');
      }
    } catch (error) {
      console.error('Error deleting Pendatang:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // View detail
  const handleViewDetail = async (pendatang: Pendatang) => {
    try {
      const response = await fetch(`/api/kependudukan/pendatang/${pendatang.id}`);
      const data = await response.json();

      if (data.success) {
        setDetailData(data.data);
        setShowDetail(true);
      } else {
        toast.error('Gagal mengambil detail Pendatang');
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pendatang Sementara</h2>
          <p className="text-gray-500 mt-1">Kelola data pendatang sementara di desa</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pendatang
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pendatang</p>
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
                    <p className="text-sm text-gray-500">Aktif</p>
                    <p className="text-xl font-bold text-gray-900">
                      {pendatangList.filter(p => p.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sudah Pulang</p>
                    <p className="text-xl font-bold text-gray-900">
                      {pendatangList.filter(p => !p.isActive).length}
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
                placeholder="Cari nama atau alamat asal..."
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
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Sudah Pulang</SelectItem>
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
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Alamat Asal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tujuan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tanggal Datang
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
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
                ) : pendatangList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <UserCheck className="w-10 h-10 text-gray-300" />
                        <span className="text-gray-500">Tidak ada data pendatang</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendatangList.map((pendatang, index) => (
                    <motion.tr
                      key={pendatang.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {pendatang.namaLengkap.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{pendatang.namaLengkap}</p>
                            <p className="text-xs text-gray-500">
                              {pendatang.nik || 'NIK tidak tersedia'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{pendatang.alamatAsal}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{pendatang.tujuanKedatangan}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(pendatang.tanggalDatang)}</p>
                        {pendatang.tanggalPulang && (
                          <p className="text-xs text-gray-400">Pulang: {formatDate(pendatang.tanggalPulang)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={pendatang.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                          {pendatang.isActive ? 'Aktif' : 'Sudah Pulang'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(pendatang)}
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(pendatang)}
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
                                  setSelectedPendatang(pendatang);
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

      {/* Add/Edit Pendatang Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPendatang ? 'Edit Pendatang' : 'Tambah Pendatang Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) =>
                    setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })
                  }
                  placeholder="16 digit NIK (opsional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaLengkap">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  placeholder="Nama lengkap"
                  className={formErrors.namaLengkap ? 'border-red-500' : ''}
                />
                {formErrors.namaLengkap && (
                  <p className="text-sm text-red-500">{formErrors.namaLengkap}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.jenisKelamin}
                  onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pekerjaan">Pekerjaan</Label>
                <Input
                  id="pekerjaan"
                  value={formData.pekerjaan}
                  onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                  placeholder="Pekerjaan"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="alamatAsal">
                  Alamat Asal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="alamatAsal"
                  value={formData.alamatAsal}
                  onChange={(e) => setFormData({ ...formData, alamatAsal: e.target.value })}
                  placeholder="Alamat asal lengkap"
                  className={formErrors.alamatAsal ? 'border-red-500' : ''}
                />
                {formErrors.alamatAsal && (
                  <p className="text-sm text-red-500">{formErrors.alamatAsal}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="tujuanKedatangan">
                  Tujuan Kedatangan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tujuanKedatangan"
                  value={formData.tujuanKedatangan}
                  onChange={(e) => setFormData({ ...formData, tujuanKedatangan: e.target.value })}
                  placeholder="Tujuan kedatangan"
                  className={formErrors.tujuanKedatangan ? 'border-red-500' : ''}
                />
                {formErrors.tujuanKedatangan && (
                  <p className="text-sm text-red-500">{formErrors.tujuanKedatangan}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggalDatang">Tanggal Datang</Label>
                <Input
                  id="tanggalDatang"
                  type="date"
                  value={formData.tanggalDatang}
                  onChange={(e) => setFormData({ ...formData, tanggalDatang: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggalPulang">Tanggal Pulang</Label>
                <Input
                  id="tanggalPulang"
                  type="date"
                  value={formData.tanggalPulang}
                  onChange={(e) => setFormData({ ...formData, tanggalPulang: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lamaTinggal">Lama Tinggal</Label>
                <Input
                  id="lamaTinggal"
                  value={formData.lamaTinggal}
                  onChange={(e) => setFormData({ ...formData, lamaTinggal: e.target.value })}
                  placeholder="Contoh: 2 bulan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noTelp">No. Telepon</Label>
                <Input
                  id="noTelp"
                  value={formData.noTelp}
                  onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="alamat">Alamat di Desa (Opsional)</Label>
                <Input
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Alamat di desa tempat tinggal"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Input
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Keterangan tambahan"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingPendatang ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pendatang</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedPendatang?.namaLengkap}? 
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pendatang</DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {detailData.namaLengkap.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{detailData.namaLengkap}</h3>
                  <p className="text-sm text-gray-500">{detailData.nik || 'NIK tidak tersedia'}</p>
                  <Badge className={detailData.isActive ? 'bg-emerald-100 text-emerald-700 mt-1' : 'bg-gray-100 text-gray-700 mt-1'}>
                    {detailData.isActive ? 'Aktif' : 'Sudah Pulang'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Jenis Kelamin</p>
                  <p className="font-medium">
                    {detailData.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pekerjaan</p>
                  <p className="font-medium">{detailData.pekerjaan || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Alamat Asal</p>
                  <p className="font-medium">{detailData.alamatAsal}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Tujuan Kedatangan</p>
                  <p className="font-medium">{detailData.tujuanKedatangan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Datang</p>
                  <p className="font-medium">{formatDate(detailData.tanggalDatang)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Pulang</p>
                  <p className="font-medium">{formatDate(detailData.tanggalPulang)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lama Tinggal</p>
                  <p className="font-medium">{detailData.lamaTinggal || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No. Telepon</p>
                  <p className="font-medium">{detailData.noTelp || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Lokasi di Desa</p>
                  <p className="font-medium">
                    {detailData.alamat && `${detailData.alamat}, `}
                    RT {detailData.rt}/RW {detailData.rw} - {detailData.dusun}
                  </p>
                </div>
                {detailData.keterangan && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Keterangan</p>
                    <p className="font-medium">{detailData.keterangan}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
