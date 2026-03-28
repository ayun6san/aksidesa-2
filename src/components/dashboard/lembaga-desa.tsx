'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  User,
  Building2,
  Loader2,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  List,
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
interface PerangkatDesa {
  id: string;
  nip: string | null;
  nipd: string | null;
  namaLengkap: string;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  agama: string;
  pendidikanTerakhir: string | null;
  jabatan: string;
  jabatanLainnya: string | null;
  masaJabatanMulai: Date | null;
  masaJabatanSelesai: Date | null;
  skPengangkatan: string | null;
  tanggalSk: Date | null;
  alamat: string | null;
  noHp: string | null;
  email: string | null;
  foto: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BPD {
  id: string;
  namaLengkap: string;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  agama: string;
  pendidikanTerakhir: string | null;
  pekerjaan: string | null;
  jabatan: string;
  periodeMulai: Date | null;
  periodeSelesai: Date | null;
  skPengangkatan: string | null;
  tanggalSk: Date | null;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  dusun: string | null;
  noHp: string | null;
  email: string | null;
  foto: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Jabatan options
const jabatanPerangkatOptions = [
  { value: 'KEPALA_DESA', label: 'Kepala Desa' },
  { value: 'SEKRETARIS_DESA', label: 'Sekretaris Desa' },
  { value: 'KAUR_TATA_USAHA', label: 'Kaur Tata Usaha' },
  { value: 'KAUR_KEUANGAN', label: 'Kaur Keuangan' },
  { value: 'KAUR_PERENCANAAN', label: 'Kaur Perencanaan' },
  { value: 'KASI_PEMERINTAHAN', label: 'Kasi Pemerintahan' },
  { value: 'KASI_KERAHAYAAN', label: 'Kasi Kesejahteraan' },
  { value: 'KASI_PELAYANAN', label: 'Kasi Pelayanan' },
  { value: 'KEPALA_DUSUN', label: 'Kepala Dusun' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const jabatanBPDOptions = [
  { value: 'Ketua', label: 'Ketua' },
  { value: 'Wakil Ketua', label: 'Wakil Ketua' },
  { value: 'Sekretaris', label: 'Sekretaris' },
  { value: 'Bendahara', label: 'Bendahara' },
  { value: 'Anggota', label: 'Anggota' },
];

const agamaOptions = [
  { value: 'ISLAM', label: 'Islam' },
  { value: 'KRISTEN', label: 'Kristen' },
  { value: 'KATOLIK', label: 'Katolik' },
  { value: 'HINDU', label: 'Hindu' },
  { value: 'BUDDHA', label: 'Buddha' },
  { value: 'KONGHUCU', label: 'Konghucu' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export function LembagaDesa() {
  const [activeTab, setActiveTab] = useState('perangkat');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [perangkatList, setPerangkatList] = useState<PerangkatDesa[]>([]);
  const [bpdList, setBpdList] = useState<BPD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showPerangkatDialog, setShowPerangkatDialog] = useState(false);
  const [showBpdDialog, setShowBpdDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PerangkatDesa | BPD | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; type: 'perangkat' | 'bpd' } | null>(null);

  // Form states for Perangkat Desa
  const [perangkatForm, setPerangkatForm] = useState({
    jenisIdentitas: 'NONE' as 'NIP' | 'NIPD' | 'NONE',
    nomorIdentitas: '',
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'LAKI_LAKI' as 'LAKI_LAKI' | 'PEREMPUAN',
    agama: 'ISLAM',
    pendidikanTerakhir: '',
    jabatan: 'KAUR_TATA_USAHA',
    jabatanLainnya: '',
    masaJabatanMulai: '',
    masaJabatanSelesai: '',
    skPengangkatan: '',
    tanggalSk: '',
    alamat: '',
    noHp: '',
    email: '',
    foto: '',
    isActive: true
  });

  // Form states for BPD
  const [bpdForm, setBpdForm] = useState({
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'LAKI_LAKI' as 'LAKI_LAKI' | 'PEREMPUAN',
    agama: 'ISLAM',
    pendidikanTerakhir: '',
    pekerjaan: '',
    jabatan: 'Anggota',
    periodeMulai: '',
    periodeSelesai: '',
    skPengangkatan: '',
    tanggalSk: '',
    alamat: '',
    rt: '',
    rw: '',
    dusun: '',
    noHp: '',
    email: '',
    foto: '',
    isActive: true
  });

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [perangkatRes, bpdRes] = await Promise.all([
        fetch('/api/lembaga-desa/perangkat'),
        fetch('/api/lembaga-desa/bpd')
      ]);

      if (perangkatRes.ok) {
        const perangkatData = await perangkatRes.json();
        setPerangkatList(perangkatData.data || []);
      }

      if (bpdRes.ok) {
        const bpdData = await bpdRes.json();
        setBpdList(bpdData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset forms
  const resetPerangkatForm = () => {
    setPerangkatForm({
      jenisIdentitas: 'NONE',
      nomorIdentitas: '',
      namaLengkap: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'LAKI_LAKI',
      agama: 'ISLAM',
      pendidikanTerakhir: '',
      jabatan: 'KAUR_TATA_USAHA',
      jabatanLainnya: '',
      masaJabatanMulai: '',
      masaJabatanSelesai: '',
      skPengangkatan: '',
      tanggalSk: '',
      alamat: '',
      noHp: '',
      email: '',
      foto: '',
      isActive: true
    });
    setEditingItem(null);
  };

  const resetBpdForm = () => {
    setBpdForm({
      namaLengkap: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'LAKI_LAKI',
      agama: 'ISLAM',
      pendidikanTerakhir: '',
      pekerjaan: '',
      jabatan: 'Anggota',
      periodeMulai: '',
      periodeSelesai: '',
      skPengangkatan: '',
      tanggalSk: '',
      alamat: '',
      rt: '',
      rw: '',
      dusun: '',
      noHp: '',
      email: '',
      foto: '',
      isActive: true
    });
    setEditingItem(null);
  };

  // Save Perangkat Desa
  const handleSavePerangkat = async () => {
    if (!perangkatForm.namaLengkap) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }

    try {
      const url = editingItem 
        ? `/api/lembaga-desa/perangkat/${editingItem.id}`
        : '/api/lembaga-desa/perangkat';
      
      const method = editingItem ? 'PUT' : 'POST';

      const dataToSend = {
        ...perangkatForm,
        nip: perangkatForm.jenisIdentitas === 'NIP' ? perangkatForm.nomorIdentitas : null,
        nipd: perangkatForm.jenisIdentitas === 'NIPD' ? perangkatForm.nomorIdentitas : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
        setShowPerangkatDialog(false);
        resetPerangkatForm();
        fetchData();
      } else {
        toast.error(result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error saving Perangkat Desa:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  // Save BPD
  const handleSaveBpd = async () => {
    if (!bpdForm.namaLengkap) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }

    try {
      const url = editingItem 
        ? `/api/lembaga-desa/bpd/${editingItem.id}`
        : '/api/lembaga-desa/bpd';
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bpdForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
        setShowBpdDialog(false);
        resetBpdForm();
        fetchData();
      } else {
        toast.error(result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error saving BPD:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const url = deleteItem.type === 'perangkat'
        ? `/api/lembaga-desa/perangkat/${deleteItem.id}`
        : `/api/lembaga-desa/bpd/${deleteItem.id}`;

      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        toast.success('Data berhasil dihapus');
        fetchData();
      } else {
        toast.error(result.error || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Gagal menghapus data');
    } finally {
      setShowDeleteDialog(false);
      setDeleteItem(null);
    }
  };

  // Edit handlers
  const handleEditPerangkat = (item: PerangkatDesa) => {
    setEditingItem(item);
    let jenisIdentitas: 'NIP' | 'NIPD' | 'NONE' = 'NONE';
    let nomorIdentitas = '';
    if (item.nip) {
      jenisIdentitas = 'NIP';
      nomorIdentitas = item.nip;
    } else if (item.nipd) {
      jenisIdentitas = 'NIPD';
      nomorIdentitas = item.nipd;
    }
    setPerangkatForm({
      jenisIdentitas,
      nomorIdentitas,
      namaLengkap: item.namaLengkap,
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: item.tanggalLahir ? new Date(item.tanggalLahir).toISOString().split('T')[0] : '',
      jenisKelamin: item.jenisKelamin,
      agama: item.agama,
      pendidikanTerakhir: item.pendidikanTerakhir || '',
      jabatan: item.jabatan,
      jabatanLainnya: item.jabatanLainnya || '',
      masaJabatanMulai: item.masaJabatanMulai ? new Date(item.masaJabatanMulai).toISOString().split('T')[0] : '',
      masaJabatanSelesai: item.masaJabatanSelesai ? new Date(item.masaJabatanSelesai).toISOString().split('T')[0] : '',
      skPengangkatan: item.skPengangkatan || '',
      tanggalSk: item.tanggalSk ? new Date(item.tanggalSk).toISOString().split('T')[0] : '',
      alamat: item.alamat || '',
      noHp: item.noHp || '',
      email: item.email || '',
      foto: item.foto || '',
      isActive: item.isActive
    });
    setShowPerangkatDialog(true);
  };

  const handleEditBpd = (item: BPD) => {
    setEditingItem(item);
    setBpdForm({
      namaLengkap: item.namaLengkap,
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: item.tanggalLahir ? new Date(item.tanggalLahir).toISOString().split('T')[0] : '',
      jenisKelamin: item.jenisKelamin,
      agama: item.agama,
      pendidikanTerakhir: item.pendidikanTerakhir || '',
      pekerjaan: item.pekerjaan || '',
      jabatan: item.jabatan,
      periodeMulai: item.periodeMulai ? new Date(item.periodeMulai).toISOString().split('T')[0] : '',
      periodeSelesai: item.periodeSelesai ? new Date(item.periodeSelesai).toISOString().split('T')[0] : '',
      skPengangkatan: item.skPengangkatan || '',
      tanggalSk: item.tanggalSk ? new Date(item.tanggalSk).toISOString().split('T')[0] : '',
      alamat: item.alamat || '',
      rt: item.rt || '',
      rw: item.rw || '',
      dusun: item.dusun || '',
      noHp: item.noHp || '',
      email: item.email || '',
      foto: item.foto || '',
      isActive: item.isActive
    });
    setShowBpdDialog(true);
  };

  // Filter data
  const filteredPerangkat = perangkatList.filter(item =>
    item.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBpd = bpdList.filter(item =>
    item.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get jabatan label
  const getJabatanLabel = (jabatan: string) => {
    const found = jabatanPerangkatOptions.find(j => j.value === jabatan);
    return found ? found.label : jabatan;
  };

  // Reorder handlers
  const handleReorder = async (id: string, direction: 'up' | 'down', type: 'perangkat' | 'bpd') => {
    try {
      const url = type === 'perangkat'
        ? '/api/lembaga-desa/perangkat/reorder'
        : '/api/lembaga-desa/bpd/reorder';

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction })
      });

      const result = await response.json();

      if (result.success) {
        fetchData();
      } else {
        toast.error(result.error || 'Gagal mengubah urutan');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Gagal mengubah urutan');
    }
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-emerald-600" />
            Lembaga Desa
          </h1>
          <p className="text-gray-500 mt-1">Kelola data Perangkat Desa dan BPD</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-gray-50">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className={cn(
                "px-3",
                viewMode === 'card' && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                "px-3",
                viewMode === 'table' && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="perangkat" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Users className="w-4 h-4 mr-2" />
            Perangkat Desa
          </TabsTrigger>
          <TabsTrigger value="bpd" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Building2 className="w-4 h-4 mr-2" />
            BPD
          </TabsTrigger>
        </TabsList>

        {/* Perangkat Desa Tab */}
        <TabsContent value="perangkat" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Daftar Perangkat Desa</CardTitle>
              <Button 
                onClick={() => {
                  resetPerangkatForm();
                  setShowPerangkatDialog(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Perangkat
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filteredPerangkat.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada data Perangkat Desa</p>
                  <p className="text-sm mt-1">Klik tombol "Tambah Perangkat" untuk menambahkan data</p>
                </div>
              ) : viewMode === 'card' ? (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPerangkat.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "border hover:shadow-md transition-shadow cursor-pointer",
                        !item.isActive && "opacity-60"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.foto ? (
                                <img src={item.foto} alt={item.namaLengkap} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-8 h-8 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.namaLengkap}</h3>
                              <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                                {getJabatanLabel(item.jabatan)}
                              </Badge>
                              {item.nip && (
                                <p className="text-xs text-gray-500 mt-1">NIP: {item.nip}</p>
                              )}
                              {!item.nip && item.nipd && (
                                <p className="text-xs text-gray-500 mt-1">NIPD: {item.nipd}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {item.noHp && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {item.noHp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-3 border-t">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'up', 'perangkat')}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                title="Pindah ke atas"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'down', 'perangkat')}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                title="Pindah ke bawah"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPerangkat(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteItem({ id: item.id, type: 'perangkat' });
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Table View
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>NIP/NIPD</TableHead>
                        <TableHead>Pendidikan</TableHead>
                        <TableHead>No. HP</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPerangkat.map((item, index) => (
                        <TableRow key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                          <TableCell className="text-center font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
                                {item.foto ? (
                                  <img src={item.foto} alt={item.namaLengkap} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{item.namaLengkap}</p>
                                {item.email && <p className="text-xs text-gray-500">{item.email}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              {getJabatanLabel(item.jabatan)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.nip ? (
                              <span><span className="text-gray-500">NIP:</span> {item.nip}</span>
                            ) : item.nipd ? (
                              <span><span className="text-gray-500">NIPD:</span> {item.nipd}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{item.pendidikanTerakhir || '-'}</TableCell>
                          <TableCell>{item.noHp || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              {item.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'up', 'perangkat')}
                                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                title="Naik"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'down', 'perangkat')}
                                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                title="Turun"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPerangkat(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteItem({ id: item.id, type: 'perangkat' });
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BPD Tab */}
        <TabsContent value="bpd" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Daftar Anggota BPD</CardTitle>
              <Button 
                onClick={() => {
                  resetBpdForm();
                  setShowBpdDialog(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Anggota
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filteredBpd.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada data anggota BPD</p>
                  <p className="text-sm mt-1">Klik tombol "Tambah Anggota" untuk menambahkan data</p>
                </div>
              ) : viewMode === 'card' ? (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBpd.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "border hover:shadow-md transition-shadow cursor-pointer",
                        !item.isActive && "opacity-60"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.foto ? (
                                <img src={item.foto} alt={item.namaLengkap} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-8 h-8 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.namaLengkap}</h3>
                              <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                {item.jabatan}
                              </Badge>
                              {item.pekerjaan && (
                                <p className="text-xs text-gray-500 mt-1">{item.pekerjaan}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {item.noHp && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {item.noHp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-3 border-t">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'up', 'bpd')}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                title="Pindah ke atas"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'down', 'bpd')}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                title="Pindah ke bawah"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBpd(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteItem({ id: item.id, type: 'bpd' });
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Table View
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Pekerjaan</TableHead>
                        <TableHead>Pendidikan</TableHead>
                        <TableHead>No. HP</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBpd.map((item, index) => (
                        <TableRow key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                          <TableCell className="text-center font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                                {item.foto ? (
                                  <img src={item.foto} alt={item.namaLengkap} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{item.namaLengkap}</p>
                                {item.email && <p className="text-xs text-gray-500">{item.email}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {item.jabatan}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.pekerjaan || '-'}</TableCell>
                          <TableCell>{item.pendidikanTerakhir || '-'}</TableCell>
                          <TableCell>{item.noHp || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              {item.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'up', 'bpd')}
                                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                title="Naik"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(item.id, 'down', 'bpd')}
                                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                title="Turun"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBpd(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteItem({ id: item.id, type: 'bpd' });
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Perangkat Desa */}
      <Dialog open={showPerangkatDialog} onOpenChange={setShowPerangkatDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={perangkatForm.namaLengkap}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, namaLengkap: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Jenis Identitas</Label>
              <Select 
                value={perangkatForm.jenisIdentitas} 
                onValueChange={(value: 'NIP' | 'NIPD' | 'NONE') => 
                  setPerangkatForm({ ...perangkatForm, jenisIdentitas: value, nomorIdentitas: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis identitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIP">NIP (PNS)</SelectItem>
                  <SelectItem value="NIPD">NIPD (Non-PNS)</SelectItem>
                  <SelectItem value="NONE">Tidak Punya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {perangkatForm.jenisIdentitas !== 'NONE' && (
              <div className="space-y-2">
                <Label>Nomor {perangkatForm.jenisIdentitas}</Label>
                <Input
                  value={perangkatForm.nomorIdentitas}
                  onChange={(e) => setPerangkatForm({ ...perangkatForm, nomorIdentitas: e.target.value })}
                  placeholder={`Masukkan nomor ${perangkatForm.jenisIdentitas}`}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Tempat Lahir</Label>
              <Input
                value={perangkatForm.tempatLahir}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, tempatLahir: e.target.value })}
                placeholder="Masukkan tempat lahir"
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input
                type="date"
                value={perangkatForm.tanggalLahir}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, tanggalLahir: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <Select 
                value={perangkatForm.jenisKelamin} 
                onValueChange={(value: 'LAKI_LAKI' | 'PEREMPUAN') => 
                  setPerangkatForm({ ...perangkatForm, jenisKelamin: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agama</Label>
              <Select 
                value={perangkatForm.agama} 
                onValueChange={(value) => setPerangkatForm({ ...perangkatForm, agama: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agamaOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pendidikan Terakhir</Label>
              <Input
                value={perangkatForm.pendidikanTerakhir}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, pendidikanTerakhir: e.target.value })}
                placeholder="Contoh: S1"
              />
            </div>

            <div className="space-y-2">
              <Label>Jabatan *</Label>
              <Select 
                value={perangkatForm.jabatan} 
                onValueChange={(value) => setPerangkatForm({ ...perangkatForm, jabatan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jabatanPerangkatOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {perangkatForm.jabatan === 'LAINNYA' && (
              <div className="space-y-2">
                <Label>Jabatan Lainnya</Label>
                <Input
                  value={perangkatForm.jabatanLainnya}
                  onChange={(e) => setPerangkatForm({ ...perangkatForm, jabatanLainnya: e.target.value })}
                  placeholder="Masukkan nama jabatan"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Masa Jabatan Mulai</Label>
              <Input
                type="date"
                value={perangkatForm.masaJabatanMulai}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, masaJabatanMulai: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Masa Jabatan Selesai</Label>
              <Input
                type="date"
                value={perangkatForm.masaJabatanSelesai}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, masaJabatanSelesai: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>No. SK Pengangkatan</Label>
              <Input
                value={perangkatForm.skPengangkatan}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, skPengangkatan: e.target.value })}
                placeholder="Masukkan nomor SK"
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal SK</Label>
              <Input
                type="date"
                value={perangkatForm.tanggalSk}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, tanggalSk: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Alamat</Label>
              <Input
                value={perangkatForm.alamat}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, alamat: e.target.value })}
                placeholder="Masukkan alamat"
              />
            </div>

            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input
                value={perangkatForm.noHp}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, noHp: e.target.value })}
                placeholder="Masukkan nomor HP"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={perangkatForm.email}
                onChange={(e) => setPerangkatForm({ ...perangkatForm, email: e.target.value })}
                placeholder="Masukkan email"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPerangkatDialog(false)}>
              Batal
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSavePerangkat}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog BPD */}
      <Dialog open={showBpdDialog} onOpenChange={setShowBpdDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Anggota BPD' : 'Tambah Anggota BPD'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={bpdForm.namaLengkap}
                onChange={(e) => setBpdForm({ ...bpdForm, namaLengkap: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label>Jabatan dalam BPD *</Label>
              <Select 
                value={bpdForm.jabatan} 
                onValueChange={(value) => setBpdForm({ ...bpdForm, jabatan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jabatanBPDOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tempat Lahir</Label>
              <Input
                value={bpdForm.tempatLahir}
                onChange={(e) => setBpdForm({ ...bpdForm, tempatLahir: e.target.value })}
                placeholder="Masukkan tempat lahir"
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input
                type="date"
                value={bpdForm.tanggalLahir}
                onChange={(e) => setBpdForm({ ...bpdForm, tanggalLahir: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <Select 
                value={bpdForm.jenisKelamin} 
                onValueChange={(value: 'LAKI_LAKI' | 'PEREMPUAN') => 
                  setBpdForm({ ...bpdForm, jenisKelamin: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agama</Label>
              <Select 
                value={bpdForm.agama} 
                onValueChange={(value) => setBpdForm({ ...bpdForm, agama: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agamaOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pendidikan Terakhir</Label>
              <Input
                value={bpdForm.pendidikanTerakhir}
                onChange={(e) => setBpdForm({ ...bpdForm, pendidikanTerakhir: e.target.value })}
                placeholder="Contoh: S1"
              />
            </div>

            <div className="space-y-2">
              <Label>Pekerjaan</Label>
              <Input
                value={bpdForm.pekerjaan}
                onChange={(e) => setBpdForm({ ...bpdForm, pekerjaan: e.target.value })}
                placeholder="Masukkan pekerjaan"
              />
            </div>

            <div className="space-y-2">
              <Label>Periode Mulai</Label>
              <Input
                type="date"
                value={bpdForm.periodeMulai}
                onChange={(e) => setBpdForm({ ...bpdForm, periodeMulai: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Periode Selesai</Label>
              <Input
                type="date"
                value={bpdForm.periodeSelesai}
                onChange={(e) => setBpdForm({ ...bpdForm, periodeSelesai: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Alamat</Label>
              <Input
                value={bpdForm.alamat}
                onChange={(e) => setBpdForm({ ...bpdForm, alamat: e.target.value })}
                placeholder="Masukkan alamat"
              />
            </div>

            <div className="space-y-2">
              <Label>RT</Label>
              <Input
                value={bpdForm.rt}
                onChange={(e) => setBpdForm({ ...bpdForm, rt: e.target.value })}
                placeholder="RT"
              />
            </div>

            <div className="space-y-2">
              <Label>RW</Label>
              <Input
                value={bpdForm.rw}
                onChange={(e) => setBpdForm({ ...bpdForm, rw: e.target.value })}
                placeholder="RW"
              />
            </div>

            <div className="space-y-2">
              <Label>Dusun</Label>
              <Input
                value={bpdForm.dusun}
                onChange={(e) => setBpdForm({ ...bpdForm, dusun: e.target.value })}
                placeholder="Nama Dusun"
              />
            </div>

            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input
                value={bpdForm.noHp}
                onChange={(e) => setBpdForm({ ...bpdForm, noHp: e.target.value })}
                placeholder="Masukkan nomor HP"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={bpdForm.email}
                onChange={(e) => setBpdForm({ ...bpdForm, email: e.target.value })}
                placeholder="Masukkan email"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBpdDialog(false)}>
              Batal
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveBpd}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
