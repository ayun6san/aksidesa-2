'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, MapPin, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types for search result
export interface PendudukSearchResult {
  id: string;
  nik: string;
  namaLengkap: string;
  displayText: string;
  subtitle: string;
  
  // All form fields for auto-fill
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  golonganDarah: string;
  agama: string;
  suku: string;
  statusPerkawinan: string;
  aktaPerkawinan: string;
  tanggalPerkawinan: string;
  aktaPerceraian: string;
  tanggalPerceraian: string;
  pekerjaan: string;
  pendidikan: string;
  penghasilan: string;
  kewarganegaraan: string;
  negaraAsal: string;
  noPaspor: string;
  noKitasKitap: string;
  tanggalMasuk: string;
  noAktaKelahiran: string;
  statusKTP: string;
  noBPJSKesehatan: string;
  noBPJSTenagakerja: string;
  npwp: string;
  namaAyah: string;
  nikAyah: string;
  namaIbu: string;
  nikIbu: string;
  anakKe: string;
  jumlahSaudara: string;
  kkId: string;
  nomorKK: string;
  hubunganKeluarga: string;
  urutanDalamKK: number;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  dusunId: string;
  rtId: string;
  email: string;
  noHP: string;
  jenisDisabilitas: string;
  keteranganDisabilitas: string;
  penyakitKronis: string;
  status: string;
  foto: string;
  fotoKTP: string;
}

interface NIKSearchProps {
  // Callback when penduduk is selected
  onSelect: (penduduk: PendudukSearchResult) => void;
  // Callback when search input changes
  onInputChange?: (value: string) => void;
  // Initial value (NIK or nama)
  value?: string;
  // Placeholder text
  placeholder?: string;
  // Exclude specific penduduk IDs from results
  excludeIds?: string[];
  // Disable the search
  disabled?: boolean;
  // Show selected penduduk info
  showSelectedInfo?: boolean;
  // Currently selected penduduk (for display)
  selectedPenduduk?: PendudukSearchResult | null;
  // Clear selection callback
  onClear?: () => void;
  // Custom className
  className?: string;
  // Label for the input
  label?: string;
  // Show label
  showLabel?: boolean;
  // Required field
  required?: boolean;
}

export function NIKSearch({
  onSelect,
  onInputChange,
  value = '',
  placeholder = 'Cari NIK atau Nama...',
  excludeIds = [],
  disabled = false,
  showSelectedInfo = true,
  selectedPenduduk,
  onClear,
  className,
  label = 'Cari Data Penduduk',
  showLabel = true,
  required = false,
}: NIKSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PendudukSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search function with debounce
  const searchPenduduk = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10',
      });
      
      if (excludeIds.length > 0) {
        params.append('exclude', excludeIds.join(','));
      }

      const response = await fetch(`/api/kependudukan/penduduk/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching penduduk:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPenduduk(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchPenduduk]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setHighlightedIndex(-1);
    onInputChange?.(newValue);
  };

  // Handle select
  const handleSelect = (penduduk: PendudukSearchResult) => {
    setQuery(penduduk.displayText);
    setShowDropdown(false);
    onSelect(penduduk);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    onClear?.();
  };

  // Focus input
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length >= 3) {
                searchPenduduk(query);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pl-10 pr-10 h-10',
              showDropdown && 'ring-2 ring-emerald-500 border-emerald-500'
            )}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
          {!loading && query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 mt-1">
          Ketik minimal 3 karakter (NIK atau Nama)
        </p>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Mencari...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                {results.map((penduduk, index) => (
                  <button
                    key={penduduk.id}
                    type="button"
                    onClick={() => handleSelect(penduduk)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors',
                      highlightedIndex === index && 'bg-emerald-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {penduduk.foto ? (
                          <img
                            src={penduduk.foto}
                            alt={penduduk.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {penduduk.namaLengkap}
                          </p>
                          {penduduk.hubunganKeluarga && (
                            <Badge variant="outline" className="text-xs">
                              {penduduk.hubunganKeluarga}
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-sm text-gray-600">
                          {penduduk.nik}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {penduduk.alamat || 'Alamat tidak tersedia'}
                            {penduduk.dusun && ` - ${penduduk.dusun}`}
                          </span>
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {selectedPenduduk?.id === penduduk.id && (
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 3 ? (
              <div className="p-4 text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">Tidak ditemukan</p>
                <p className="text-xs mt-1">
                  Tidak ada data dengan kata kunci &quot;{query}&quot;
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Penduduk Info */}
      {showSelectedInfo && selectedPenduduk && !showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
              {selectedPenduduk.foto ? (
                <img
                  src={selectedPenduduk.foto}
                  alt={selectedPenduduk.namaLengkap}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-emerald-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-emerald-900">
                  {selectedPenduduk.namaLengkap}
                </p>
                {selectedPenduduk.hubunganKeluarga && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    {selectedPenduduk.hubunganKeluarga}
                  </Badge>
                )}
              </div>
              <p className="font-mono text-sm text-emerald-700">
                NIK: {selectedPenduduk.nik}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-emerald-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  KK: {selectedPenduduk.nomorKK || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedPenduduk.dusun || '-'}
                </span>
              </div>
            </div>

            {/* Clear button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Success message */}
          <div className="mt-2 pt-2 border-t border-emerald-200">
            <p className="text-xs text-emerald-700 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Data otomatis terisi dari database
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default NIKSearch;
