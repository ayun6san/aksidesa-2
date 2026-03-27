'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  HeartCrack,
  ArrowRightLeft,
  Heart,
  Scale,
  Search,
  User,
  Users,
  Home,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface PendudukSearchResult {
  id: string;
  nik: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  statusPerkawinan: string;
  kkId: string | null;
  nomorKK?: string;
  alamat?: string;
}

interface KKOption {
  id: string;
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
}

interface WilayahOption {
  id: string;
  label: string;
  dusunId: string;
}

interface FormPeristiwaProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const jenisPeristiwaConfig = {
  KELAHIRAN: {
    label: 'Kelahiran',
    icon: Baby,
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    description: 'Catat kelahiran bayi baru - akan membuat data penduduk baru',
  },
  KEMATIAN: {
    label: 'Kematian',
    icon: HeartCrack,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Catat kematian - akan mengubah status penduduk menjadi MENINGGAL',
  },
  PINDAH_MASUK: {
    label: 'Pindah Masuk',
    icon: ArrowRightLeft,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Catat pendatang baru - akan membuat data penduduk baru',
  },
  PINDAH_KELUAR: {
    label: 'Pindah Keluar',
    icon: ArrowRightLeft,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Catat perpindahan keluar - akan mengubah status menjadi PINDAH',
  },
  PERKAWINAN: {
    label: 'Perkawinan',
    icon: Heart,
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Catat perkawinan - akan mengubah status perkawinan',
  },
  PERCERAIAN: {
    label: 'Perceraian',
    icon: Scale,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Catat perceraian - akan mengubah status perkawinan',
  },
};

const agamaOptions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'];

