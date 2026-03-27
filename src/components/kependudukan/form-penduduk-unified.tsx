'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  Briefcase,
  FileText,
  MapPin,
  Phone,
  Heart,
  Upload,
  X,
  ArrowLeft,
  Home,
  ChevronRight,
  BadgeCheck,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { NIKSearch, PendudukSearchResult } from '@/components/kependudukan/nik-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUnsavedChanges, UnsavedChangesDialog } from '@/hooks/use-unsaved-changes';

// ==================== TYPES ====================

interface PendudukFormData {
  // Identitas
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  golonganDarah: string;
  agama: string;
  suku: string;
  // Status Perkawinan
  statusPerkawinan: string;
  aktaPerkawinan: string;
  tanggalPerkawinan: string;
  aktaPerceraian: string;
  tanggalPerceraian: string;
  // Pekerjaan & Pendidikan
  pekerjaan: string;
  pendidikan: string;
  penghasilan: string;
  // Kewarganegaraan
  kewarganegaraan: string;
  negaraAsal: string;
  noPaspor: string;
  noKitasKitap: string;
  tanggalMasuk: string;
  // Dokumen
  noAktaKelahiran: string;
  statusKTP: string;
  noBPJSKesehatan: string;
  noBPJSTenagakerja: string;
  npwp: string;
  // Data Orang Tua
  namaAyah: string;
  nikAyah: string;
  namaIbu: string;
  nikIbu: string;
  anakKe: string;
  jumlahSaudara: string;
  // KK
  kkId: string;
  hubunganKeluarga: string;
  urutanDalamKK: number;
  // Kontak
  email: string;
  noHP: string;
  // Kesehatan
  jenisDisabilitas: string;
  keteranganDisabilitas: string;
  penyakitKronis: string;
  // Status
  status: string;
  isActive: boolean;
  // Foto
  foto: string;
  fotoKTP: string;
}

interface WilayahOption {
  id: string;
  label: string;
  dusunId: string;
}

interface KKInfo {
  id: string;
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  jumlahAnggota: number;
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

interface EditingPendudukKK {
  nomorKK?: string;
}

interface KKSearchResult {
  id: string;
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  jumlahAnggota: number;
}

// Props
export interface FormPendudukUnifiedProps {
  // Mode
  mode: 'tambah' | 'edit' | 'anggota-kk' | 'penduduk-baru';
  // Layout
  layout?: 'full-page' | 'modal';
  // KK Context (untuk mode anggota-kk)
  kkInfo?: KKInfo | null;
  // KK Options (untuk mode edit)
  kkOptions?: KKOption[];
  // Editing data
  editingPenduduk?: PendudukFormData & { id: string; nomorKK?: string } | null;
  // Wilayah options
  wilayahOptions: WilayahOption[];
  // Callbacks
  onBack: () => void;
  onSubmit: (data: PendudukFormData, kkBaru?: { nomorKK: string; alamat: string; rtId: string; dusunId: string } | null) => Promise<void>;
  // Loading state
  loading?: boolean;
}

// ==================== HELPER FUNCTIONS ====================

// Helper to convert null values to empty strings for form inputs
const sanitizeFormData = (data: Partial<PendudukFormData>): Partial<PendudukFormData> => {
  const sanitized: Partial<PendudukFormData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      (sanitized as Record<string, string | number | boolean>)[key] = '';
    } else {
      (sanitized as Record<string, string | number | boolean>)[key] = value;
    }
  }
  return sanitized;
};

// ==================== CONSTANTS ====================

const initialFormData: PendudukFormData = {
  nik: '',
  namaLengkap: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'LAKI_LAKI',
  golonganDarah: 'TIDAK_TAHU',
  agama: 'ISLAM',
  suku: '',
  statusPerkawinan: 'BELUM_KAWIN',
  aktaPerkawinan: '',
  tanggalPerkawinan: '',
  aktaPerceraian: '',
  tanggalPerceraian: '',
  pekerjaan: '',
  pendidikan: '',
  penghasilan: '',
  kewarganegaraan: 'WNI',
  negaraAsal: '',
  noPaspor: '',
  noKitasKitap: '',
  tanggalMasuk: '',
  noAktaKelahiran: '',
  statusKTP: 'BELUM_BUAT',
  noBPJSKesehatan: '',
  noBPJSTenagakerja: '',
  npwp: '',
  namaAyah: '',
  nikAyah: '',
  namaIbu: '',
  nikIbu: '',
  anakKe: '',
  jumlahSaudara: '',
  kkId: '',
  hubunganKeluarga: '',
  urutanDalamKK: 1,
  email: '',
  noHP: '',
  jenisDisabilitas: 'TIDAK_ADA',
  keteranganDisabilitas: '',
  penyakitKronis: '',
  status: 'TETAP',
  isActive: true,
  foto: '',
  fotoKTP: '',
};

// Consolidated menu items - fewer sections for better UX
const menuItems = [
  { id: 'pribadi', label: 'Data Pribadi', icon: User },
  { id: 'keluarga', label: 'Keluarga', icon: Users },
  { id: 'kesehatan', label: 'Kesehatan', icon: Heart },
  { id: 'dokumen', label: 'Dokumen', icon: FileText },
];

