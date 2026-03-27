'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Home,
  Users,
  MapPin,
  FileText,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Pencil,
  Printer,
  UserPlus,
  RefreshCw,
  MoreVertical,
  User,
  Download,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { AuditLogTimeline } from '@/components/kependudukan/audit-log-timeline';

interface AnggotaKeluarga {
  id: string;
  nik: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  agama: string;
  statusPerkawinan: string;
  pekerjaan: string | null;
  pendidikan: string | null;
  hubunganKeluarga: string | null;
  golonganDarah: string | null;
  kewarganegaraan: string;
  noHP: string | null;
  email: string | null;
  foto: string | null;
}

interface KKDetail {
  id: string;
  nomorKK: string;
  tanggalTerbit: string | null;
  jenisTempatTinggal: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  rtId: string | null;
  dusunId: string | null;
  latitude: string | null;
  longitude: string | null;
  scanKK: string | null;
  fotoRumah: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  anggota: AnggotaKeluarga[];
}

interface DetailKKProps {
  kkId: string;
  onBack: () => void;
  onEdit: (kk: KKDetail) => void;
  onDelete: (kk: KKDetail) => void;
  onAddAnggota: (kk: KKDetail) => void;
  onEditAnggota: (penduduk: AnggotaKeluarga, kk: KKDetail) => void;
}

const jenisTempatTinggalLabels: Record<string, string> = {
  MILIK_SENDIRI: 'Milik Sendiri',
  KONTRAK: 'Kontrak',
  SEWA: 'Sewa',
  RUMAH_ORANGTUA: 'Rumah Orang Tua',
  RUMAH_SAUDARA: 'Rumah Saudara',
  RUMAH_DINAS: 'Rumah Dinas',
  LAINNYA: 'Lainnya',
};

const hubunganKeluargaLabels: Record<string, string> = {
  KEPALA_KELUARGA: 'Kepala Keluarga',
  ISTRI: 'Istri',
  ANAK: 'Anak',
  MENANTU: 'Menantu',
  CUCU: 'Cucu',
  ORANG_TUA: 'Orang Tua',
  MERTUA: 'Mertua',
  FAMILI_LAIN: 'Famili Lain',
  PEMBANTU: 'Pembantu',
  LAINNYA: 'Lainnya',
};

const agamaLabels: Record<string, string> = {
  ISLAM: 'Islam',
  KRISTEN: 'Kristen',
  KATOLIK: 'Katolik',
  HINDU: 'Hindu',
  BUDDHA: 'Buddha',
  KONGHUCU: 'Konghucu',
  LAINNYA: 'Lainnya',
};

const statusPerkawinanLabels: Record<string, string> = {
  BELUM_KAWIN: 'Belum Kawin',
  KAWIN_TERCATAT: 'Kawin Tercatat',
  KAWIN_TIDAK_TERCATAT: 'Kawin Tidak Tercatat',
  CERAI_HIDUP_TERCATAT: 'Cerai Hidup Tercatat',
  CERAI_HIDUP_TIDAK_TERCATAT: 'Cerai Hidup Tidak Tercatat',
  CERAI_MATI: 'Cerai Mati',
};

