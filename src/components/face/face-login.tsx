'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { Scan, CheckCircle, XCircle, X, Loader2, RefreshCw, UserX, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FaceLoginProps {
  onSuccess: (user: { id: string; namaLengkap: string; username: string; role: string }, token: string) => void;
  onCancel: () => void;
}

type Status = 'loading' | 'ready' | 'verifying' | 'success' | 'failed';

type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'none';

interface QualityInfo {
  level: QualityLevel;
  label: string;
  score: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const qualityConfig: Record<QualityLevel, QualityInfo> = {
  excellent: {
    level: 'excellent',
    label: 'Sangat Baik',
    score: 100,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
  },
  good: {
    level: 'good',
    label: 'Baik',
    score: 75,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-500',
  },
  fair: {
    level: 'fair',
    label: 'Cukup',
    score: 50,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500',
  },
  poor: {
    level: 'poor',
    label: 'Kurang',
    score: 25,
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
  },
  none: {
    level: 'none',
    label: 'Tidak Ada Wajah',
    score: 0,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500',
    borderColor: 'border-gray-500',
  },
};

export function FaceLogin({ onSuccess, onCancel }: FaceLoginProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Memuat model AI...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [quality, setQuality] = useState<QualityInfo>(qualityConfig.none);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<number | null>(null);
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
    if (verifyTimeoutRef.current) {
      clearTimeout(verifyTimeoutRef.current);
      verifyTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Calculate face quality
  const calculateQuality = useCallback((box: faceapi.Box, videoWidth: number, videoHeight: number): QualityLevel => {
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;

    const distanceX = Math.abs(faceCenterX - frameCenterX) / (videoWidth / 2);
    const distanceY = Math.abs(faceCenterY - frameCenterY) / (videoHeight / 2);
    const distanceFromCenter = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    const faceArea = box.width * box.height;
    const frameArea = videoWidth * videoHeight;
    const faceSizeRatio = faceArea / frameArea;

    let score = 100;
    score -= distanceFromCenter * 50;

    const idealSizeRatio = 0.25;
    const sizeDeviation = Math.abs(faceSizeRatio - idealSizeRatio) / idealSizeRatio;
    score -= sizeDeviation * 25;

    if (faceSizeRatio >= 0.18 && faceSizeRatio <= 0.35) {
      score += 10;
    }

    if (score >= 85) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }, []);

  // Verify face
  const verifyFace = useCallback(async () => {
    if (!videoRef.current || !mountedRef.current) return;

    setStatus('verifying');
    setCountdown(null);
    setMessage('Memverifikasi wajah...');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        if (mountedRef.current) {
          setStatus('failed');
          setMessage('Wajah tidak terdeteksi');
        }
        return;
      }

      // Send to API
      const response = await fetch('/api/face/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          faceDescriptor: Array.from(detection.descriptor),
        }),
      });

      const data = await response.json();

      if (!mountedRef.current) return;