const golonganDarahOptions = ['TIDAK_TAHU', 'A', 'B', 'AB', 'O'];
const golonganDarahLabels: Record<string, string> = {
  'TIDAK_TAHU': 'Tidak Tahu',
  'A': 'A',
  'B': 'B',
  'AB': 'AB',
  'O': 'O',
};
const agamaOptions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'];
const statusPerkawinanOptions = [
  'BELUM_KAWIN',
  'KAWIN_TERCATAT',
  'KAWIN_TIDAK_TERCATAT',
  'CERAI_HIDUP_TERCATAT',
  'CERAI_HIDUP_TIDAK_TERCATAT',
  'CERAI_MATI'
];
const statusPerkawinanLabels: Record<string, string> = {
  'BELUM_KAWIN': 'Belum Kawin',
  'KAWIN_TERCATAT': 'Kawin Tercatat',
  'KAWIN_TIDAK_TERCATAT': 'Kawin Tidak Tercatat',
  'CERAI_HIDUP_TERCATAT': 'Cerai Hidup Tercatat',
  'CERAI_HIDUP_TIDAK_TERCATAT': 'Cerai Hidup Tidak Tercatat',
  'CERAI_MATI': 'Cerai Mati',
};
const statusKTPoptions = ['BELUM_BUAT', 'SUDAH_BUAT', 'HILANG', 'DALAM_PROSES'];
const statusPendudukOptions = ['TETAP', 'PENDATANG', 'PINDAH', 'MENINGGAL'];
const disabilitasOptions = ['TIDAK_ADA', 'FISIK', 'NETRA', 'RUNGU', 'WICARA', 'MENTAL', 'INTELEKTUAL', 'LAINNYA'];
// Hubungan Keluarga: Label -> Enum mapping
const hubunganKeluargaToEnum: Record<string, string> = {
  'Kepala Keluarga': 'KEPALA_KELUARGA',
  'Istri': 'ISTRI',
  'Anak': 'ANAK',
  'Menantu': 'MENANTU',
  'Cucu': 'CUCU',
  'Orang Tua': 'ORANG_TUA',
  'Mertua': 'MERTUA',
  'Famili Lain': 'FAMILI_LAIN',
  'Pembantu': 'PEMBANTU',
  'Lainnya': 'LAINNYA',
};

const enumToHubunganKeluarga: Record<string, string> = Object.fromEntries(
  Object.entries(hubunganKeluargaToEnum).map(([k, v]) => [v, k])
);

const hubunganKeluargaOptions = [
  'Kepala Keluarga', 'Istri', 'Anak', 'Menantu', 'Cucu',
  'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'
];
const pekerjaanOptions = [
  'Tidak/Belum Bekerja', 'Pelajar/Mahasiswa', 'PNS', 'TNI/POLRI',
  'Pegawai Swasta', 'Wiraswasta', 'Petani', 'Nelayan', 'Buruh',
  'Pedagang', 'Guru', 'Dokter', 'Bidan', 'Perawat', 'Pensiunan',
  'Ibu Rumah Tangga', 'Lainnya'
];
const pendidikanOptions = [
  'Tidak/Belum Sekolah', 'SD/Sederajat', 'SMP/Sederajat',
  'SMA/Sederajat', 'D1/D2/D3', 'S1/D4', 'S2', 'S3'
];
const penghasilanOptions = [
  'Tidak Ada', '< 500.000', '500.000 - 1.000.000',
  '1.000.000 - 2.500.000', '2.500.000 - 5.000.000',
  '5.000.000 - 10.000.000', '> 10.000.000'
];

// ==================== COMPONENT ====================

