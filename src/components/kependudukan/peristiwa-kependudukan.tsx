'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Baby,
  HeartCrack,
  ArrowRightLeft,
  Heart,
  Scale,
  Filter,
  Calendar,
  User,
  Users,
  Home,
  MapPin,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { NIKSearch, PendudukSearchResult } from '@/components/kependudukan/nik-search';

interface Peristiwa {
  id: string;
  jenisPeristiwa: string;
  pendudukId: string | null;
  penduduk: {
    id: string;
    nik: string;
    namaLengkap: string;
    jenisKelamin: string;
  } | null;
  kkId: string | null;
  kk: {
    id: string;
    nomorKK: string;
  } | null;
  tanggalPeristiwa: string | null;
  tempat: string | null;
  keterangan: string | null;
  alamatAsal: string | null;
  alamatTujuan: string | null;
  penyebabKematian: string | null;
  namaBayi: string | null;
  jenisKelaminBayi: string | null;
  beratBayi: string | null;
  panjangBayi: string | null;
  isProcessed: boolean;
  createdAt: string;
}

interface PendudukOption {
  id: string;
  nik: string;
  namaLengkap: string;
  kkId?: string;
  nomorKK?: string;
}

interface KKOption {
  id: string;
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
}

interface WilayahOption {
  id: string;
  label: string;
  dusunId: string;
}

const jenisPeristiwaOptions = [
  { value: 'KELAHIRAN', label: 'Kelahiran', icon: Baby, color: 'bg-pink-100 text-pink-700', description: 'Catat kelahiran bayi baru' },
  { value: 'KEMATIAN', label: 'Kematian', icon: HeartCrack, color: 'bg-gray-100 text-gray-700', description: 'Catat kematian penduduk' },
  { value: 'PINDAH_MASUK', label: 'Pindah Masuk', icon: ArrowRightLeft, color: 'bg-blue-100 text-blue-700', description: 'Catat pendatang baru' },
  { value: 'PINDAH_KELUAR', label: 'Pindah Keluar', icon: ArrowRightLeft, color: 'bg-amber-100 text-amber-700', description: 'Catat penduduk pindah' },
  { value: 'PERKAWINAN', label: 'Perkawinan', icon: Heart, color: 'bg-red-100 text-red-700', description: 'Catat pernikahan' },
  { value: 'PERCERAIAN', label: 'Perceraian', icon: Scale, color: 'bg-purple-100 text-purple-700', description: 'Catat perceraian' },
];

const agamaOptions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'];

