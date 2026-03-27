'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CreditCard, X, RefreshCw, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RFIDLoginModalProps {
  onClose: () => void;
  onSuccess: (user: {
    id: string;
    namaLengkap: string;
    username: string;
    email: string;
    role: string;
  }) => void;
}

type ScanStatus = 'ready' | 'verifying' | 'success' | 'error';

export function RFIDLoginModal({ onClose, onSuccess }: RFIDLoginModalProps) {
  const [status, setStatus] = useState<ScanStatus>('ready');
  const [error, setError] = useState('');
  const [cardUid, setCardUid] = useState('');
  const [userName, setUserName] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Re-focus when status changes back to ready
  useEffect(() => {
    if (status === 'ready') {
      inputRef.current?.focus();
    }
  }, [status]);

  // Verify card with API
  const verifyCard = useCallback(async (uid: string) => {
    if (status !== 'ready') return;

    setCardUid(uid);
    setStatus('verifying');
    setError('');

    try {
      const response = await fetch('/api/rfid/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: uid }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUserName(data.user.namaLengkap);
        setStatus('success');
        
        setTimeout(() => {
          onSuccess(data.user);
        }, 1500);
      } else {
        setError(data.error || 'Kartu tidak dikenali');
        setStatus('error');
      }
    } catch (err) {
      console.error('RFID verify error:', err);
      setError('Terjadi kesalahan saat verifikasi');
      setStatus('error');
    }
  }, [status, onSuccess]);

  // Handle RFID reader input
  // RFID readers typically send characters quickly followed by Enter
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (status !== 'ready') return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If Enter is pressed, process the buffer
    if (e.key === 'Enter') {
      e.preventDefault();
      const uid = bufferRef.current.trim().toUpperCase();
      bufferRef.current = '';
      
      if (uid) {
        await verifyCard(uid);
      }
      return;
    }

    // Add character to buffer
    if (e.key.length === 1) {
      bufferRef.current += e.key;
      
      // Set timeout to process if no more input (fallback for readers without Enter)
      timeoutRef.current = setTimeout(() => {
        const uid = bufferRef.current.trim().toUpperCase();
        bufferRef.current = '';
        if (uid.length >= 4) { // Minimum UID length
          verifyCard(uid);
        }
      }, 100);
    }
  }, [status, verifyCard]);

  const resetScan = () => {
    setStatus('ready');
    setError('');
    setCardUid('');
    setUserName('');
    bufferRef.current = '';
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={() => inputRef.current?.focus()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="font-medium text-sm">Login dengan RFID</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* RFID Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Card */}
              <motion.div
                animate={status === 'ready' ? {
                  y: [0, -5, 0],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={cn(
                  'w-40 h-24 rounded-lg border-2 flex items-center justify-center transition-colors',
                  status === 'ready' && 'border-purple-400 bg-purple-50',
                  status === 'verifying' && 'border-cyan-400 bg-cyan-50',
                  status === 'success' && 'border-emerald-400 bg-emerald-50',
                  status === 'error' && 'border-red-400 bg-red-50'
                )}
              >
                {status === 'verifying' ? (
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                ) : status === 'success' ? (
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                ) : (
                  <CreditCard className="w-10 h-10 text-purple-400" />
                )}
              </motion.div>

              {/* Scanning waves */}
              {status === 'ready' && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-purple-400 rounded-lg"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 border-2 border-purple-400 rounded-lg"
                  />
                </>
              )}

              {/* Status Icon */}
              {status === 'verifying' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2"
                >
                  <div className="flex items-center gap-2 text-cyan-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Memverifikasi...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Hidden Input for RFID Reader */}
          <input
            ref={inputRef}
            type="text"
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
            autoFocus
            autoComplete="off"
          />

          {/* Status Text */}
          <div className="text-center mb-6 min-h-[60px]">
            {status === 'ready' && (
              <div>
                <div className="flex items-center justify-center gap-2 text-purple-600 font-medium mb-2">
                  <Wifi className="w-4 h-4" />
                  <span>Siap Menerima Kartu</span>
                </div>
                <p className="text-gray-500 text-sm">
                  Tempelkan kartu RFID Anda ke reader
                </p>
              </div>
            )}
            
            {status === 'verifying' && cardUid && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Card UID:</p>
                <p className="font-mono text-lg font-semibold text-gray-900">
                  {cardUid}
                </p>
              </div>
            )}
            
            {status === 'success' && (
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-emerald-600 font-medium text-lg mb-1"
                >
                  Selamat datang!
                </motion.div>
                <p className="text-gray-900 font-semibold">{userName}</p>
              </div>
            )}
            
            {status === 'error' && (
              <div>
                <p className="text-red-600 font-medium mb-1">{error}</p>
                {cardUid && (
                  <p className="text-gray-500 text-sm">
                    Card UID: <span className="font-mono">{cardUid}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          {status === 'ready' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Petunjuk:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pastikan kartu RFID sudah terdaftar di sistem</li>
                <li>• Tempelkan kartu dekat dengan reader RFID</li>
                <li>• Sistem akan otomatis membaca kartu</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={status === 'verifying'}
            >
              Batal
            </Button>
            {status === 'error' && (
              <Button
                onClick={resetScan}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