export function DetailKK({ kkId, onBack, onEdit, onDelete, onAddAnggota, onEditAnggota }: DetailKKProps) {
  const [loading, setLoading] = useState(true);
  const [kkData, setKkData] = useState<KKDetail | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchKKDetail();
  }, [kkId]);

  const fetchKKDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kependudukan/kk/${kkId}`);
      const data = await response.json();

      if (data.success) {
        setKkData(data.data);
      } else {
        toast.error('Gagal mengambil detail KK');
      }
    } catch (error) {
      console.error('Error fetching KK detail:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!kkData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir. Mohon izinkan popup untuk mencetak.');
      return;
    }

    const kepalaKeluarga = getKepalaKeluarga();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Keluarga - ${kkData.nomorKK}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 18px; }
          .header p { margin: 5px 0; font-size: 12px; }
          .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; margin-bottom: 20px; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f0f0f0; }
          .footer { margin-top: 30px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KARTU KELUARGA</h1>
          <p>Desa Bojongpicung, Kecamatan Bojongpicung</p>
          <p>Kabupaten Cianjur, Provinsi Jawa Barat</p>
        </div>
        
        <div class="info-grid">
          <div class="info-label">Nomor KK:</div>
          <div>${kkData.nomorKK}</div>
          <div class="info-label">Kepala Keluarga:</div>
          <div>${kepalaKeluarga?.namaLengkap || '-'}</div>
          <div class="info-label">NIK:</div>
          <div>${kepalaKeluarga?.nik || '-'}</div>
          <div class="info-label">Alamat:</div>
          <div>${kkData.alamat}</div>
          <div class="info-label">RT/RW:</div>
          <div>RT ${kkData.rt} / RW ${kkData.rw}</div>
          <div class="info-label">Dusun:</div>
          <div>${kkData.dusun}</div>
        </div>
        
        <h3>Daftar Anggota Keluarga</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIK</th>
              <th>Nama Lengkap</th>
              <th>Jenis Kelamin</th>
              <th>Tempat/Tgl Lahir</th>
              <th>Hubungan</th>
              <th>Agama</th>
            </tr>
          </thead>
          <tbody>
            ${kkData.anggota?.map((a, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${a.nik}</td>
                <td>${a.namaLengkap}</td>
                <td>${a.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}</td>
                <td>${a.tempatLahir || '-'}, ${a.tanggalLahir ? new Date(a.tanggalLahir).toLocaleDateString('id-ID') : '-'}</td>
                <td>${a.hubunganKeluarga ? hubunganKeluargaLabels[a.hubunganKeluarga] || a.hubunganKeluarga : '-'}</td>
                <td>${agamaLabels[a.agama] || a.agama}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getKepalaKeluarga = () => {
    return kkData?.anggota.find(a => a.hubunganKeluarga === 'KEPALA_KELUARGA');
  };

  const formatTanggal = (tanggal: string | null) => {
    if (!tanggal) return '-';
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Generate QR Code data
  const generateQRData = () => {
    if (!kkData) return '';
    
    const kepalaKeluarga = getKepalaKeluarga();
    const qrData = {
      nomorKK: kkData.nomorKK,
      kepalaKeluarga: kepalaKeluarga?.namaLengkap || '-',
      nik: kepalaKeluarga?.nik || '-',
      alamat: kkData.alamat,
      rt: kkData.rt,
      rw: kkData.rw,
      dusun: kkData.dusun,
      jumlahAnggota: kkData.anggota.length,
    };
    
    return JSON.stringify(qrData);
  };

  // Download QR Code as PNG
  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 300, 300);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-kk-${kkData?.nomorKK || 'unknown'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR Code berhasil diunduh');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-24 bg-white/20" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 bg-white/20" />
                <Skeleton className="h-9 w-36 bg-white/20" />
                <Skeleton className="h-9 w-9 bg-white/20" />
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-5 flex-1">
                <Skeleton className="w-24 h-24 rounded-2xl" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-48" />
                  <div className="flex gap-3">
                    <Skeleton className="h-7 w-32 rounded-lg" />
                    <Skeleton className="h-7 w-32 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
              <Skeleton className="w-[72px] h-[72px] rounded-xl" />
            </div>
          </div>
          <div className="px-6 py-3 bg-black/10">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="px-6">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Info Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="mt-4 rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!kkData) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Data KK tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const kepalaKeluarga = getKepalaKeluarga();

  return (
    <div className="space-y-6">
      {/* Unified Header Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600">
          {/* Top Bar: Back button & Actions */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handlePrint}
                className="text-white hover:bg-white/10"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak
              </Button>
              <Button
                onClick={() => onAddAnggota(kkData)}
                className="bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Anggota
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(kkData)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Data KK
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(kkData)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus KK
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main Content: Photo, Info, QR */}
          <div className="px-6 py-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Photo & Basic Info */}
              <div className="flex items-center gap-5 flex-1">
                {/* Photo/Avatar Kepala Keluarga */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl border-4 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center shadow-lg">
                    {kepalaKeluarga?.foto ? (
                      <img
                        src={kepalaKeluarga.foto}
                        alt={kepalaKeluarga.namaLengkap}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white/80" />
                    )}
                  </div>
                  {/* Status indicator */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center shadow-md",
                    kkData.isActive ? "bg-green-500" : "bg-gray-400"
                  )}>
                    {kkData.isActive && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Name, NIK, KK */}
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-100 text-sm font-medium mb-1">Kepala Keluarga</p>
                  <h2 className="text-2xl font-bold text-white truncate">{kepalaKeluarga?.namaLengkap || 'Belum ada data'}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {kepalaKeluarga?.nik && (
                      <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-lg">
                        <span className="text-emerald-100 text-xs">NIK</span>
                        <span className="text-white font-mono text-sm font-medium">{kepalaKeluarga.nik}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-lg">
                      <span className="text-emerald-100 text-xs">No. KK</span>
                      <span className="text-white font-mono text-sm font-medium">{kkData.nomorKK}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-3 py-1.5 gap-1.5">
                  <Users className="w-4 h-4" />
                  {kkData.anggota.length} Anggota
                </Badge>
                <Badge className={cn(
                  'border text-sm px-3 py-1.5',
                  kkData.isActive
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                )}>
                  {kkData.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-3 py-1.5">
                  <Home className="w-4 h-4 mr-1.5" />
                  {jenisTempatTinggalLabels[kkData.jenisTempatTinggal] || kkData.jenisTempatTinggal}
                </Badge>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="bg-white p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  title="Klik untuk memperbesar"
                >
                  <QRCodeSVG
                    id="qr-code-header"
                    value={generateQRData()}
                    size={72}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#059669"
                  />
                </button>
                <span className="text-xs text-emerald-100 font-medium">QR Code</span>
              </div>
            </div>
          </div>

          {/* Address Bar */}
          <div className="px-6 py-3 bg-black/10 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                <span className="font-medium">{kkData.alamat}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-100">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-md text-xs font-medium">
                  RT {kkData.rt} / RW {kkData.rw}
                </span>
                <span className="text-emerald-200">•</span>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-md text-xs font-medium">
                  {kkData.dusun}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="info">Informasi KK</TabsTrigger>
            <TabsTrigger value="anggota">Anggota Keluarga</TabsTrigger>
            <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
            <TabsTrigger value="riwayat" className="gap-1.5">
              <History className="w-3.5 h-3.5" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informasi KK */}
          <TabsContent value="info" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Data KK */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Data Kartu Keluarga
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nomor KK</p>
                      <p className="font-mono font-medium">{kkData.nomorKK}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Terbit</p>
                      <p className="font-medium">{formatTanggal(kkData.tanggalTerbit)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jenis Tempat Tinggal</p>
                      <p className="font-medium">{jenisTempatTinggalLabels[kkData.jenisTempatTinggal] || kkData.jenisTempatTinggal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className={kkData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {kkData.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alamat */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Alamat & Wilayah
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Alamat Lengkap</p>
                    <p className="font-medium">{kkData.alamat}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Dusun</p>
                      <p className="font-medium">{kkData.dusun}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RW</p>
                      <p className="font-medium">{kkData.rw}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RT</p>
                      <p className="font-medium">{kkData.rt}</p>
                    </div>
                  </div>
                  {kkData.latitude && kkData.longitude && (
                    <div>
                      <p className="text-sm text-gray-500">Koordinat</p>
                      <p className="font-mono text-sm">{kkData.latitude}, {kkData.longitude}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Statistik Anggota */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Statistik Keluarga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{kkData.anggota.length}</p>
                    <p className="text-sm text-gray-500">Total Anggota</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {kkData.anggota.filter(a => a.jenisKelamin === 'LAKI_LAKI').length}
                    </p>
                    <p className="text-sm text-gray-500">Laki-laki</p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <p className="text-2xl font-bold text-pink-600">
                      {kkData.anggota.filter(a => a.jenisKelamin === 'PEREMPUAN').length}
                    </p>
                    <p className="text-sm text-gray-500">Perempuan</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">
                      {kkData.anggota.filter(a => a.statusPerkawinan === 'KAWIN_TERCATAT' || a.statusPerkawinan === 'KAWIN_TIDAK_TERCATAT').length}
                    </p>
                    <p className="text-sm text-gray-500">Kawin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Anggota Keluarga */}
          <TabsContent value="anggota" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {kkData.anggota.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Belum ada anggota keluarga terdaftar</p>
                    <Button
                      onClick={() => onAddAnggota(kkData)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Tambah Anggota Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIK</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama Lengkap</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jenis Kelamin</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tempat/Tgl Lahir</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hubungan</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agama</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {kkData.anggota.map((anggota, index) => (
                          <motion.tr
                            key={anggota.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-4 py-3 font-mono text-sm">{anggota.nik}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {anggota.foto ? (
                                    <img src={anggota.foto} alt={anggota.namaLengkap} className="w-full h-full object-cover" />
                                  ) : (
                                    <Users className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <p className="font-medium text-gray-900">{anggota.namaLengkap}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={anggota.jenisKelamin === 'LAKI_LAKI' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}>
                                {anggota.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {anggota.tempatLahir || '-'}, {formatTanggal(anggota.tanggalLahir)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="border-gray-300">
                                {anggota.hubunganKeluarga ? hubunganKeluargaLabels[anggota.hubunganKeluarga] || anggota.hubunganKeluarga : '-'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{agamaLabels[anggota.agama] || anggota.agama}</td>
                            <td className="px-4 py-3 text-sm">{statusPerkawinanLabels[anggota.statusPerkawinan] || anggota.statusPerkawinan}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditAnggota(anggota, kkData)}
                                  className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                                  title="Edit Data"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Dokumen */}
          <TabsContent value="dokumen" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scan KK */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Scan/Foto KK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kkData.scanKK ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={kkData.scanKK}
                        alt="Scan KK"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p>Belum ada foto/scan KK</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Foto Rumah */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5 text-emerald-600" />
                    Foto Rumah
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kkData.fotoRumah ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={kkData.fotoRumah}
                        alt="Foto Rumah"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p>Belum ada foto rumah</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Riwayat Perubahan */}
          <TabsContent value="riwayat" className="mt-4">
            <AuditLogTimeline
              kkId={kkData.id}
              title="Riwayat Perubahan Data KK"
              maxHeight="500px"
              showFilters={true}
            />
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="text-sm text-gray-400 flex items-center justify-between py-4">
          <p>Data dibuat: {formatTanggal(kkData.createdAt)}</p>
          <p>Terakhir diupdate: {formatTanggal(kkData.updatedAt)}</p>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code Kartu Keluarga</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl shadow-inner border">
              <QRCodeSVG
                id="qr-code-svg"
                value={generateQRData()}
                size={220}
                level="H"
                bgColor="#ffffff"
                fgColor="#059669"
              />
            </div>
            
            {/* QR Info */}
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">No. KK:</span> {kkData.nomorKK}</p>
              <p><span className="font-medium">Kepala Keluarga:</span> {kepalaKeluarga?.namaLengkap || '-'}</p>
            </div>

            {/* Download Button */}
            <Button
              onClick={downloadQRCode}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Unduh QR Code
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Scan QR Code untuk melihat informasi KK secara cepat
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
