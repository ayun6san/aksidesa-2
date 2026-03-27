'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, X, Loader2, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RFIDCard {
  id: string;
  cardUid: string;
  cardName: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface RFIDRegistrationProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RFIDRegistration({ userId, userName, onClose, onSuccess }: RFIDRegistrationProps) {
  const [cards, setCards] = useState<RFIDCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardUid, setCardUid] = useState('');
  const [cardName, setCardName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch existing cards
  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rfid?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setCards(data.data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Gagal mengambil data kartu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [userId]);

  // Register new card
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardUid.trim()) {
      toast.error('Card UID wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/rfid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cardUid: cardUid.trim().toUpperCase(),
          cardName: cardName.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Kartu RFID berhasil didaftarkan');
        setCardUid('');
        setCardName('');
        fetchCards();
        onSuccess();
      } else {
        toast.error(data.error || 'Gagal mendaftarkan kartu');
      }
    } catch (error) {
      console.error('Error registering card:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete card
  const handleDelete = async (cardId: string, cardUid: string) => {
    if (!confirm(`Hapus kartu ${cardUid}?`)) return;

    setDeletingId(cardId);
    try {
      const response = await fetch(`/api/rfid/${cardId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Kartu berhasil dihapus');
        fetchCards();
        onSuccess();
      } else {
        toast.error(data.error || 'Gagal menghapus kartu');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle card status
  const handleToggleStatus = async (cardId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/rfid/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Status kartu berhasil diubah');
        fetchCards();
      } else {
        toast.error(data.error || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="font-medium text-sm">Daftarkan RFID</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">User:</p>
          <p className="font-medium text-gray-900">{userName}</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Existing Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Kartu Terdaftar</h4>
              <Badge variant="outline" className="text-xs">
                {cards.length} kartu
              </Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : cards.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CreditCard className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Belum ada kartu RFID terdaftar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-colors',
                      card.isActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {card.cardUid}
                        </span>
                        {!card.isActive && (
                          <Badge className="bg-gray-200 text-gray-600 text-xs">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                      {card.cardName && (
                        <p className="text-xs text-gray-500 mt-0.5">{card.cardName}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Terakhir digunakan: {formatDate(card.lastUsedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(card.id, card.isActive)}
                        className={cn(
                          'h-8 w-8 p-0',
                          card.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        )}
                        title={card.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(card.id, card.cardUid)}
                        disabled={deletingId === card.id}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        {deletingId === card.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kartu Baru
            </h4>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cardUid" className="text-sm">
                  Card UID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cardUid"
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value.toUpperCase())}
                  placeholder="Contoh: A1B2C3D4"
                  className="font-mono uppercase"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500">
                  Scan kartu RFID dan masukkan UID yang muncul
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName" className="text-sm">
                  Nama Kartu (Opsional)
                </Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Contoh: Kartu Kantor"
                  maxLength={50}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !cardUid.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Daftarkan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