      if (data.success && data.user) {
        // Calculate match score based on distance (lower is better)
        const distance = data.distance || 0;
        const score = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
        setMatchScore(score);
        
        setStatus('success');
        setMessage(`Selamat datang, ${data.user.namaLengkap}!`);
        cleanup();
        
        setTimeout(() => {
          onSuccess(data.user, data.token);
        }, 1500);
      } else {
        setStatus('failed');
        setMessage(data.error || 'Wajah tidak dikenali');
      }
    } catch (error) {
      console.error('Verify error:', error);
      if (mountedRef.current) {
        setStatus('failed');
        setMessage('Terjadi kesalahan');
      }
    }
  }, [cleanup, onSuccess]);

  // Start detection loop
  const startDetection = useCallback(() => {
    if (!mountedRef.current) return;

    let stableCount = 0;

    const detect = async () => {
      if (!mountedRef.current || !videoRef.current) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (!mountedRef.current) return;

        if (detection && canvasRef.current && videoRef.current) {
          setFaceDetected(true);

          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const box = detection.detection.box;
            const qualityLevel = calculateQuality(box, video.videoWidth, video.videoHeight);
            setQuality(qualityConfig[qualityLevel]);

            // Box color based on quality
            const boxColor = qualityLevel === 'excellent' ? '#10b981' :
                             qualityLevel === 'good' ? '#06b6d4' :
                             qualityLevel === 'fair' ? '#f59e0b' : '#ef4444';

            // Animated glow effect
            ctx.shadowColor = boxColor;
            ctx.shadowBlur = qualityLevel === 'excellent' ? 25 : 15;
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(box.x, box.y, box.width, box.height, 12);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Animated corners
            const cornerSize = 25;
            ctx.lineWidth = 4;
            ctx.strokeStyle = boxColor;
            const pulseOffset = Math.sin(Date.now() / 200) * 3;

            // Top-left
            ctx.beginPath();
            ctx.moveTo(box.x - pulseOffset, box.y + cornerSize);
            ctx.lineTo(box.x - pulseOffset, box.y - pulseOffset);
            ctx.lineTo(box.x + cornerSize, box.y - pulseOffset);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(box.x + box.width - cornerSize, box.y - pulseOffset);
            ctx.lineTo(box.x + box.width + pulseOffset, box.y - pulseOffset);
            ctx.lineTo(box.x + box.width + pulseOffset, box.y + cornerSize);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(box.x - pulseOffset, box.y + box.height - cornerSize);
            ctx.lineTo(box.x - pulseOffset, box.y + box.height + pulseOffset);
            ctx.lineTo(box.x + cornerSize, box.y + box.height + pulseOffset);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(box.x + box.width - cornerSize, box.y + box.height + pulseOffset);
            ctx.lineTo(box.x + box.width + pulseOffset, box.y + box.height + pulseOffset);
            ctx.lineTo(box.x + box.width + pulseOffset, box.y + box.height - cornerSize);
            ctx.stroke();

            // Draw landmarks
            ctx.fillStyle = boxColor + '50';
            detection.landmarks.positions.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
              ctx.fill();
            });

            // Center guide
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(video.videoWidth / 2, video.videoHeight / 2, 100, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);

            // Auto verify for good/excellent quality
            if (qualityLevel === 'excellent' || qualityLevel === 'good') {
              stableCount++;
              if (stableCount >= 15 && status === 'ready') {
                // Start countdown
                setCountdown(3);
                verifyTimeoutRef.current = setTimeout(() => {
                  setCountdown(2);
                  verifyTimeoutRef.current = setTimeout(() => {
                    setCountdown(1);
                    verifyTimeoutRef.current = setTimeout(() => {
                      if (mountedRef.current && status === 'ready') {
                        verifyFace();
                      }
                    }, 1000);
                  }, 1000);
                }, 1000);
              }
            } else {
              stableCount = 0;
              setCountdown(null);
              if (verifyTimeoutRef.current) {
                clearTimeout(verifyTimeoutRef.current);
                verifyTimeoutRef.current = null;
              }
            }
          }
        } else {
          setFaceDetected(false);
          setQuality(qualityConfig.none);
          stableCount = 0;
          setCountdown(null);
          if (verifyTimeoutRef.current) {
            clearTimeout(verifyTimeoutRef.current);
            verifyTimeoutRef.current = null;
          }
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
        }
      } catch (e) {
        console.error('Detection error:', e);
      }

      if (mountedRef.current && status === 'ready') {
        detectionRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  }, [status, calculateQuality, verifyFace]);

  // Initialize
  useEffect(() => {
    mountedRef.current = true;
    
    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);

        if (!mountedRef.current) return;

        setMessage('Memulai kamera...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        streamRef.current = stream;

        if (!mountedRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (mountedRef.current) {
          setStatus('ready');
          setMessage('Arahkan wajah ke kamera');
        }
      } catch (error) {
        console.error('Init error:', error);
        if (mountedRef.current) {
          setMessage('Gagal memulai kamera');
          setStatus('failed');
        }
      }
    };

    init();

    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Start detection when ready
  useEffect(() => {
    if (status === 'ready') {
      startDetection();
    }
  }, [status, startDetection]);

  const handleRetry = () => {
    setFaceDetected(false);
    setQuality(qualityConfig.none);
    setCountdown(null);
    setMatchScore(null);
    setStatus('ready');
    setMessage('Arahkan wajah ke kamera');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              <span className="font-medium text-sm">Login dengan Wajah</span>
            </div>
            <button
              onClick={() => { cleanup(); onCancel(); }}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video Area */}
          <div className="relative aspect-square bg-gray-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'w-full h-full object-cover',
                (status === 'loading' || status === 'success' || status === 'failed') && 'hidden'
              )}
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className={cn(
                'absolute inset-0 w-full h-full pointer-events-none',
                (status === 'loading' || status === 'success' || status === 'failed') && 'hidden'
              )}
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Scanning Animation */}
            {(status === 'ready' || status === 'verifying') && (
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
            )}

            {/* Quality/Status Badge */}
            {status === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 left-3 right-3"
              >
                {!faceDetected ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md border-2 bg-gray-500/20 text-gray-300 border-gray-500">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <UserX className="w-5 h-5" />
                    </motion.div>
                    <span>Tidak ada wajah terdeteksi</span>
                  </div>
                ) : (
                  <div className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md border-2',
                    quality.bgColor + '/20',
                    quality.color,
                    quality.borderColor
                  )}>
                    {quality.level === 'excellent' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                    )}
                    <span>{quality.label}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && countdown > 0 && status === 'ready' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60"
              >
                <div className="text-center">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/50"
                  >
                    <span className="text-4xl font-bold text-white">{countdown}</span>
                  </motion.div>
                  <p className="text-white font-medium">Verifikasi otomatis...</p>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <p className="text-white text-sm mt-4">{message}</p>
              </div>
            )}

            {/* Verifying State */}
            {status === 'verifying' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Scan className="w-16 h-16 text-cyan-500 mx-auto mb-3" />
                  </motion.div>
                  <p className="text-white font-medium">{message}</p>
                  <div className="mt-4 w-48 mx-auto">
                    <Progress value={66} className="h-1.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <CheckCircle className="w-20 h-20 text-white mb-4" />
                </motion.div>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-lg font-semibold text-center px-6"
                >
                  {message}
                </motion.p>
                {matchScore !== null && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 px-4 py-2 bg-white/20 rounded-full"
                  >
                    <span className="text-white/90 text-sm">Kecocokan: {matchScore}%</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Failed State */}
            {status === 'failed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <XCircle className="w-16 h-16 text-white mb-3" />
                </motion.div>
                <p className="text-white text-center px-6 font-medium">{message}</p>
              </motion.div>
            )}
          </div>

          {/* Quality Info Section */}
          {status === 'ready' && (
            <div className="p-4 bg-gray-800/50 border-t border-gray-700">
              {!faceDetected ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Menunggu Wajah</span>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-500" />
                      Pastikan wajah terlihat di kamera
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-500" />
                      Hindari menutupi wajah dengan tangan
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Kualitas Deteksi</span>
                    <span className={cn('text-sm font-semibold', quality.color)}>
                      {quality.score}%
                    </span>
                  </div>
                  <Progress 
                    value={quality.score} 
                    className={cn(
                      'h-2',
                      quality.level === 'excellent' && '[&>div]:bg-emerald-500',
                      quality.level === 'good' && '[&>div]:bg-cyan-500',
                      quality.level === 'fair' && '[&>div]:bg-amber-500',
                      quality.level === 'poor' && '[&>div]:bg-red-500'
                    )}
                  />
                  {quality.level === 'excellent' && (
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Verifikasi otomatis akan dimulai
                    </p>
                  )}
                  {quality.level === 'good' && (
                    <p className="text-xs text-cyan-400 mt-2">
                      Pertahankan posisi untuk verifikasi otomatis
                    </p>
                  )}
                  {(quality.level === 'fair' || quality.level === 'poor') && (
                    <p className="text-xs text-gray-400 mt-2">
                      Pusatkan wajah di tengah untuk hasil lebih baik
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3">
            {(status === 'ready' || status === 'failed') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => { cleanup(); onCancel(); }}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Batal
                </Button>
                {status === 'failed' && (
                  <Button
                    onClick={handleRetry}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                  </Button>
                )}
              </>
            )}
            {status === 'verifying' && (
              <Button disabled className="flex-1 bg-cyan-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memverifikasi...
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