export function FormPeristiwa({ onSuccess, onCancel }: FormPeristiwaProps) {
  // State
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Options
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PendudukSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPenduduk, setSelectedPenduduk] = useState<PendudukSearchResult | null>(null);
  const [kkOptions, setKKOptions] = useState<KKOption[]>([]);
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState({
    // Common
    tanggalPeristiwa: new Date().toISOString().split('T')[0],
    tempat: '',
    keterangan: '',
    
    // Kelahiran
    namaBayi: '',
    jenisKelaminBayi: 'LAKI_LAKI',
    beratBayi: '',
    panjangBayi: '',
    kkIdForBirth: '', // KK untuk bayi baru lahir
    namaAyah: '',
    nikAyah: '',
    namaIbu: '',
    nikIbu: '',
    
    // Kematian
    penyebabKematian: '',
    
    // Pindah Masuk
    alamatAsal: '',
    alamatTujuan: '',
    rtIdTujuan: '',
    dusunIdTujuan: '',
    
    // Pindah Keluar
    alamatPindah: '',
    
    // Perkawinan
    tanggalPerkawinan: '',
    aktaPerkawinan: '',
    pasanganId: '', // untuk update status pasangan juga
    
    // Perceraian
    tanggalPerceraian: '',
    aktaPerceraian: '',
    buatKKBaru: false,
    alamatKKBaru: '',
    rtIdKKBaru: '',
    dusunIdKKBaru: '',
    
    // New Penduduk (untuk Kelahiran & Pindah Masuk)
    nikBaru: '',
    tempatLahirBaru: '',
    tanggalLahirBaru: '',
    agamaBaru: 'ISLAM',
    pekerjaanBaru: '',
    pendidikanBaru: '',
    noHPBaru: '',
  });

  // Fetch options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch KK options
        const kkRes = await fetch('/api/kependudukan/kk?limit=500');
        if (kkRes.ok) {
          const kkData = await kkRes.json();
          if (kkData.success) {
            setKKOptions(kkData.data);
          }
        }
        
        // Fetch Wilayah options
        const wilayahRes = await fetch('/api/wilayah');
        if (wilayahRes.ok) {
          const wilayahData = await wilayahRes.json();
          if (wilayahData.success) {
            const options: WilayahOption[] = [];
            wilayahData.data.dusun?.forEach((dusun: any) => {
              dusun.rwList?.forEach((rw: any) => {
                rw.rtList?.forEach((rt: any) => {
                  options.push({
                    id: rt.id,
                    label: `${dusun.nama} - RW ${rw.nomor} - RT ${rt.nomor}`,
                    dusunId: dusun.id,
                  });
                });
              });
            });
            setWilayahOptions(options.sort((a, b) => a.label.localeCompare(b.label)));
          }
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    
    fetchOptions();
  }, []);

  // Search penduduk
  useEffect(() => {
    const searchPenduduk = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        const res = await fetch(`/api/kependudukan/penduduk?search=${encodeURIComponent(searchQuery)}&limit=10`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setSearching(false);
      }
    };
    
    const timer = setTimeout(searchPenduduk, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle event selection
  const handleSelectEvent = (event: string) => {
    setSelectedEvent(event);
    setStep('form');
  };

  // Handle penduduk selection
  const handleSelectPenduduk = (penduduk: PendudukSearchResult) => {
    setSelectedPenduduk(penduduk);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Generate NIK for new penduduk
  const generateNIK = () => {
    // Format: PPKKKTanggalLahirBulanLahirTahunLahirXXXX
    // Untuk demo, gunakan format sederhana
    const kodeKecamatan = '320117';
    const kodeUnik = Math.floor(Math.random() * 9000) + 1000;
    const tanggal = formData.tanggalLahirBaru ? new Date(formData.tanggalLahirBaru).getDate().toString().padStart(2, '0') : '01';
    const bulan = formData.tanggalLahirBaru ? (new Date(formData.tanggalLahirBaru).getMonth() + 1).toString().padStart(2, '0') : '01';
    const tahun = formData.tanggalLahirBaru ? new Date(formData.tanggalLahirBaru).getFullYear().toString().slice(-2) : '00';
    
    // Female: tanggal + 40
    const tglLahir = formData.jenisKelaminBayi === 'PEREMPUAN' 
      ? (parseInt(tanggal) + 40).toString() 
      : tanggal;
    
    return `${kodeKecamatan}${tglLahir}${bulan}${tahun}${kodeUnik}`;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedEvent) return;
    
    // Validasi berdasarkan jenis peristiwa
    if (['KEMATIAN', 'PINDAH_KELUAR', 'PERKAWINAN', 'PERCERAIAN'].includes(selectedEvent) && !selectedPenduduk) {
      toast.error('Pilih penduduk terlebih dahulu');
      return;
    }
    
    if (selectedEvent === 'KELAHIRAN' && !formData.namaBayi) {
      toast.error('Nama bayi wajib diisi');
      return;
    }
    
    if (selectedEvent === 'PINDAH_MASUK' && !formData.namaBayi) {
      toast.error('Nama lengkap wajib diisi untuk pendatang baru');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload: any = {
        jenisPeristiwa: selectedEvent,
        tanggalPeristiwa: formData.tanggalPeristiwa,
        tempat: formData.tempat,
        keterangan: formData.keterangan,
      };
      
      // Build payload based on event type
      switch (selectedEvent) {
        case 'KELAHIRAN':
          payload.namaBayi = formData.namaBayi;
          payload.jenisKelaminBayi = formData.jenisKelaminBayi;
          payload.beratBayi = formData.beratBayi;
          payload.panjangBayi = formData.panjangBayi;
          payload.kkId = formData.kkIdForBirth;
          payload.namaAyah = formData.namaAyah;
          payload.nikAyah = formData.nikAyah;
          payload.namaIbu = formData.namaIbu;
          payload.nikIbu = formData.nikIbu;
          // New penduduk data
          payload.pendudukBaru = {
            nik: formData.nikBaru || generateNIK(),
            namaLengkap: formData.namaBayi,
            jenisKelamin: formData.jenisKelaminBayi,
            tempatLahir: formData.tempatLahirBaru,
            tanggalLahir: formData.tanggalLahirBaru || formData.tanggalPeristiwa,
            agama: formData.agamaBaru,
            namaAyah: formData.namaAyah,
            nikAyah: formData.nikAyah,
            namaIbu: formData.namaIbu,
            nikIbu: formData.nikIbu,
            kkId: formData.kkIdForBirth,
            hubunganKeluarga: 'Anak',
          };
          break;
          
        case 'KEMATIAN':
          payload.pendudukId = selectedPenduduk?.id;
          payload.penyebabKematian = formData.penyebabKematian;
          break;
          
        case 'PINDAH_MASUK':
          payload.alamatAsal = formData.alamatAsal;
          payload.alamatTujuan = formData.alamatTujuan;
          // New penduduk data for pindah masuk
          payload.pendudukBaru = {
            nik: formData.nikBaru || generateNIK(),
            namaLengkap: formData.namaBayi, // reuse namaBayi field untuk nama pendatang
            jenisKelamin: formData.jenisKelaminBayi,
            tempatLahir: formData.tempatLahirBaru,
            tanggalLahir: formData.tanggalLahirBaru,
            agama: formData.agamaBaru,
            pekerjaan: formData.pekerjaanBaru,
            pendidikan: formData.pendidikanBaru,
            noHP: formData.noHPBaru,
            kkId: formData.kkIdForBirth,
            alamat: formData.alamatTujuan,
            rtId: formData.rtIdTujuan,
            dusunId: formData.dusunIdTujuan,
          };
          break;
          
        case 'PINDAH_KELUAR':
          payload.pendudukId = selectedPenduduk?.id;
          payload.alamatAsal = selectedPenduduk?.alamat;
          payload.alamatTujuan = formData.alamatPindah;
          break;
          
        case 'PERKAWINAN':
          payload.pendudukId = selectedPenduduk?.id;
          payload.tanggalPerkawinan = formData.tanggalPerkawinan;
          payload.aktaPerkawinan = formData.aktaPerkawinan;
          payload.pasanganId = formData.pasanganId;
          break;
          
        case 'PERCERAIAN':
          payload.pendudukId = selectedPenduduk?.id;
          payload.tanggalPerceraian = formData.tanggalPerceraian;
          payload.aktaPerceraian = formData.aktaPerceraian;
          payload.buatKKBaru = formData.buatKKBaru;
          payload.alamatKKBaru = formData.alamatKKBaru;
          payload.rtIdKKBaru = formData.rtIdKKBaru;
          payload.dusunIdKKBaru = formData.dusunIdKKBaru;
          break;
      }
      
      const response = await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Peristiwa ${jenisPeristiwaConfig[selectedEvent as keyof typeof jenisPeristiwaConfig].label} berhasil dicatat`);
        onSuccess();
      } else {
        toast.error(result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Render event selection
  const renderEventSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Jenis Peristiwa</h3>
        <p className="text-gray-500">Pilih jenis peristiwa kependudukan yang akan dicatat</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(jenisPeristiwaConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectEvent(key)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                'hover:shadow-md',
                config.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/50">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{config.label}</div>
                  <p className="text-sm opacity-80">{config.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  // Render penduduk search
  const renderPendudukSearch = () => (
    <div className="space-y-3">
      <Label>Pilih Penduduk <span className="text-red-500">*</span></Label>
      
      {selectedPenduduk ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedPenduduk.namaLengkap}</p>
              <p className="text-sm text-gray-500">NIK: {selectedPenduduk.nik}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPenduduk(null)}
          >
            Ganti
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIK atau nama penduduk..."
              className="pl-10"
            />
          </div>
          
          {searching && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Mencari...
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
              {searchResults.map((penduduk) => (
                <button
                  key={penduduk.id}
                  type="button"
                  onClick={() => handleSelectPenduduk(penduduk)}
                  className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{penduduk.namaLengkap}</p>
                    <p className="text-sm text-gray-500">
                      NIK: {penduduk.nik} • {penduduk.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
            <p className="text-sm text-gray-500">Tidak ditemukan penduduk dengan kata kunci tersebut</p>
          )}
        </>
      )}
    </div>
  );

  // Render form content based on event type
  const renderFormContent = () => {
    if (!selectedEvent) return null;
    
    const config = jenisPeristiwaConfig[selectedEvent as keyof typeof jenisPeristiwaConfig];
    const Icon = config.icon;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>
        
        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tanggal Peristiwa <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={formData.tanggalPeristiwa}
              onChange={(e) => setFormData({ ...formData, tanggalPeristiwa: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tempat</Label>
            <Input
              value={formData.tempat}
              onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
              placeholder="Tempat kejadian"
            />
          </div>
        </div>
        
        {/* Event-specific fields */}
        <AnimatePresence mode="wait">
          {selectedEvent === 'KELAHIRAN' && (
            <motion.div
              key="kelahiran"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-800">
                    <Baby className="w-4 h-4 inline mr-2" />
                    Data Bayi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Bayi <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.namaBayi}
                        onChange={(e) => setFormData({ ...formData, namaBayi: e.target.value })}
                        placeholder="Nama bayi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jenis Kelamin</Label>
                      <Select
                        value={formData.jenisKelaminBayi}
                        onValueChange={(v) => setFormData({ ...formData, jenisKelaminBayi: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                          <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tempat Lahir</Label>
                      <Input
                        value={formData.tempatLahirBaru}
                        onChange={(e) => setFormData({ ...formData, tempatLahirBaru: e.target.value })}
                        placeholder="Kota/Kabupaten"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Berat (kg)</Label>
                      <Input
                        value={formData.beratBayi}
                        onChange={(e) => setFormData({ ...formData, beratBayi: e.target.value })}
                        placeholder="3.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Panjang (cm)</Label>
                      <Input
                        value={formData.panjangBayi}
                        onChange={(e) => setFormData({ ...formData, panjangBayi: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    <Users className="w-4 h-4 inline mr-2" />
                    Data Orang Tua
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Ayah</Label>
                      <Input
                        value={formData.namaAyah}
                        onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                        placeholder="Nama ayah"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NIK Ayah</Label>
                      <Input
                        value={formData.nikAyah}
                        onChange={(e) => setFormData({ ...formData, nikAyah: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                        placeholder="16 digit NIK"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Ibu</Label>
                      <Input
                        value={formData.namaIbu}
                        onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                        placeholder="Nama ibu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NIK Ibu</Label>
                      <Input
                        value={formData.nikIbu}
                        onChange={(e) => setFormData({ ...formData, nikIbu: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                        placeholder="16 digit NIK"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    <Home className="w-4 h-4 inline mr-2" />
                    Kartu Keluarga
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pilih KK (Opsional)</Label>
                    <Select
                      value={formData.kkIdForBirth}
                      onValueChange={(v) => setFormData({ ...formData, kkIdForBirth: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih KK untuk bayi" />
                      </SelectTrigger>
                      <SelectContent>
                        {kkOptions.map((kk) => (
                          <SelectItem key={kk.id} value={kk.id}>
                            {kk.nomorKK} - {kk.kepalaKeluarga}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Jika tidak dipilih, bayi akan terdaftar tanpa KK
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {selectedEvent === 'KEMATIAN' && (
            <motion.div
              key="kematian"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {renderPendudukSearch()}
              
              <div className="space-y-2">
                <Label>Penyebab Kematian</Label>
                <Input
                  value={formData.penyebabKematian}
                  onChange={(e) => setFormData({ ...formData, penyebabKematian: e.target.value })}
                  placeholder="Penyebab kematian"
                />
              </div>
              
              {selectedPenduduk && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Perhatian:</strong> Status penduduk <strong>{selectedPenduduk.namaLengkap}</strong> akan diubah menjadi <strong>MENINGGAL</strong>.
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {selectedEvent === 'PINDAH_MASUK' && (
            <motion.div
              key="pindah-masuk"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">
                    <User className="w-4 h-4 inline mr-2" />
                    Data Pendatang Baru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.namaBayi} // reuse field
                        onChange={(e) => setFormData({ ...formData, namaBayi: e.target.value })}
                        placeholder="Nama lengkap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jenis Kelamin</Label>
                      <Select
                        value={formData.jenisKelaminBayi}
                        onValueChange={(v) => setFormData({ ...formData, jenisKelaminBayi: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                          <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tempat Lahir</Label>
                      <Input
                        value={formData.tempatLahirBaru}
                        onChange={(e) => setFormData({ ...formData, tempatLahirBaru: e.target.value })}
                        placeholder="Kota/Kabupaten"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Lahir</Label>
                      <Input
                        type="date"
                        value={formData.tanggalLahirBaru}
                        onChange={(e) => setFormData({ ...formData, tanggalLahirBaru: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Agama</Label>
                      <Select
                        value={formData.agamaBaru}
                        onValueChange={(v) => setFormData({ ...formData, agamaBaru: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {agamaOptions.map((agama) => (
                            <SelectItem key={agama} value={agama}>{agama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pekerjaan</Label>
                      <Input
                        value={formData.pekerjaanBaru}
                        onChange={(e) => setFormData({ ...formData, pekerjaanBaru: e.target.value })}
                        placeholder="Pekerjaan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP</Label>
                      <Input
                        value={formData.noHPBaru}
                        onChange={(e) => setFormData({ ...formData, noHPBaru: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Alamat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alamat Asal</Label>
                    <Textarea
                      value={formData.alamatAsal}
                      onChange={(e) => setFormData({ ...formData, alamatAsal: e.target.value })}
                      placeholder="Alamat asal sebelum pindah"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Alamat Tujuan di Desa</Label>
                    <Textarea
                      value={formData.alamatTujuan}
                      onChange={(e) => setFormData({ ...formData, alamatTujuan: e.target.value })}
                      placeholder="Alamat di desa"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>RT/RW/Dusun</Label>
                    <Select
                      value={formData.rtIdTujuan}
                      onValueChange={(v) => {
                        const selected = wilayahOptions.find(opt => opt.id === v);
                        setFormData({ 
                          ...formData, 
                          rtIdTujuan: v,
                          dusunIdTujuan: selected?.dusunId || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih RT/RW/Dusun" />
                      </SelectTrigger>
                      <SelectContent>
                        {wilayahOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {selectedEvent === 'PINDAH_KELUAR' && (
            <motion.div
              key="pindah-keluar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {renderPendudukSearch()}
              
              <div className="space-y-2">
                <Label>Alamat Tujuan Pindah <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.alamatPindah}
                  onChange={(e) => setFormData({ ...formData, alamatPindah: e.target.value })}
                  placeholder="Alamat tujuan pindah"
                  rows={2}
                />
              </div>
              
              {selectedPenduduk && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Perhatian:</strong> Status penduduk <strong>{selectedPenduduk.namaLengkap}</strong> akan diubah menjadi <strong>PINDAH</strong>.
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {selectedEvent === 'PERKAWINAN' && (
            <motion.div
              key="perkawinan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {renderPendudukSearch()}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Perkawinan</Label>
                  <Input
                    type="date"
                    value={formData.tanggalPerkawinan}
                    onChange={(e) => setFormData({ ...formData, tanggalPerkawinan: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Akta Perkawinan</Label>
                  <Input
                    value={formData.aktaPerkawinan}
                    onChange={(e) => setFormData({ ...formData, aktaPerkawinan: e.target.value })}
                    placeholder="Nomor akta"
                  />
                </div>
              </div>
              
              {selectedPenduduk && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                    Status perkawinan <strong>{selectedPenduduk.namaLengkap}</strong> akan diubah menjadi <strong>KAWIN</strong>.
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {selectedEvent === 'PERCERAIAN' && (
            <motion.div
              key="perceraian"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {renderPendudukSearch()}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Perceraian</Label>
                  <Input
                    type="date"
                    value={formData.tanggalPerceraian}
                    onChange={(e) => setFormData({ ...formData, tanggalPerceraian: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Akta Perceraian</Label>
                  <Input
                    value={formData.aktaPerceraian}
                    onChange={(e) => setFormData({ ...formData, aktaPerceraian: e.target.value })}
                    placeholder="Nomor akta"
                  />
                </div>
              </div>
              
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">
                    <Home className="w-4 h-4 inline mr-2" />
                    Opsi KK Baru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="buatKKBaru"
                      checked={formData.buatKKBaru}
                      onChange={(e) => setFormData({ ...formData, buatKKBaru: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="buatKKBaru" className="cursor-pointer">
                      Buat KK baru untuk penduduk ini
                    </Label>
                  </div>
                  
                  {formData.buatKKBaru && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Alamat KK Baru</Label>
                        <Textarea
                          value={formData.alamatKKBaru}
                          onChange={(e) => setFormData({ ...formData, alamatKKBaru: e.target.value })}
                          placeholder="Alamat untuk KK baru"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>RT/RW/Dusun</Label>
                        <Select
                          value={formData.rtIdKKBaru}
                          onValueChange={(v) => {
                            const selected = wilayahOptions.find(opt => opt.id === v);
                            setFormData({ 
                              ...formData, 
                              rtIdKKBaru: v,
                              dusunIdKKBaru: selected?.dusunId || ''
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih RT/RW/Dusun" />
                          </SelectTrigger>
                          <SelectContent>
                            {wilayahOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {selectedPenduduk && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    Status perkawinan <strong>{selectedPenduduk.namaLengkap}</strong> akan diubah menjadi <strong>CERAI HIDUP</strong>.
                    {formData.buatKKBaru && ' KK baru akan dibuat sebagai Kepala Keluarga.'}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Keterangan */}
        <div className="space-y-2">
          <Label>Keterangan Tambahan</Label>
          <Textarea
            value={formData.keterangan}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            placeholder="Keterangan tambahan (opsional)"
            rows={2}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex items-center gap-2 text-sm',
          step === 'select' ? 'text-emerald-600' : 'text-gray-400'
        )}>
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
            step === 'select' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          )}>
            1
          </div>
          Pilih Jenis
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={cn(
          'flex items-center gap-2 text-sm',
          step === 'form' ? 'text-emerald-600' : 'text-gray-400'
        )}>
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
            step === 'form' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          )}>
            2
          </div>
          Isi Data
        </div>
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'select' ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderEventSelection()}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderFormContent()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (step === 'form') {
              setStep('select');
              setSelectedPenduduk(null);
              setSearchQuery('');
            } else {
              onCancel();
            }
          }}
        >
          {step === 'form' ? 'Kembali' : 'Batal'}
        </Button>
        
        {step === 'form' && (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Simpan Peristiwa
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