export function PeristiwaKependudukan() {
  const [peristiwaList, setPeristiwaList] = useState<Peristiwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailData, setDetailData] = useState<Peristiwa | null>(null);

  // Options
  const [wilayahOptions, setWilayahOptions] = useState<WilayahOption[]>([]);
  const [kkOptions, setKKOptions] = useState<KKOption[]>([]);

  // Form states for each type
  // Kelahiran
  const [kelahiranForm, setKelahiranForm] = useState({
    namaBayi: '',
    jenisKelamin: 'LAKI_LAKI',
    tanggalLahir: new Date().toISOString().split('T')[0],
    tempatLahir: '',
    agama: 'ISLAM',
    beratBayi: '',
    panjangBayi: '',
    kkId: '',
    namaAyah: '',
    nikAyah: '',
    namaIbu: '',
    nikIbu: '',
    keterangan: '',
  });

  // Kematian
  const [selectedPendudukKematian, setSelectedPendudukKematian] = useState<PendudukSearchResult | null>(null);
  const [kematianForm, setKematianForm] = useState({
    tempat: '',
    penyebabKematian: '',
    tanggalPeristiwa: new Date().toISOString().split('T')[0],
    keterangan: '',
  });

  // Pindah Masuk
  const [pindahMasukForm, setPindahMasukForm] = useState({
    nik: '',
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'LAKI_LAKI',
    agama: 'ISLAM',
    pekerjaan: '',
    alamatAsal: '',
    kkId: '',
    hubunganKeluarga: '',
    keterangan: '',
  });

  // Pindah Keluar
  const [selectedPendudukPindah, setSelectedPendudukPindah] = useState<PendudukSearchResult | null>(null);
  const [pindahKeluarForm, setPindahKeluarForm] = useState({
    alamatTujuan: '',
    tanggalPeristiwa: new Date().toISOString().split('T')[0],
    keterangan: '',
  });

  // Perkawinan
  const [selectedPendudukPerkawinan, setSelectedPendudukPerkawinan] = useState<PendudukSearchResult | null>(null);
  const [perkawinanForm, setPerkawinanForm] = useState({
    tanggalPerkawinan: new Date().toISOString().split('T')[0],
    tempat: '',
    namaPasangan: '',
    aktaPerkawinan: '',
    keterangan: '',
  });

  // Perceraian
  const [selectedPendudukPerceraian, setSelectedPendudukPerceraian] = useState<PendudukSearchResult | null>(null);
  const [perceraianForm, setPerceraianForm] = useState({
    tanggalPerceraian: new Date().toISOString().split('T')[0],
    aktaPerceraian: '',
    buatKKBaru: false,
    alamatBaru: '',
    rtId: '',
    keterangan: '',
  });

  // Fetch wilayah options
  const fetchWilayah = useCallback(async (retries = 3) => {
    try {
      const response = await fetch('/api/wilayah');
      if (!response.ok) throw new Error('Network response was not ok');
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
      // Retry with exponential backoff
      if (retries > 0) {
        setTimeout(() => fetchWilayah(retries - 1), 1000);
      }
    }
  }, []);

  // Fetch KK options
  const fetchKK = useCallback(async (retries = 3) => {
    try {
      const response = await fetch('/api/kependudukan/kk?limit=1000');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.success) {
        setKKOptions(data.data.map((kk: any) => ({
          id: kk.id,
          nomorKK: kk.nomorKK,
          kepalaKeluarga: kk.kepalaKeluarga,
          alamat: kk.alamat,
        })));
      }
    } catch (error) {
      console.error('Error fetching KK:', error);
      // Retry with exponential backoff
      if (retries > 0) {
        setTimeout(() => fetchKK(retries - 1), 1000);
      }
    }
  }, []);

  // Fetch peristiwa list
  const fetchPeristiwa = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterJenis) params.append('jenisPeristiwa', filterJenis);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/kependudukan/peristiwa?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPeristiwaList(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching Peristiwa:', error);
      toast.error('Gagal mengambil data Peristiwa');
    } finally {
      setLoading(false);
    }
  }, [search, filterJenis, page]);

  useEffect(() => {
    fetchWilayah();
    fetchKK();
  }, [fetchWilayah, fetchKK]);

  useEffect(() => {
    fetchPeristiwa();
  }, [fetchPeristiwa]);

  // Reset all forms
  const resetAllForms = () => {
    setSelectedJenis(null);
    setKelahiranForm({
      namaBayi: '', jenisKelamin: 'LAKI_LAKI', tanggalLahir: new Date().toISOString().split('T')[0],
      tempatLahir: '', agama: 'ISLAM', beratBayi: '', panjangBayi: '', kkId: '',
      namaAyah: '', nikAyah: '', namaIbu: '', nikIbu: '', keterangan: ''
    });
    setSelectedPendudukKematian(null);
    setKematianForm({ tempat: '', penyebabKematian: '', tanggalPeristiwa: new Date().toISOString().split('T')[0], keterangan: '' });
    setPindahMasukForm({
      nik: '', namaLengkap: '', tempatLahir: '', tanggalLahir: '', jenisKelamin: 'LAKI_LAKI',
      agama: 'ISLAM', pekerjaan: '', alamatAsal: '', kkId: '', hubunganKeluarga: '', keterangan: ''
    });
    setSelectedPendudukPindah(null);
    setPindahKeluarForm({ alamatTujuan: '', tanggalPeristiwa: new Date().toISOString().split('T')[0], keterangan: '' });
    setSelectedPendudukPerkawinan(null);
    setPerkawinanForm({ tanggalPerkawinan: new Date().toISOString().split('T')[0], tempat: '', namaPasangan: '', aktaPerkawinan: '', keterangan: '' });
    setSelectedPendudukPerceraian(null);
    setPerceraianForm({ tanggalPerceraian: new Date().toISOString().split('T')[0], aktaPerceraian: '', buatKKBaru: false, alamatBaru: '', rtId: '', keterangan: '' });
  };

  // Open add modal
  const openAddModal = () => {
    resetAllForms();
    setShowForm(true);
  };

  // Handle Kelahiran submit
  const handleKelahiranSubmit = async () => {
    if (!kelahiranForm.namaBayi) {
      toast.error('Nama bayi wajib diisi');
      return;
    }
    if (!kelahiranForm.kkId) {
      toast.error('Kartu Keluarga wajib dipilih');
      return;
    }

    setSubmitting(true);
    try {
      // Generate NIK for baby (simplified - in real app would follow proper NIK format)
      const generateNIK = () => {
        const base = '320117';
        const datePart = kelahiranForm.tanggalLahir.replace(/-/g, '').slice(2);
        const random = Math.floor(Math.random() * 4000);
        return `${base}${datePart}${String(random).padStart(4, '0')}`;
      };

      // Create penduduk for baby
      const pendudukResponse = await fetch('/api/kependudukan/penduduk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: generateNIK(),
          namaLengkap: kelahiranForm.namaBayi,
          tanggalLahir: kelahiranForm.tanggalLahir,
          tempatLahir: kelahiranForm.tempatLahir,
          jenisKelamin: kelahiranForm.jenisKelamin,
          agama: kelahiranForm.agama,
          kkId: kelahiranForm.kkId,
          hubunganKeluarga: 'Anak',
          status: 'TETAP',
          namaAyah: kelahiranForm.namaAyah,
          nikAyah: kelahiranForm.nikAyah,
          namaIbu: kelahiranForm.namaIbu,
          nikIbu: kelahiranForm.nikIbu,
        }),
      });

      const pendudukResult = await pendudukResponse.json();

      if (!pendudukResult.success) {
        toast.error(pendudukResult.error || 'Gagal membuat data penduduk');
        return;
      }

      // Create peristiwa kelahiran
      await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisPeristiwa: 'KELAHIRAN',
          pendudukId: pendudukResult.data.id,
          kkId: kelahiranForm.kkId,
          tanggalPeristiwa: kelahiranForm.tanggalLahir,
          namaBayi: kelahiranForm.namaBayi,
          jenisKelaminBayi: kelahiranForm.jenisKelamin,
          beratBayi: kelahiranForm.beratBayi,
          panjangBayi: kelahiranForm.panjangBayi,
          keterangan: kelahiranForm.keterangan,
          isProcessed: true,
        }),
      });

      toast.success('Data kelahiran berhasil disimpan', {
        description: `Penduduk baru: ${kelahiranForm.namaBayi} (Status: TETAP)`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      setShowForm(false);
      resetAllForms();
      fetchPeristiwa();
    } catch (error) {
      console.error('Error submitting kelahiran:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Kematian submit
  const handleKematianSubmit = async () => {
    if (!selectedPendudukKematian) {
      toast.error('Pilih penduduk terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      // Update penduduk status to MENINGGAL
      await fetch(`/api/kependudukan/penduduk/${selectedPendudukKematian.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'MENINGGAL' }),
      });

      // Create peristiwa kematian
      await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisPeristiwa: 'KEMATIAN',
          pendudukId: selectedPendudukKematian.id,
          tanggalPeristiwa: kematianForm.tanggalPeristiwa,
          tempat: kematianForm.tempat,
          penyebabKematian: kematianForm.penyebabKematian,
          keterangan: kematianForm.keterangan,
          isProcessed: true,
        }),
      });

      toast.success('Data kematian berhasil disimpan', {
        description: `Status ${selectedPendudukKematian.namaLengkap} diubah menjadi MENINGGAL`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      setShowForm(false);
      resetAllForms();
      fetchPeristiwa();
    } catch (error) {
      console.error('Error submitting kematian:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Pindah Masuk submit
  const handlePindahMasukSubmit = async () => {
    if (!pindahMasukForm.namaLengkap) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }
    if (!pindahMasukForm.kkId) {
      toast.error('Kartu Keluarga wajib dipilih');
      return;
    }

    setSubmitting(true);
    try {
      // Generate NIK if not provided
      const nik = pindahMasukForm.nik || (() => {
        const base = '320117';
        const random = Math.floor(Math.random() * 900000);
        return `${base}${String(random).padStart(10, '0')}`;
      })();

      // Create new penduduk
      const pendudukResponse = await fetch('/api/kependudukan/penduduk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: nik,
          namaLengkap: pindahMasukForm.namaLengkap,
          tempatLahir: pindahMasukForm.tempatLahir,
          tanggalLahir: pindahMasukForm.tanggalLahir,
          jenisKelamin: pindahMasukForm.jenisKelamin,
          agama: pindahMasukForm.agama,
          pekerjaan: pindahMasukForm.pekerjaan,
          kkId: pindahMasukForm.kkId,
          hubunganKeluarga: pindahMasukForm.hubunganKeluarga,
          status: 'TETAP', // Pindah masuk = status TETAP
        }),
      });

      const pendudukResult = await pendudukResponse.json();

      if (!pendudukResult.success) {
        toast.error(pendudukResult.error || 'Gagal membuat data penduduk');
        return;
      }

      // Create peristiwa pindah masuk
      await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisPeristiwa: 'PINDAH_MASUK',
          pendudukId: pendudukResult.data.id,
          kkId: pindahMasukForm.kkId,
          tanggalPeristiwa: new Date().toISOString().split('T')[0],
          alamatAsal: pindahMasukForm.alamatAsal,
          keterangan: pindahMasukForm.keterangan,
          isProcessed: true,
        }),
      });

      toast.success('Data pindah masuk berhasil disimpan', {
        description: `Penduduk baru: ${pindahMasukForm.namaLengkap} (Status: TETAP)`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      setShowForm(false);
      resetAllForms();
      fetchPeristiwa();
    } catch (error) {
      console.error('Error submitting pindah masuk:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Pindah Keluar submit
  const handlePindahKeluarSubmit = async () => {
    if (!selectedPendudukPindah) {
      toast.error('Pilih penduduk terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      // Update penduduk status to PINDAH
      await fetch(`/api/kependudukan/penduduk/${selectedPendudukPindah.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PINDAH' }),
      });

      // Create peristiwa pindah keluar
      await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisPeristiwa: 'PINDAH_KELUAR',
          pendudukId: selectedPendudukPindah.id,
          tanggalPeristiwa: pindahKeluarForm.tanggalPeristiwa,
          alamatTujuan: pindahKeluarForm.alamatTujuan,
          keterangan: pindahKeluarForm.keterangan,
          isProcessed: true,
        }),
      });

      toast.success('Data pindah keluar berhasil disimpan', {
        description: `Status ${selectedPendudukPindah.namaLengkap} diubah menjadi PINDAH`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      setShowForm(false);
      resetAllForms();
      fetchPeristiwa();
    } catch (error) {
      console.error('Error submitting pindah keluar:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Perkawinan submit
  const handlePerkawinanSubmit = async () => {
    if (!selectedPendudukPerkawinan) {
      toast.error('Pilih penduduk terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      // Update penduduk status perkawinan
      await fetch(`/api/kependudukan/penduduk/${selectedPendudukPerkawinan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusPerkawinan: 'KAWIN',
          tanggalPerkawinan: perkawinanForm.tanggalPerkawinan,
          aktaPerkawinan: perkawinanForm.aktaPerkawinan,
        }),
      });

      // Create peristiwa perkawinan
      await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisPeristiwa: 'PERKAWINAN',
          pendudukId: selectedPendudukPerkawinan.id,
          tanggalPeristiwa: perkawinanForm.tanggalPerkawinan,
          tempat: perkawinanForm.tempat,
          keterangan: `Pasangan: ${perkawinanForm.namaPasangan}. ${perkawinanForm.keterangan}`,
          isProcessed: true,
        }),
      });

      toast.success('Data perkawinan berhasil disimpan', {
        description: `Status perkawinan ${selectedPendudukPerkawinan.namaLengkap} diubah menjadi KAWIN`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      setShowForm(false);
      resetAllForms();
      fetchPeristiwa();
    } catch (error) {
      console.error('Error submitting perkawinan:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Perceraian submit
  const handlePerceraianSubmit = async () => {
    if (!selectedPendudukPerceraian) {
      toast.error('Pilih penduduk terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      let newKKId = null;

      // If creating new KK
      if (perceraianForm.buatKKBaru && perceraianForm.alamatBaru && perceraianForm.rtId) {
        const kkResponse = await fetch('/api/kependudukan/kk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomorKK: `320117${Date.now().toString().slice(-10)}`,
            alamat: perceraianForm.alamatBaru,
            rtId: perceraianForm.rtId,
            jenisTempatTinggal: 'MILIK_SENDIRI',
          }),
        });
        const kkResult = await kkResponse.json();
        if (kkResult.success) {
          newKKId = kkResult.data.id;
        }
      }

      // Update penduduk status perkawinan and optionally KK
      const statusPerceraian = perceraianForm.aktaPerceraian 
        ? 'CERAI_HIDUP_TERCATAT' 
        : 'CERAI_HIDUP_TIDAK_TERCATAT';
      await fetch(`/api/kependudukan/penduduk/${selectedPendudukPerceraian.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusPerkawinan: statusPerceraian,
          tanggalPerceraian: perceraianForm.tanggalPerceraian,
          aktaPerceraian: perceraianForm.aktaPerceraian,
          hubunganKeluarga: 'KEPALA_KELUARGA',
          ...(newKKId ? { kkId: newKKId } : {}),
        }),
      });

      // Create peristiwa perceraian
      await fetch('/api/kependudukan/peristiwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisPeristiwa: 'PERCERAIAN',
          pendudukId: selectedPendudukPerceraian.id,
          kkId: newKKId,
          tanggalPeristiwa: perceraianForm.tanggalPerceraian,
          keterangan: `${perceraianForm.buatKKBaru ? 'KK baru dibuat. ' : ''}${perceraianForm.keterangan}`,
          isProcessed: true,
        }),
      });

      toast.success('Data perceraian berhasil disimpan', {
        description: `Status ${selectedPendudukPerceraian.namaLengkap} diubah menjadi CERAI_HIDUP${newKKId ? ' dengan KK baru' : ''}`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      setShowForm(false);
      resetAllForms();
      fetchPeristiwa();
    } catch (error) {
      console.error('Error submitting perceraian:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // View detail
  const handleViewDetail = (peristiwa: Peristiwa) => {
    setDetailData(peristiwa);
    setShowDetail(true);
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

  // Get jenis peristiwa badge
  const getJenisBadge = (jenis: string) => {
    const config = jenisPeristiwaOptions.find(j => j.value === jenis);
    if (!config) return <Badge>{jenis}</Badge>;
    const Icon = config.icon;
    return (
      <Badge className={cn('gap-1', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Render form based on jenis peristiwa
  const renderForm = () => {
    if (!selectedJenis) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {jenisPeristiwaOptions.map((jenis) => {
            const Icon = jenis.icon;
            return (
              <button
                key={jenis.value}
                onClick={() => setSelectedJenis(jenis.value)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
                  'hover:border-emerald-300 hover:bg-emerald-50'
                )}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', jenis.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-gray-900">{jenis.label}</p>
                <p className="text-xs text-gray-500 mt-1">{jenis.description}</p>
              </button>
            );
          })}
        </div>
      );
    }

    const selectedConfig = jenisPeristiwaOptions.find(j => j.value === selectedJenis);

    return (
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedJenis(null)}
          >
            ← Kembali
          </Button>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', selectedConfig?.color)}>
            {selectedConfig && <selectedConfig.icon className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold">{selectedConfig?.label}</h3>
            <p className="text-xs text-gray-500">{selectedConfig?.description}</p>
          </div>
        </div>

        {/* Kelahiran Form */}
        {selectedJenis === 'KELAHIRAN' && (
          <div className="space-y-4">
            <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-sm text-pink-800">
                <strong>Info:</strong> Data bayi akan otomatis terdaftar sebagai penduduk dengan status <Badge className="ml-1 bg-emerald-100 text-emerald-700">TETAP</Badge>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Bayi <span className="text-red-500">*</span></Label>
                <Input
                  value={kelahiranForm.namaBayi}
                  onChange={(e) => setKelahiranForm({ ...kelahiranForm, namaBayi: e.target.value })}
                  placeholder="Nama lengkap bayi"
                />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select
                  value={kelahiranForm.jenisKelamin}
                  onValueChange={(v) => setKelahiranForm({ ...kelahiranForm, jenisKelamin: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={kelahiranForm.tanggalLahir}
                  onChange={(e) => setKelahiranForm({ ...kelahiranForm, tanggalLahir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempat Lahir</Label>
                <Input
                  value={kelahiranForm.tempatLahir}
                  onChange={(e) => setKelahiranForm({ ...kelahiranForm, tempatLahir: e.target.value })}
                  placeholder="RS/Bidan/Puskesmas"
                />
              </div>
              <div className="space-y-2">
                <Label>Agama</Label>
                <Select
                  value={kelahiranForm.agama}
                  onValueChange={(v) => setKelahiranForm({ ...kelahiranForm, agama: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {agamaOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kartu Keluarga <span className="text-red-500">*</span></Label>
                <Select
                  value={kelahiranForm.kkId}
                  onValueChange={(v) => setKelahiranForm({ ...kelahiranForm, kkId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih KK" /></SelectTrigger>
                  <SelectContent>
                    {kkOptions.map(kk => (
                      <SelectItem key={kk.id} value={kk.id}>
                        {kk.nomorKK} - {kk.kepalaKeluarga}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Data Orang Tua</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Ayah</Label>
                  <Input
                    value={kelahiranForm.namaAyah}
                    onChange={(e) => setKelahiranForm({ ...kelahiranForm, namaAyah: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIK Ayah</Label>
                  <Input
                    value={kelahiranForm.nikAyah}
                    onChange={(e) => setKelahiranForm({ ...kelahiranForm, nikAyah: e.target.value })}
                    maxLength={16}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Ibu</Label>
                  <Input
                    value={kelahiranForm.namaIbu}
                    onChange={(e) => setKelahiranForm({ ...kelahiranForm, namaIbu: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIK Ibu</Label>
                  <Input
                    value={kelahiranForm.nikIbu}
                    onChange={(e) => setKelahiranForm({ ...kelahiranForm, nikIbu: e.target.value })}
                    maxLength={16}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Berat Bayi (kg)</Label>
                <Input
                  value={kelahiranForm.beratBayi}
                  onChange={(e) => setKelahiranForm({ ...kelahiranForm, beratBayi: e.target.value })}
                  placeholder="3.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Panjang Bayi (cm)</Label>
                <Input
                  value={kelahiranForm.panjangBayi}
                  onChange={(e) => setKelahiranForm({ ...kelahiranForm, panjangBayi: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={kelahiranForm.keterangan}
                onChange={(e) => setKelahiranForm({ ...kelahiranForm, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                type="button"
                onClick={handleKelahiranSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Simpan Kelahiran
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Kematian Form */}
        {selectedJenis === 'KEMATIAN' && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700">
                <strong>Info:</strong> Status penduduk akan diubah menjadi <Badge className="ml-1 bg-gray-200 text-gray-700">MENINGGAL</Badge>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pilih Penduduk <span className="text-red-500">*</span></Label>
              <NIKSearch
                onSelect={(p) => setSelectedPendudukKematian(p)}
                selectedPenduduk={selectedPendudukKematian}
                onClear={() => setSelectedPendudukKematian(null)}
                placeholder="Cari NIK atau nama penduduk..."
              />
            </div>

            {selectedPendudukKematian && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900">{selectedPendudukKematian.namaLengkap}</p>
                <p className="text-sm text-blue-700">NIK: {selectedPendudukKematian.nik}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Kematian</Label>
                <Input
                  type="date"
                  value={kematianForm.tanggalPeristiwa}
                  onChange={(e) => setKematianForm({ ...kematianForm, tanggalPeristiwa: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempat</Label>
                <Input
                  value={kematianForm.tempat}
                  onChange={(e) => setKematianForm({ ...kematianForm, tempat: e.target.value })}
                  placeholder="RS/Rumah/etc"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Penyebab Kematian</Label>
              <Input
                value={kematianForm.penyebabKematian}
                onChange={(e) => setKematianForm({ ...kematianForm, penyebabKematian: e.target.value })}
                placeholder="Penyebab kematian"
              />
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={kematianForm.keterangan}
                onChange={(e) => setKematianForm({ ...kematianForm, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                type="button"
                onClick={handleKematianSubmit}
                disabled={submitting || !selectedPendudukKematian}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Simpan Kematian
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Pindah Masuk Form */}
        {selectedJenis === 'PINDAH_MASUK' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Data akan terdaftar sebagai penduduk baru dengan status <Badge className="ml-1 bg-emerald-100 text-emerald-700">TETAP</Badge>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK</Label>
                <Input
                  value={pindahMasukForm.nik}
                  onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  placeholder="16 digit NIK (opsional)"
                  maxLength={16}
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input
                  value={pindahMasukForm.namaLengkap}
                  onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, namaLengkap: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempat Lahir</Label>
                <Input
                  value={pindahMasukForm.tempatLahir}
                  onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, tempatLahir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={pindahMasukForm.tanggalLahir}
                  onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, tanggalLahir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select
                  value={pindahMasukForm.jenisKelamin}
                  onValueChange={(v) => setPindahMasukForm({ ...pindahMasukForm, jenisKelamin: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agama</Label>
                <Select
                  value={pindahMasukForm.agama}
                  onValueChange={(v) => setPindahMasukForm({ ...pindahMasukForm, agama: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {agamaOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pekerjaan</Label>
                <Input
                  value={pindahMasukForm.pekerjaan}
                  onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, pekerjaan: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kartu Keluarga <span className="text-red-500">*</span></Label>
                <Select
                  value={pindahMasukForm.kkId}
                  onValueChange={(v) => setPindahMasukForm({ ...pindahMasukForm, kkId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih KK" /></SelectTrigger>
                  <SelectContent>
                    {kkOptions.map(kk => (
                      <SelectItem key={kk.id} value={kk.id}>
                        {kk.nomorKK} - {kk.kepalaKeluarga}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hubungan Keluarga</Label>
                <Select
                  value={pindahMasukForm.hubunganKeluarga}
                  onValueChange={(v) => setPindahMasukForm({ ...pindahMasukForm, hubunganKeluarga: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih hubungan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kepala Keluarga">Kepala Keluarga</SelectItem>
                    <SelectItem value="Istri">Istri</SelectItem>
                    <SelectItem value="Anak">Anak</SelectItem>
                    <SelectItem value="Menantu">Menantu</SelectItem>
                    <SelectItem value="Cucu">Cucu</SelectItem>
                    <SelectItem value="Orang Tua">Orang Tua</SelectItem>
                    <SelectItem value="Famili Lain">Famili Lain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alamat Asal</Label>
              <Textarea
                value={pindahMasukForm.alamatAsal}
                onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, alamatAsal: e.target.value })}
                placeholder="Alamat sebelum pindah"
              />
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={pindahMasukForm.keterangan}
                onChange={(e) => setPindahMasukForm({ ...pindahMasukForm, keterangan: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                type="button"
                onClick={handlePindahMasukSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Simpan Pindah Masuk
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Pindah Keluar Form */}
        {selectedJenis === 'PINDAH_KELUAR' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Info:</strong> Status penduduk akan diubah menjadi <Badge className="ml-1 bg-amber-100 text-amber-700">PINDAH</Badge>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pilih Penduduk <span className="text-red-500">*</span></Label>
              <NIKSearch
                onSelect={(p) => setSelectedPendudukPindah(p)}
                selectedPenduduk={selectedPendudukPindah}
                onClear={() => setSelectedPendudukPindah(null)}
                placeholder="Cari NIK atau nama penduduk..."
              />
            </div>

            {selectedPendudukPindah && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900">{selectedPendudukPindah.namaLengkap}</p>
                <p className="text-sm text-blue-700">NIK: {selectedPendudukPindah.nik}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Pindah</Label>
                <Input
                  type="date"
                  value={pindahKeluarForm.tanggalPeristiwa}
                  onChange={(e) => setPindahKeluarForm({ ...pindahKeluarForm, tanggalPeristiwa: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alamat Tujuan</Label>
              <Textarea
                value={pindahKeluarForm.alamatTujuan}
                onChange={(e) => setPindahKeluarForm({ ...pindahKeluarForm, alamatTujuan: e.target.value })}
                placeholder="Alamat tujuan pindah"
              />
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={pindahKeluarForm.keterangan}
                onChange={(e) => setPindahKeluarForm({ ...pindahKeluarForm, keterangan: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                type="button"
                onClick={handlePindahKeluarSubmit}
                disabled={submitting || !selectedPendudukPindah}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Simpan Pindah Keluar
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Perkawinan Form */}
        {selectedJenis === 'PERKAWINAN' && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Info:</strong> Status perkawinan akan diubah menjadi <Badge className="ml-1 bg-red-100 text-red-700">KAWIN</Badge>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pilih Penduduk <span className="text-red-500">*</span></Label>
              <NIKSearch
                onSelect={(p) => setSelectedPendudukPerkawinan(p)}
                selectedPenduduk={selectedPendudukPerkawinan}
                onClear={() => setSelectedPendudukPerkawinan(null)}
                placeholder="Cari NIK atau nama penduduk..."
              />
            </div>

            {selectedPendudukPerkawinan && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900">{selectedPendudukPerkawinan.namaLengkap}</p>
                <p className="text-sm text-blue-700">NIK: {selectedPendudukPerkawinan.nik}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Perkawinan</Label>
                <Input
                  type="date"
                  value={perkawinanForm.tanggalPerkawinan}
                  onChange={(e) => setPerkawinanForm({ ...perkawinanForm, tanggalPerkawinan: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempat</Label>
                <Input
                  value={perkawinanForm.tempat}
                  onChange={(e) => setPerkawinanForm({ ...perkawinanForm, tempat: e.target.value })}
                  placeholder="KUA/Masjid/Gereja/etc"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pasangan</Label>
                <Input
                  value={perkawinanForm.namaPasangan}
                  onChange={(e) => setPerkawinanForm({ ...perkawinanForm, namaPasangan: e.target.value })}
                  placeholder="Nama pasangan"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Akta Perkawinan</Label>
                <Input
                  value={perkawinanForm.aktaPerkawinan}
                  onChange={(e) => setPerkawinanForm({ ...perkawinanForm, aktaPerkawinan: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={perkawinanForm.keterangan}
                onChange={(e) => setPerkawinanForm({ ...perkawinanForm, keterangan: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                type="button"
                onClick={handlePerkawinanSubmit}
                disabled={submitting || !selectedPendudukPerkawinan}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Simpan Perkawinan
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Perceraian Form */}
        {selectedJenis === 'PERCERAIAN' && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <strong>Info:</strong> Status perkawinan akan diubah menjadi <Badge className="ml-1 bg-purple-100 text-purple-700">CERAI HIDUP</Badge>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pilih Penduduk <span className="text-red-500">*</span></Label>
              <NIKSearch
                onSelect={(p) => setSelectedPendudukPerceraian(p)}
                selectedPenduduk={selectedPendudukPerceraian}
                onClear={() => setSelectedPendudukPerceraian(null)}
                placeholder="Cari NIK atau nama penduduk..."
              />
            </div>

            {selectedPendudukPerceraian && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900">{selectedPendudukPerceraian.namaLengkap}</p>
                <p className="text-sm text-blue-700">NIK: {selectedPendudukPerceraian.nik}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Perceraian</Label>
                <Input
                  type="date"
                  value={perceraianForm.tanggalPerceraian}
                  onChange={(e) => setPerceraianForm({ ...perceraianForm, tanggalPerceraian: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>No. Akta Perceraian</Label>
                <Input
                  value={perceraianForm.aktaPerceraian}
                  onChange={(e) => setPerceraianForm({ ...perceraianForm, aktaPerceraian: e.target.value })}
                />
              </div>
            </div>

            {/* Option to create new KK */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="buatKKBaru"
                  checked={perceraianForm.buatKKBaru}
                  onChange={(e) => setPerceraianForm({ ...perceraianForm, buatKKBaru: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="buatKKBaru" className="cursor-pointer">
                  Buat KK baru untuk penduduk ini
                </Label>
              </div>

              {perceraianForm.buatKKBaru && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label>Alamat Baru</Label>
                    <Input
                      value={perceraianForm.alamatBaru}
                      onChange={(e) => setPerceraianForm({ ...perceraianForm, alamatBaru: e.target.value })}
                      placeholder="Alamat untuk KK baru"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RT/RW/Dusun</Label>
                    <Select
                      value={perceraianForm.rtId}
                      onValueChange={(v) => setPerceraianForm({ ...perceraianForm, rtId: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih RT/RW/Dusun" /></SelectTrigger>
                      <SelectContent>
                        {wilayahOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={perceraianForm.keterangan}
                onChange={(e) => setPerceraianForm({ ...perceraianForm, keterangan: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                type="button"
                onClick={handlePerceraianSubmit}
                disabled={submitting || !selectedPendudukPerceraian}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Simpan Perceraian
              </Button>
            </DialogFooter>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Peristiwa Kependudukan</h2>
          <p className="text-gray-500 mt-1">Catat kelahiran, kematian, perpindahan, dan pernikahan</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Peristiwa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {jenisPeristiwaOptions.map((jenis) => {
              const count = peristiwaList.filter(p => p.jenisPeristiwa === jenis.value).length;
              const Icon = jenis.icon;
              return (
                <Card key={jenis.value} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', jenis.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{jenis.label}</p>
                        <p className="text-xl font-bold text-gray-900">{count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                placeholder="Cari nama atau keterangan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={filterJenis}
              onValueChange={(value) => {
                setFilterJenis(value === 'all' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {jenisPeristiwaOptions.map((jenis) => (
                  <SelectItem key={jenis.value} value={jenis.value}>
                    {jenis.label}
                  </SelectItem>
                ))}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis Peristiwa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Keterangan</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                      <td className="px-4 py-3"><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-20 rounded-full mx-auto" /></td>
                      <td className="px-4 py-3"><div className="flex items-center justify-center"><Skeleton className="h-8 w-8 rounded" /></div></td>
                    </tr>
                  ))
                ) : peristiwaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-10 h-10 text-gray-300" />
                        <span className="text-gray-500">Tidak ada data peristiwa</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  peristiwaList.map((peristiwa, index) => (
                    <motion.tr
                      key={peristiwa.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">{(page - 1) * 10 + index + 1}</td>
                      <td className="px-4 py-3">{getJenisBadge(peristiwa.jenisPeristiwa)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {peristiwa.jenisPeristiwa === 'KELAHIRAN' ? peristiwa.namaBayi : peristiwa.penduduk?.namaLengkap || '-'}
                        </p>
                        {peristiwa.jenisPeristiwa !== 'KELAHIRAN' && peristiwa.penduduk && (
                          <p className="text-xs text-gray-500">NIK: {peristiwa.penduduk.nik}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(peristiwa.tanggalPeristiwa)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{peristiwa.keterangan || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={peristiwa.isProcessed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                          {peristiwa.isProcessed ? 'Diproses' : 'Belum'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(peristiwa)}
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Sebelumnya</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn('w-8 h-8 p-0', page === pageNum && 'bg-emerald-600 hover:bg-emerald-700')}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Selanjutnya</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Peristiwa Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Peristiwa Kependudukan</DialogTitle>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Peristiwa</DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {getJenisBadge(detailData.jenisPeristiwa)}
                <Badge className={detailData.isProcessed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {detailData.isProcessed ? 'Diproses' : 'Belum Diproses'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-medium">{formatDate(detailData.tanggalPeristiwa)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempat</p>
                  <p className="font-medium">{detailData.tempat || '-'}</p>
                </div>
                {detailData.jenisPeristiwa === 'KELAHIRAN' && (
                  <>
                    <div><p className="text-sm text-gray-500">Nama Bayi</p><p className="font-medium">{detailData.namaBayi}</p></div>
                    <div><p className="text-sm text-gray-500">Jenis Kelamin</p><p className="font-medium">{detailData.jenisKelaminBayi === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</p></div>
                  </>
                )}
                {detailData.jenisPeristiwa === 'KEMATIAN' && (
                  <>
                    <div className="col-span-2"><p className="text-sm text-gray-500">Almarhum/Almarhumah</p><p className="font-medium">{detailData.penduduk?.namaLengkap || '-'}</p></div>
                    <div className="col-span-2"><p className="text-sm text-gray-500">Penyebab</p><p className="font-medium">{detailData.penyebabKematian || '-'}</p></div>
                  </>
                )}
                {(detailData.jenisPeristiwa === 'PINDAH_MASUK' || detailData.jenisPeristiwa === 'PINDAH_KELUAR') && (
                  <>
                    <div className="col-span-2"><p className="text-sm text-gray-500">Alamat Asal</p><p className="font-medium">{detailData.alamatAsal || '-'}</p></div>
                    <div className="col-span-2"><p className="text-sm text-gray-500">Alamat Tujuan</p><p className="font-medium">{detailData.alamatTujuan || '-'}</p></div>
                  </>
                )}
                {detailData.keterangan && (
                  <div className="col-span-2"><p className="text-sm text-gray-500">Keterangan</p><p className="font-medium">{detailData.keterangan}</p></div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