export function FormPendudukUnified({
  mode,
  layout = 'full-page',
  kkInfo,
  kkOptions = [],
  editingPenduduk,
  wilayahOptions,
  onBack,
  onSubmit,
  loading = false,
}: FormPendudukUnifiedProps) {
  // Step state (untuk mode penduduk-baru)
  const [step, setStep] = useState<'pilih-kk' | 'form-data'>(
    mode === 'penduduk-baru' ? 'pilih-kk' : 'form-data'
  );

  // KK selection state (untuk mode penduduk-baru)
  const [kkStatus, setKkStatus] = useState<'belum-punya' | 'sudah-punya' | null>(null);
  const [selectedKK, setSelectedKK] = useState<KKSearchResult | null>(null);
  const [kkSearchQuery, setKkSearchQuery] = useState('');
  const [kkSearchResults, setKkSearchResults] = useState<KKSearchResult[]>([]);
  const [kkSearching, setKkSearching] = useState(false);

  // New KK data
  const [newKKData, setNewKKData] = useState({
    nomorKK: '',
    alamat: '',
    rtId: '',
    dusunId: '',
  });

  // Form state
  const [activeMenu, setActiveMenu] = useState('pribadi');
  const [formData, setFormData] = useState<PendudukFormData>(() => {
    if (editingPenduduk) {
      // Sanitize null values to empty strings for form inputs
      const sanitized = sanitizeFormData(editingPenduduk);
      // Convert hubunganKeluarga from enum to label
      const hubunganLabel = enumToHubunganKeluarga[sanitized.hubunganKeluarga || ''] || sanitized.hubunganKeluarga || '';
      return {
        ...initialFormData,
        ...sanitized,
        hubunganKeluarga: hubunganLabel,
        tanggalLahir: sanitized.tanggalLahir?.split('T')[0] || '',
        tanggalPerkawinan: sanitized.tanggalPerkawinan?.split('T')[0] || '',
        tanggalPerceraian: sanitized.tanggalPerceraian?.split('T')[0] || '',
        tanggalMasuk: sanitized.tanggalMasuk?.split('T')[0] || '',
      };
    }
    if (mode === 'anggota-kk' && kkInfo) {
      return { ...initialFormData, kkId: kkInfo.id };
    }
    return initialFormData;
  });

  // Store initial form data for dirty tracking (defined after formData)
  const initialFormDataRef = useRef<PendudukFormData>(formData);

  const [errors, setErrors] = useState<Partial<Record<keyof PendudukFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // State for NIK search feature
  const [selectedFromSearch, setSelectedFromSearch] = useState<PendudukSearchResult | null>(null);
  const [showNikSearch, setShowNikSearch] = useState(true);

  // Check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // Skip check in edit mode if data was loaded from search
    if (mode === 'edit' && selectedFromSearch) {
      return false;
    }
    
    // Compare current form data with initial data
    const keys = Object.keys(formData) as (keyof PendudukFormData)[];
    for (const key of keys) {
      const initialValue = initialFormDataRef.current[key];
      const currentValue = formData[key];
      
      // Skip certain fields
      if (key === 'urutanDalamKK') continue;
      
      // Handle null/undefined/empty string comparison
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === '') return '';
        return val;
      };
      
      if (normalizeValue(initialValue) !== normalizeValue(currentValue)) {
        return true;
      }
    }
    return false;
  }, [formData, mode, selectedFromSearch]);

  // Unsaved changes hook
  const {
    showDialog: showUnsavedDialog,
    setShowDialog: setShowUnsavedDialog,
    handleConfirm: handleConfirmLeave,
    handleCancel: handleCancelLeave,
    checkAndConfirm,
    resetConfirmation,
  } = useUnsavedChanges({
    hasUnsavedChanges: hasUnsavedChanges(),
    enabled: mode !== 'edit', // Only enable for non-edit modes
  });

  // Handle back with confirmation
  const handleBackWithConfirm = useCallback(() => {
    checkAndConfirm(onBack);
  }, [checkAndConfirm, onBack]);

  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fotoKTPInputRef = useRef<HTMLInputElement>(null);

  // Search KK
  const searchKK = async (query: string) => {
    if (!query.trim()) {
      setKkSearchResults([]);
      return;
    }

    setKkSearching(true);
    try {
      const response = await fetch(`/api/kependudukan/kk?search=${encodeURIComponent(query)}&limit=10`);
      const result = await response.json();
      if (result.success) {
        setKkSearchResults(result.data.map((kk: any) => ({
          id: kk.id,
          nomorKK: kk.nomorKK,
          kepalaKeluarga: kk.kepalaKeluarga?.namaLengkap || 'Belum ada KK',
          alamat: kk.alamat,
          rt: kk.rt?.nomor || '-',
          rw: kk.rt?.rw?.nomor || '-',
          dusun: kk.rt?.rw?.dusun?.nama || '-',
          jumlahAnggota: kk.anggota?.length || 0,
        })));
      }
    } catch (error) {
      console.error('Error searching KK:', error);
    } finally {
      setKkSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (kkStatus === 'sudah-punya' && kkSearchQuery) {
        searchKK(kkSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [kkSearchQuery, kkStatus]);

  // Generate KK number
  const generateKKNumber = () => {
    const base = '320117010101';
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${base}${random}0001`;
  };

  // Handle KK status selection
  const handleKkStatusSelect = (status: 'belum-punya' | 'sudah-punya') => {
    setKkStatus(status);
    setSelectedKK(null);
    setKkSearchQuery('');
    setKkSearchResults([]);

    if (status === 'belum-punya') {
      setNewKKData({
        nomorKK: generateKKNumber(),
        alamat: '',
        rtId: '',
        dusunId: '',
      });
    }
  };

  // Handle KK selection
  const handleSelectKK = (kk: KKSearchResult) => {
    setSelectedKK(kk);
    setFormData(prev => ({
      ...prev,
      kkId: kk.id,
    }));
  };

  // Proceed to form data
  const handleProceedToForm = () => {
    if (kkStatus === 'belum-punya') {
      if (!newKKData.alamat.trim()) {
        toast.error('Alamat wajib diisi');
        return;
      }
      if (!newKKData.rtId) {
        toast.error('RT/RW/Dusun wajib dipilih');
        return;
      }
      setFormData(prev => ({
        ...prev,
        hubunganKeluarga: 'Kepala Keluarga',
      }));
    } else if (kkStatus === 'sudah-punya') {
      if (!selectedKK) {
        toast.error('Pilih Kartu Keluarga terlebih dahulu');
        return;
      }
    }
    setStep('form-data');
  };

  const handleInputChange = (field: keyof PendudukFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear search selection when user manually changes input
    if (selectedFromSearch && (field === 'nik' || field === 'namaLengkap')) {
      setSelectedFromSearch(null);
    }
  };

  // Handle NIK search selection - auto-fill form
  const handleNikSearchSelect = useCallback((penduduk: PendudukSearchResult) => {
    setSelectedFromSearch(penduduk);
    
    // Auto-fill all form data from search result
    setFormData(prev => ({
      ...prev,
      nik: penduduk.nik,
      namaLengkap: penduduk.namaLengkap,
      tempatLahir: penduduk.tempatLahir,
      tanggalLahir: penduduk.tanggalLahir,
      jenisKelamin: penduduk.jenisKelamin,
      golonganDarah: penduduk.golonganDarah,
      agama: penduduk.agama,
      suku: penduduk.suku,
      statusPerkawinan: penduduk.statusPerkawinan,
      aktaPerkawinan: penduduk.aktaPerkawinan,
      tanggalPerkawinan: penduduk.tanggalPerkawinan,
      aktaPerceraian: penduduk.aktaPerceraian,
      tanggalPerceraian: penduduk.tanggalPerceraian,
      pekerjaan: penduduk.pekerjaan,
      pendidikan: penduduk.pendidikan,
      penghasilan: penduduk.penghasilan,
      kewarganegaraan: penduduk.kewarganegaraan,
      negaraAsal: penduduk.negaraAsal,
      noPaspor: penduduk.noPaspor,
      noKitasKitap: penduduk.noKitasKitap,
      tanggalMasuk: penduduk.tanggalMasuk,
      noAktaKelahiran: penduduk.noAktaKelahiran,
      statusKTP: penduduk.statusKTP,
      noBPJSKesehatan: penduduk.noBPJSKesehatan,
      noBPJSTenagakerja: penduduk.noBPJSTenagakerja,
      npwp: penduduk.npwp,
      namaAyah: penduduk.namaAyah,
      nikAyah: penduduk.nikAyah,
      namaIbu: penduduk.namaIbu,
      nikIbu: penduduk.nikIbu,
      anakKe: penduduk.anakKe,
      jumlahSaudara: penduduk.jumlahSaudara,
      email: penduduk.email,
      noHP: penduduk.noHP,
      jenisDisabilitas: penduduk.jenisDisabilitas,
      keteranganDisabilitas: penduduk.keteranganDisabilitas,
      penyakitKronis: penduduk.penyakitKronis,
      status: penduduk.status,
      foto: penduduk.foto,
      fotoKTP: penduduk.fotoKTP,
    }));
    
    // Clear any errors
    setErrors({});
    
    // Show success toast
    toast.success('Data berhasil dimuat dari database', {
      description: `NIK: ${penduduk.nik} - ${penduduk.namaLengkap}`,
      icon: <Sparkles className="w-4 h-4" />,
    });
  }, []);

  // Handle clear NIK search
  const handleNikSearchClear = useCallback(() => {
    setSelectedFromSearch(null);
    setShowNikSearch(true);
  }, []);

  // Compress and resize image
  const compressImage = (
    file: File,
    field: 'foto' | 'fotoKTP'
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Target dimensions based on field type
        let targetWidth: number;
        let targetHeight: number;

        if (field === 'foto') {
          // Portrait photo: 300 × 450 px (2x display for retina, 2:3 aspect ratio)
          targetWidth = 300;
          targetHeight = 450;
        } else {
          // KTP photo: 600 × 400 px (3:2 aspect ratio)
          targetWidth = 600;
          targetHeight = 400;
        }

        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate scaling to cover the target area (crop to fill)
        const sourceRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (sourceRatio > targetRatio) {
          // Source is wider - crop sides
          sourceWidth = img.height * targetRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Source is taller - crop top/bottom
          sourceHeight = img.width / targetRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Enable high-quality image smoothing
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw resized image
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
          );

          // Convert to JPEG with 85% quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'foto' | 'fotoKTP') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 3MB)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Ukuran file maksimal 3MB');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Memproses gambar...');

      // Compress and resize image
      const compressedImage = await compressImage(file, field);

      // Calculate compressed size
      const compressedSize = Math.round((compressedImage.length * 3) / 4);
      const compressedKB = (compressedSize / 1024).toFixed(1);
      const originalKB = (file.size / 1024).toFixed(1);

      // Update form data
      setFormData(prev => ({ ...prev, [field]: compressedImage }));

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('Gambar berhasil dikompresi', {
        description: `Ukuran: ${originalKB}KB → ${compressedKB}KB`,
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Gagal memproses gambar');
    }

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PendudukFormData, string>> = {};

    if (!formData.nik.trim()) {
      newErrors.nik = 'NIK wajib diisi';
    } else if (!/^\d{16}$/.test(formData.nik)) {
      newErrors.nik = 'NIK harus 16 digit angka';
    }

    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap wajib diisi';
    }

    if (!formData.jenisKelamin) {
      newErrors.jenisKelamin = 'Jenis kelamin wajib dipilih';
    }

    // Hubungan keluarga wajib untuk mode anggota-kk dan penduduk-baru
    if ((mode === 'anggota-kk' || mode === 'penduduk-baru') && !formData.hubunganKeluarga) {
      newErrors.hubunganKeluarga = 'Hubungan keluarga wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const kkBaru = (mode === 'penduduk-baru' && kkStatus === 'belum-punya') ? newKKData : null;
      
      // Convert hubunganKeluarga from label to enum before submitting
      const submitData = {
        ...formData,
        hubunganKeluarga: hubunganKeluargaToEnum[formData.hubunganKeluarga] || formData.hubunganKeluarga,
      };
      
      await onSubmit(submitData, kkBaru);
      // Reset confirmation state after successful submit
      resetConfirmation();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWilayahChange = (rtId: string) => {
    const selected = wilayahOptions.find(opt => opt.id === rtId);
    if (selected) {
      // Only used for new KK data in penduduk-baru mode
      if (mode === 'penduduk-baru' && step === 'pilih-kk' && kkStatus === 'belum-punya') {
        setNewKKData(prev => ({
          ...prev,
          rtId: selected.id,
          dusunId: selected.dusunId,
        }));
      }
    }
  };

  // Get menu completion status
  const getMenuStatus = (menuId: string): 'complete' | 'partial' | 'empty' => {
    switch (menuId) {
      case 'pribadi':
        return (formData.nik && formData.namaLengkap && formData.jenisKelamin) ? 'complete' :
          (formData.nik || formData.namaLengkap) ? 'partial' : 'empty';
      case 'keluarga':
        return (formData.hubunganKeluarga || formData.statusPerkawinan !== 'BELUM_KAWIN') ? 'complete' :
          formData.hubunganKeluarga ? 'partial' : 'empty';
      default:
        const hasData = Object.entries(formData).some(([key, value]) => {
          if (['nik', 'namaLengkap', 'jenisKelamin', 'kkId'].includes(key)) return false;
          return value && value !== initialFormData[key as keyof PendudukFormData];
        });
        return hasData ? 'partial' : 'empty';
    }
  };

  // Calculate age
  const calculateAge = (tanggalLahir: string | undefined) => {
    if (!tanggalLahir) return '-';
    const birth = new Date(tanggalLahir);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} tahun` : '-';
  };

  // Get title based on mode
  const getTitle = () => {
    switch (mode) {
      case 'tambah':
        return 'Tambah Penduduk';
      case 'edit':
        return 'Edit Data Penduduk';
      case 'anggota-kk':
        return editingPenduduk ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga';
      case 'penduduk-baru':
        return 'Tambah Penduduk Baru';
      default:
        return 'Form Penduduk';
    }
  };

  // Get hubungan keluarga options based on mode
  const getHubunganKeluargaOptions = () => {
    if (mode === 'penduduk-baru' && kkStatus === 'belum-punya') {
      return ['Kepala Keluarga']; // Fixed for new KK
    }
    if (mode === 'anggota-kk' || (mode === 'penduduk-baru' && kkStatus === 'sudah-punya')) {
      return hubunganKeluargaOptions.filter(h => h !== 'Kepala Keluarga');
    }
    return hubunganKeluargaOptions;
  };

  // ==================== RENDER KK SELECTION STEP ====================
  const renderKKSelection = () => (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Apakah penduduk ini sudah memiliki Kartu Keluarga?
          </h2>
          <p className="text-gray-500">
            Pilih salah satu opsi di bawah ini untuk melanjutkan
          </p>
        </div>

        {/* KK Status Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleKkStatusSelect('belum-punya')}
            className={cn(
              'p-6 rounded-xl border-2 text-left transition-all',
              kkStatus === 'belum-punya'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                kkStatus === 'belum-punya' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              )}>
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Belum Punya KK</h3>
            </div>
            <p className="text-sm text-gray-500">
              Buat Kartu Keluarga baru untuk penduduk ini sebagai Kepala Keluarga
            </p>
          </button>

          <button
            onClick={() => handleKkStatusSelect('sudah-punya')}
            className={cn(
              'p-6 rounded-xl border-2 text-left transition-all',
              kkStatus === 'sudah-punya'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                kkStatus === 'sudah-punya' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              )}>
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Sudah Punya KK</h3>
            </div>
            <p className="text-sm text-gray-500">
              Pilih KK yang sudah ada dan tambahkan sebagai anggota keluarga
            </p>
          </button>
        </div>

        {/* Belum Punya KK - Form */}
        <AnimatePresence>
          {kkStatus === 'belum-punya' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border p-6 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Data Kartu Keluarga Baru
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nomor KK</Label>
                    <Input
                      value={newKKData.nomorKK}
                      onChange={(e) => setNewKKData(prev => ({ ...prev, nomorKK: e.target.value }))}
                      placeholder="Nomor KK"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">Auto-generate, bisa diubah</p>
                  </div>
                  <div className="space-y-1">
                    <Label>RT/RW/Dusun <span className="text-red-500">*</span></Label>
                    <Select
                      value={newKKData.rtId}
                      onValueChange={(v) => handleWilayahChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih RT/RW/Dusun" />
                      </SelectTrigger>
                      <SelectContent>
                        {wilayahOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Alamat <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={newKKData.alamat}
                    onChange={(e) => setNewKKData(prev => ({ ...prev, alamat: e.target.value }))}
                    placeholder="Alamat lengkap"
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Catatan:</strong> Penduduk ini akan otomatis menjadi Kepala Keluarga dari KK baru.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sudah Punya KK - Search */}
        <AnimatePresence>
          {kkStatus === 'sudah-punya' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border p-6 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                Cari Kartu Keluarga
              </h3>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={kkSearchQuery}
                    onChange={(e) => setKkSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan Nomor KK atau Nama Kepala Keluarga..."
                    className="pl-10"
                  />
                </div>

                {kkSearching && (
                  <div className="text-center py-4 text-gray-500">
                    Mencari...
                  </div>
                )}

                {!kkSearching && kkSearchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {kkSearchResults.map(kk => (
                      <button
                        key={kk.id}
                        onClick={() => handleSelectKK(kk)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          selectedKK?.id === kk.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm text-gray-600">{kk.nomorKK}</p>
                            <p className="font-medium text-gray-900">{kk.kepalaKeluarga}</p>
                            <p className="text-xs text-gray-500">{kk.alamat} - {kk.dusun} RT {kk.rt}/RW {kk.rw}</p>
                          </div>
                          <Badge variant="outline">{kk.jumlahAnggota} anggota</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!kkSearching && kkSearchQuery && kkSearchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Tidak ditemukan KK dengan kata kunci &quot;{kkSearchQuery}&quot;
                  </div>
                )}

                {selectedKK && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800">KK Terpilih:</p>
                    <p className="font-mono text-emerald-900">{selectedKK.nomorKK}</p>
                    <p className="text-emerald-700">{selectedKK.kepalaKeluarga}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proceed Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleProceedToForm}
            disabled={!kkStatus || (kkStatus === 'sudah-punya' && !selectedKK)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Lanjutkan
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER FORM CONTENT ====================
  const renderFormContent = () => (
    <div className="space-y-4">
      {/* Menu: Data Pribadi (Identitas + Kontak) */}
      {activeMenu === 'pribadi' && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Data Pribadi</h2>
          </div>

          {/* NIK Search - Auto-fill from existing data */}
          {showNikSearch && mode !== 'edit' && (
            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Cari Data Penduduk yang Sudah Ada</span>
              </div>
              <NIKSearch
                onSelect={handleNikSearchSelect}
                onClear={handleNikSearchClear}
                selectedPenduduk={selectedFromSearch}
                placeholder="Ketik NIK atau Nama untuk mencari data..."
                excludeIds={editingPenduduk?.id ? [editingPenduduk.id] : []}
                showLabel={false}
              />
              <p className="text-xs text-emerald-600 mt-2">
                💡 Fitur ini membantu mengisi form otomatis dari data yang sudah terdaftar di database.
              </p>
            </div>
          )}

          {/* Selected from search indicator */}
          {selectedFromSearch && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-emerald-100 rounded-lg border border-emerald-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-800">
                  <strong>Data dimuat dari database:</strong> {selectedFromSearch.namaLengkap} ({selectedFromSearch.nik})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNikSearchClear}
                className="text-emerald-600 hover:bg-emerald-200"
              >
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </motion.div>
          )}

          {/* Section: Identitas Dasar */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Identitas Dasar
            </h4>

            {/* Layout 2 Kolom: Foto Kiri - Form Kanan */}
            <div className="flex gap-6">
              {/* Kolom Kiri: Foto Penduduk */}
              <div className="flex flex-col items-center flex-shrink-0">
                <input ref={fotoInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'foto')} className="hidden" />
                {formData.foto ? (
                  <div className="relative group">
                    <img src={formData.foto} alt="Foto" className="w-32 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-sm" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, foto: '' }))} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fotoInputRef.current?.click()} className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload Foto</span>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Form Identitas */}
              <div className="flex-1 space-y-3">
                {/* Baris 1: Nama Lengkap */}
                <div className="space-y-1">
                  <Label htmlFor="namaLengkap" className="text-xs text-gray-600">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input id="namaLengkap" value={formData.namaLengkap} onChange={(e) => handleInputChange('namaLengkap', e.target.value)} placeholder="Nama lengkap sesuai KTP" className={cn('h-9', errors.namaLengkap && 'border-red-500')} />
                </div>

                {/* Baris 2: NIK, Tempat Lahir, Tanggal Lahir */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nik" className="text-xs text-gray-600">NIK <span className="text-red-500">*</span></Label>
                    <Input id="nik" value={formData.nik} onChange={(e) => handleInputChange('nik', e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="16 digit NIK" className={cn('h-9 font-mono text-sm', errors.nik && 'border-red-500')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tempatLahir" className="text-xs text-gray-600">Tempat Lahir</Label>
                    <Input id="tempatLahir" value={formData.tempatLahir} onChange={(e) => handleInputChange('tempatLahir', e.target.value)} placeholder="Jakarta" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tanggalLahir" className="text-xs text-gray-600">Tgl Lahir</Label>
                    <Input id="tanggalLahir" type="date" value={formData.tanggalLahir} onChange={(e) => handleInputChange('tanggalLahir', e.target.value)} className="h-9" />
                  </div>
                </div>

                {/* Baris 3: Jenis Kelamin, Gol Darah, Agama, Suku */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Jenis Kelamin <span className="text-red-500">*</span></Label>
                    <Select value={formData.jenisKelamin} onValueChange={(v) => handleInputChange('jenisKelamin', v)}>
                      <SelectTrigger className={cn('h-9', errors.jenisKelamin && 'border-red-500')}><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent><SelectItem value="LAKI_LAKI">Laki-laki</SelectItem><SelectItem value="PEREMPUAN">Perempuan</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Gol. Darah</Label>
                    <Select value={formData.golonganDarah} onValueChange={(v) => handleInputChange('golonganDarah', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>{golonganDarahOptions.map(gd => (<SelectItem key={gd} value={gd}>{golonganDarahLabels[gd]}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Agama</Label>
                    <Select value={formData.agama} onValueChange={(v) => handleInputChange('agama', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>{agamaOptions.map(a => (<SelectItem key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase().replace('_', ' ')}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="suku" className="text-xs text-gray-600">Suku/Etnis</Label>
                    <Input id="suku" value={formData.suku} onChange={(e) => handleInputChange('suku', e.target.value)} placeholder="Sunda" className="h-9" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Kontak */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              Kontak
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">No. HP</Label>
                <Input value={formData.noHP} onChange={(e) => handleInputChange('noHP', e.target.value)} placeholder="08xxxxxxxxxx" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="email@example.com" className="h-9" />
              </div>
            </div>
          </div>

          {/* Section: Pekerjaan & Pendidikan */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Pekerjaan & Pendidikan
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Pekerjaan</Label>
                <Input value={formData.pekerjaan} onChange={(e) => handleInputChange('pekerjaan', e.target.value)} placeholder="Masukkan pekerjaan" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Pendidikan Terakhir</Label>
                <Select value={formData.pendidikan} onValueChange={(v) => handleInputChange('pendidikan', v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{pendidikanOptions.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Penghasilan per Bulan</Label>
                <Select value={formData.penghasilan} onValueChange={(v) => handleInputChange('penghasilan', v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{penghasilanOptions.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Menu: Keluarga (Perkawinan + Keluarga) */}
      {activeMenu === 'keluarga' && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Data Keluarga</h2>
          </div>

          {/* Section: Status Perkawinan */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600" />
              Status Perkawinan
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Status Perkawinan</Label>
                <Select value={formData.statusPerkawinan} onValueChange={(v) => handleInputChange('statusPerkawinan', v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{statusPerkawinanOptions.map(s => (<SelectItem key={s} value={s}>{statusPerkawinanLabels[s]}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              {(formData.statusPerkawinan === 'KAWIN_TERCATAT' || formData.statusPerkawinan === 'CERAI_MATI') && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">No. Akta Nikah</Label>
                    <Input value={formData.aktaPerkawinan} onChange={(e) => handleInputChange('aktaPerkawinan', e.target.value)} placeholder="Akta nikah" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Tanggal Nikah</Label>
                    <Input type="date" value={formData.tanggalPerkawinan} onChange={(e) => handleInputChange('tanggalPerkawinan', e.target.value)} className="h-9" />
                  </div>
                </>
              )}
              {(formData.statusPerkawinan === 'CERAI_HIDUP_TERCATAT' || formData.statusPerkawinan === 'CERAI_HIDUP_TIDAK_TERCATAT') && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">No. Akta Cerai</Label>
                    <Input value={formData.aktaPerceraian} onChange={(e) => handleInputChange('aktaPerceraian', e.target.value)} placeholder="Akta cerai" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Tanggal Cerai</Label>
                    <Input type="date" value={formData.tanggalPerceraian} onChange={(e) => handleInputChange('tanggalPerceraian', e.target.value)} className="h-9" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: Kartu Keluarga */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              Kartu Keluarga
            </h4>

            {/* KK Info untuk mode anggota-kk */}
            {mode === 'anggota-kk' && kkInfo && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">No. KK:</span>
                    <span className="font-mono font-medium text-gray-900">{kkInfo.nomorKK}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Kepala KK:</span>
                    <span className="font-medium text-gray-900">{kkInfo.kepalaKeluarga}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Alamat:</span>
                    <span className="text-gray-900">{kkInfo.alamat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Wilayah:</span>
                    <span className="text-gray-900">{kkInfo.dusun} RT {kkInfo.rt}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Badge Kepala Keluarga untuk KK Baru */}
            {mode === 'penduduk-baru' && kkStatus === 'belum-punya' && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-800 font-medium">Kepala Keluarga (KK Baru)</span>
              </div>
            )}

            {/* Selected KK untuk mode penduduk-baru */}
            {mode === 'penduduk-baru' && selectedKK && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">No. KK:</span>
                    <span className="font-mono font-medium text-gray-900">{selectedKK.nomorKK}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Kepala KK:</span>
                    <span className="font-medium text-gray-900">{selectedKK.kepalaKeluarga}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pilihan KK untuk mode edit */}
            {mode === 'edit' && kkOptions.length > 0 && (
              <div className="space-y-1 mb-4">
                <Label className="text-xs text-gray-600">Pilih Kartu Keluarga</Label>
                <Select value={formData.kkId} onValueChange={(v) => handleInputChange('kkId', v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Pilih KK" /></SelectTrigger>
                  <SelectContent>{kkOptions.map(kk => (<SelectItem key={kk.id} value={kk.id}>{kk.nomorKK} - {kk.kepalaKeluarga}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}

            {/* Hubungan dalam Keluarga */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Hubungan dalam KK {(mode === 'anggota-kk' || mode === 'penduduk-baru') && <span className="text-red-500">*</span>}</Label>
                <Select value={formData.hubunganKeluarga} onValueChange={(v) => handleInputChange('hubunganKeluarga', v)} disabled={mode === 'penduduk-baru' && kkStatus === 'belum-punya'}>
                  <SelectTrigger className={cn('h-9', errors.hubunganKeluarga && 'border-red-500')}><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>{getHubunganKeluargaOptions().map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Anak Ke-</Label>
                <Input type="number" min="1" value={formData.anakKe} onChange={(e) => handleInputChange('anakKe', e.target.value)} placeholder="1" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Jumlah Saudara</Label>
                <Input type="number" min="0" value={formData.jumlahSaudara} onChange={(e) => handleInputChange('jumlahSaudara', e.target.value)} placeholder="0" className="h-9" />
              </div>
            </div>
          </div>

          {/* Section: Data Orang Tua */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Data Orang Tua
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Data Ayah */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Ayah</p>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Nama Ayah</Label>
                  <Input value={formData.namaAyah} onChange={(e) => handleInputChange('namaAyah', e.target.value)} placeholder="Nama ayah" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">NIK Ayah</Label>
                  <Input value={formData.nikAyah} onChange={(e) => handleInputChange('nikAyah', e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="NIK ayah" className="h-9 font-mono text-sm" />
                </div>
              </div>
              {/* Data Ibu */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Ibu</p>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Nama Ibu</Label>
                  <Input value={formData.namaIbu} onChange={(e) => handleInputChange('namaIbu', e.target.value)} placeholder="Nama ibu" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">NIK Ibu</Label>
                  <Input value={formData.nikIbu} onChange={(e) => handleInputChange('nikIbu', e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="NIK ibu" className="h-9 font-mono text-sm" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Menu: Kesehatan */}
      {activeMenu === 'kesehatan' && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Kesehatan</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Status Disabilitas</Label>
              <Select value={formData.jenisDisabilitas} onValueChange={(v) => handleInputChange('jenisDisabilitas', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{disabilitasOptions.map(d => (<SelectItem key={d} value={d}>{d === 'TIDAK_ADA' ? 'Tidak Ada' : d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {formData.jenisDisabilitas !== 'TIDAK_ADA' && (
              <div className="space-y-1">
                <Label className="text-xs">Keterangan Disabilitas</Label>
                <Input value={formData.keteranganDisabilitas} onChange={(e) => handleInputChange('keteranganDisabilitas', e.target.value)} placeholder="Keterangan" className="h-9" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Penyakit Kronis</Label>
              <Input value={formData.penyakitKronis} onChange={(e) => handleInputChange('penyakitKronis', e.target.value)} placeholder="Diabetes, dll" className="h-9" />
            </div>
          </div>
        </>
      )}

      {/* Menu: Dokumen */}
      {activeMenu === 'dokumen' && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dokumen</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">No. Akta Kelahiran</Label>
              <Input value={formData.noAktaKelahiran} onChange={(e) => handleInputChange('noAktaKelahiran', e.target.value)} placeholder="Akta lahir" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status KTP</Label>
              <Select value={formData.statusKTP} onValueChange={(v) => handleInputChange('statusKTP', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{statusKTPoptions.map(s => (<SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BPJS Kesehatan</Label>
              <Input value={formData.noBPJSKesehatan} onChange={(e) => handleInputChange('noBPJSKesehatan', e.target.value)} placeholder="No. BPJS" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BPJS TK</Label>
              <Input value={formData.noBPJSTenagakerja} onChange={(e) => handleInputChange('noBPJSTenagakerja', e.target.value)} placeholder="No. BPJS TK" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">NPWP</Label>
              <Input value={formData.npwp} onChange={(e) => handleInputChange('npwp', e.target.value)} placeholder="NPWP" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kewarganegaraan</Label>
              <Select value={formData.kewarganegaraan} onValueChange={(v) => handleInputChange('kewarganegaraan', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent><SelectItem value="WNI">WNI</SelectItem><SelectItem value="WNA">WNA</SelectItem></SelectContent>
              </Select>
            </div>
            {formData.kewarganegaraan === 'WNA' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Negara Asal <span className="text-red-500">*</span></Label>
                  <Input value={formData.negaraAsal} onChange={(e) => handleInputChange('negaraAsal', e.target.value)} placeholder="Negara" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">No. Paspor</Label>
                  <Input value={formData.noPaspor} onChange={(e) => handleInputChange('noPaspor', e.target.value)} placeholder="Paspor" className="h-9" />
                </div>
              </>
            )}
          </div>
          {formData.kewarganegaraan === 'WNA' && (
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">No. KITAS/KITAP</Label>
                <Input value={formData.noKitasKitap} onChange={(e) => handleInputChange('noKitasKitap', e.target.value)} placeholder="KITAS" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tgl Masuk Indonesia</Label>
                <Input type="date" value={formData.tanggalMasuk} onChange={(e) => handleInputChange('tanggalMasuk', e.target.value)} className="h-9" />
              </div>
            </div>
          )}
          <div className="mt-3">
            <Label className="text-xs">Scan/Foto KTP</Label>
            <input ref={fotoKTPInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'fotoKTP')} className="hidden" />
            {formData.fotoKTP ? (
              <div className="relative inline-block mt-1">
                <img src={formData.fotoKTP} alt="Foto KTP" className="h-24 object-cover rounded-lg border" />
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, fotoKTP: '' }))} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <div onClick={() => fotoKTPInputRef.current?.click()} className="mt-1 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50">
                <Upload className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-500">Upload foto KTP</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // ==================== RENDER HEADER INFO ====================
  const renderHeaderInfo = () => {
    if (mode === 'edit' && editingPenduduk) {
      // Priority: kkInfo (from KK detail page) > kkOptions > editingPenduduk.nomorKK
      const currentKK = kkOptions.find(kk => kk.id === formData.kkId);
      const nomorKK = kkInfo?.nomorKK || currentKK?.nomorKK || editingPenduduk.nomorKK;
      const kepalaKeluarga = kkInfo?.kepalaKeluarga || currentKK?.kepalaKeluarga;
      const alamatKK = kkInfo?.alamat || currentKK?.alamat;
      const rtKK = kkInfo?.rt || currentKK?.rt;
      const rwKK = kkInfo?.rw || currentKK?.rw;
      const dusunKK = kkInfo?.dusun || currentKK?.dusun;
      const jumlahAnggota = kkInfo?.jumlahAnggota || currentKK?.jumlahAnggota;
      const hasKK = !!(formData.kkId && nomorKK && nomorKK !== '-');
      
      return (
        <div className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700">
          <div className="flex items-center gap-4">
            {/* Kolom 1: Foto */}
            <div className="flex-shrink-0">
              <div className="w-[52px] h-[68px] rounded-lg border-2 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center shadow-lg">
                {formData.foto ? (
                  <img src={formData.foto} alt={editingPenduduk.namaLengkap} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white/80" />
                )}
              </div>
            </div>

            {/* Kolom 2: Nama + Status + Info */}
            <div className="flex-1 min-w-0">
              <p className="text-emerald-100 text-xs">Mengedit Data Penduduk</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-lg font-bold text-white truncate">{editingPenduduk.namaLengkap}</h2>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded",
                  formData.status === 'TETAP' ? "bg-emerald-500/40 text-white" :
                  formData.status === 'PENDATANG' ? "bg-amber-500/40 text-white" :
                  formData.status === 'PINDAH' ? "bg-orange-500/40 text-white" :
                  formData.status === 'MENINGGAL' ? "bg-red-500/40 text-white" :
                  "bg-gray-500/40 text-white"
                )}>
                  {formData.status || 'TETAP'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {editingPenduduk.nik && (
                  <span className="text-emerald-100 text-xs font-mono">NIK: {editingPenduduk.nik}</span>
                )}
                {editingPenduduk.tanggalLahir && (
                  <span className="text-emerald-200 text-xs">• {calculateAge(editingPenduduk.tanggalLahir)}</span>
                )}
              </div>
            </div>

            {/* Kolom 3: Kartu Keluarga */}
            <div className="flex-shrink-0">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                {hasKK ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/80 text-xs font-medium">Kartu Keluarga</span>
                      <Badge className="bg-white/25 text-white text-[10px] h-5 px-2">{jumlahAnggota || '-'} anggota</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-white/90">
                      {nomorKK && (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Home className="w-3 h-3 flex-shrink-0" />
                          {nomorKK}
                        </span>
                      )}
                      {kepalaKeluarga && (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <User className="w-3 h-3 flex-shrink-0" />
                          {kepalaKeluarga}
                        </span>
                      )}
                    </div>
                    {(alamatKK || dusunKK) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-white/80 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">{alamatKK}</span>
                        {rtKK && rwKK && (
                          <>
                            <span className="text-white/50">•</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">RT {rtKK}/RW {rwKK}</span>
                          </>
                        )}
                        {dusunKK && (
                          <>
                            <span className="text-white/50">•</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{dusunKK}</span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-white/70 text-center py-1">
                    Belum terdaftar dalam KK
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (mode === 'anggota-kk' && kkInfo) {
      return (
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-gray-700">No. KK:</span>
              <span className="font-mono text-emerald-700">{kkInfo.nomorKK}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-gray-700">Kepala Keluarga:</span>
              <span className="text-gray-900">{kkInfo.kepalaKeluarga}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-600">{kkInfo.dusun} - RT {kkInfo.rt}/RW {kkInfo.rw}</span>
            </div>
            <div className="ml-auto">
              <Badge className="bg-blue-100 text-blue-700">{kkInfo.jumlahAnggota} anggota terdaftar</Badge>
            </div>
          </div>
        </div>
      );
    }

    if (mode === 'penduduk-baru' && step === 'form-data') {
      return (
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
          {kkStatus === 'belum-punya' ? (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-gray-700">KK Baru:</span>
                <span className="font-mono text-emerald-700">{newKKData.nomorKK}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-gray-600">{newKKData.alamat}</span>
              </div>
              <Badge className="bg-amber-100 text-amber-700">Kepala Keluarga (otomatis)</Badge>
            </div>
          ) : selectedKK && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-gray-700">No. KK:</span>
                <span className="font-mono text-emerald-700">{selectedKK.nomorKK}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-gray-700">Kepala Keluarga:</span>
                <span className="text-gray-900">{selectedKK.kepalaKeluarga}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-gray-600">{selectedKK.dusun} - RT {selectedKK.rt}/RW {selectedKK.rw}</span>
              </div>
              <div className="ml-auto">
                <Badge className="bg-blue-100 text-blue-700">{selectedKK.jumlahAnggota} anggota terdaftar</Badge>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // ==================== RENDER SIDEBAR ====================
  const renderSidebar = () => (
    <div className="w-56 bg-gray-50 border-r flex-shrink-0 overflow-y-auto">
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          const status = getMenuStatus(item.id);

          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all relative',
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {status === 'complete' && !isActive && (
                <div className="w-2 h-2 rounded-full bg-green-500" />
              )}
              {status === 'partial' && !isActive && (
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              )}
              {isActive && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 mt-4 border-t">
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Lengkap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Sebagian</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span>Kosong</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER MAIN FORM ====================
  const renderMainForm = () => (
    <div className="flex-1 flex overflow-hidden">
      {renderSidebar()}
      <div className="flex-1 overflow-y-auto bg-white">
        <form onSubmit={handleSubmit} className="p-6">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderFormContent()}
          </motion.div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackWithConfirm}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Data'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // ==================== RENDER FULL PAGE ====================
  const renderFullPage = () => (
    <div className="flex flex-col min-h-screen">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
          <Button
            variant="ghost"
            onClick={mode === 'penduduk-baru' && step === 'form-data' ? () => setStep('pilih-kk') : handleBackWithConfirm}
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{getTitle()}</h1>
          </div>
        </div>
        {renderHeaderInfo()}
      </div>

      {/* Content */}
      {mode === 'penduduk-baru' && step === 'pilih-kk' ? (
        renderKKSelection()
      ) : (
        renderMainForm()
      )}
    </div>
  );

  // ==================== RENDER MODAL ====================
  const renderModal = () => (
    <Dialog open={true} onOpenChange={(open) => !open && handleBackWithConfirm()}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(95vh-120px)]">
          {renderSidebar()}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit}>
              <motion.div
                key={activeMenu}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderFormContent()}
              </motion.div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackWithConfirm}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Data'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================
  return (
    <>
      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
      {layout === 'modal' ? renderModal() : renderFullPage()}
    </>
  );
}
