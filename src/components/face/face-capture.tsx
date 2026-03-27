'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, X, Loader2, RefreshCw, Zap, Sun, Focus, Scan, AlertCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FaceCaptureProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type Status = 'loading' | 'detecting' | 'countdown' | 'capturing' | 'success' | 'error';

type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor';

interface QualityInfo {
  level: QualityLevel;
  label: string;
  score: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  tips: string[];
}

const qualityConfig: Record<QualityLevel, QualityInfo> = {
  excellent: {
    level: 'excellent',
    label: 'Sangat Baik',
    score: 100,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
    icon: '🎯',
    tips: ['Posisi sempurna!', 'Auto-capture akan dimulai'],
  },
  good: {
    level: 'good',
    label: 'Baik',
    score: 75,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-500',
    icon: '✨',
    tips: ['Pertahankan posisi', 'Auto-capture dalam 2 detik'],
  },
  fair: {
    level: 'fair',
    label: 'Cukup',
    score: 50,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500',
    icon: '👍',
    tips: ['Dekatkan wajah sedikit', 'Pastikan pencahayaan merata'],
  },
  poor: {
    level: 'poor',
    label: 'Kurang',
    score: 25,
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    icon: '⚠️',
    tips: ['Posisikan wajah di tengah', 'Perbaiki pencahayaan'],
  },
};

export function FaceCapture({ userId, onSuccess, onCancel }: FaceCaptureProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Memuat model AI...');
  const [quality, setQuality] = useState<QualityInfo>(qualityConfig.poor);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number } | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [stableFrames, setStableFrames] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const autoCaptureRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup
  const cleanup = useCallback(() => {
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    if (autoCaptureRef.current) {
      clearTimeout(autoCaptureRef.current);
      autoCaptureRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Load models and start
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);

        setMessage('Memulai kamera...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus('detecting');
        setMessage('Posisikan wajah Anda di tengah frame');
      } catch (error) {
        console.error('Init error:', error);
        setMessage('Gagal memulai kamera');
        setStatus('error');
      }
    };

    init();
    return () => cleanup();
  }, [cleanup]);

  // Calculate face quality
  const calculateQuality = useCallback((box: faceapi.Box, videoWidth: number, videoHeight: number): QualityLevel => {
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;

    // Distance from center (0 = perfect center)
    const distanceX = Math.abs(faceCenterX - frameCenterX) / (videoWidth / 2);
    const distanceY = Math.abs(faceCenterY - frameCenterY) / (videoHeight / 2);
    const distanceFromCenter = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // Face size ratio
    const faceArea = box.width * box.height;
    const frameArea = videoWidth * videoHeight;
    const faceSizeRatio = faceArea / frameArea;

    // Score calculation
    let score = 100;

    // Penalize distance from center
    score -= distanceFromCenter * 50;

    // Ideal face size is around 20-30% of frame
    const idealSizeRatio = 0.25;
    const sizeDeviation = Math.abs(faceSizeRatio - idealSizeRatio) / idealSizeRatio;
    score -= sizeDeviation * 25;

    // Bonus for good size
    if (faceSizeRatio >= 0.18 && faceSizeRatio <= 0.35) {
      score += 10;
    }

    if (score >= 85) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }, []);

  // Smart auto capture logic
  const triggerAutoCapture = useCallback((qualityLevel: QualityLevel) => {
    // Clear existing timer
    if (autoCaptureRef.current) {
      clearTimeout(autoCaptureRef.current);
      autoCaptureRef.current = null;
    }

    // Only auto capture for excellent or good quality
    if (qualityLevel === 'excellent') {
      setStableFrames(prev => prev + 1);
      
      // Need 15 stable excellent frames before capture
      if (stableFrames >= 15) {
        setCountdown(1);
        countdownRef.current = setTimeout(() => captureFace(), 1000);
      } else {
        // Show countdown preparation
        autoCaptureRef.current = setTimeout(() => {
          if (status === 'detecting') {
            setCountdown(3);
            countdownRef.current = setTimeout(() => {
              setCountdown(2);
              countdownRef.current = setTimeout(() => {
                setCountdown(1);
                countdownRef.current = setTimeout(() => captureFace(), 1000);
              }, 1000);
            }, 1000);
          }
        }, 500);
      }
    } else if (qualityLevel === 'good') {
      setStableFrames(prev => prev + 1);
      
      // Need 25 stable good frames before capture
      if (stableFrames >= 25) {
        setCountdown(3);
        countdownRef.current = setTimeout(() => {
          setCountdown(2);
          countdownRef.current = setTimeout(() => {
            setCountdown(1);
            countdownRef.current = setTimeout(() => captureFace(), 1000);
          }, 1000);
        }, 1000);
      }
    } else {
      // Reset stability counter for poor/fair quality
      setStableFrames(0);
      setCountdown(null);
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, [stableFrames, status]);

  // Detection loop
  useEffect(() => {
    if (status !== 'detecting') return;

    let lastQuality: QualityLevel = 'poor';
    let frameCount = 0;

    const detect = async () => {
      if (!videoRef.current || status !== 'detecting') return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection && canvasRef.current && videoRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const box = detection.detection.box;
            const qualityLevel = calculateQuality(box, video.videoWidth, video.videoHeight);
            const newQuality = qualityConfig[qualityLevel];
            setQuality(newQuality);

            // Track face position for animation
            setFacePosition({
              x: box.x + box.width / 2,
              y: box.y + box.height / 2,
            });

            // Draw face box with glow effect
            const boxColor = qualityLevel === 'excellent' ? '#10b981' :
                             qualityLevel === 'good' ? '#06b6d4' :
                             qualityLevel === 'fair' ? '#f59e0b' : '#ef4444';

            // Outer glow
            ctx.shadowColor = boxColor;
            ctx.shadowBlur = qualityLevel === 'excellent' ? 20 : 10;
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(box.x, box.y, box.width, box.height, 12);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Corner accents
            const cornerSize = 20;
            ctx.lineWidth = 4;
            ctx.strokeStyle = boxColor;

            // Animated corners based on quality
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
            ctx.fillStyle = boxColor + '60';
            detection.landmarks.positions.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
              ctx.fill();
            });

            // Center guide circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(video.videoWidth / 2, video.videoHeight / 2, 120, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);

            // Trigger auto capture for good/excellent quality
            if (qualityLevel !== lastQuality) {
              lastQuality = qualityLevel;
              frameCount = 0;
            }
            frameCount++;

            // Only trigger auto capture after 10 frames of stable quality
            if (frameCount >= 10) {
              triggerAutoCapture(qualityLevel);
            }
          }

          setDetectionCount(prev => prev + 1);
          setFaceDetected(true);
        } else {
          setFaceDetected(false);
          setQuality(qualityConfig.poor);
          setFacePosition(null);
          setStableFrames(0);
          setCountdown(null);
          if (countdownRef.current) {
            clearTimeout(countdownRef.current);
            countdownRef.current = null;
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

      if (status === 'detecting') {
        detectionRef.current = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, [status, calculateQuality, triggerAutoCapture]);

  const captureFace = useCallback(async () => {
    if (!videoRef.current) return;

    setCountdown(null);
    setStatus('capturing');
    setMessage('Menangkap wajah...');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('detecting');
        setMessage('Wajah tidak terdeteksi. Coba lagi.');
        return;
      }

      // Capture image
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
      }

      cleanup();
      await saveFace(detection.descriptor);
    } catch (error) {
      console.error('Capture error:', error);
      setMessage('Gagal menangkap wajah');
      setStatus('error');
    }
  }, [cleanup]);

  const saveFace = async (descriptor: Float32Array) => {
    setSaving(true);
    setMessage('Menyimpan data wajah...');

    try {
      const response = await fetch('/api/face/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          faceDescriptor: Array.from(descriptor),
          faceImage: capturedImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Wajah berhasil didaftarkan!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        setMessage(data.error || 'Gagal menyimpan');
        setStatus('error');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Terjadi kesalahan');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setStableFrames(0);
    setCountdown(null);
    setStatus('loading');
    setMessage('Memulai ulang...');
    
    // Reinitialize
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus('detecting');
        setMessage('Posisikan wajah Anda di tengah frame');
      } catch (error) {
        console.error('Retry error:', error);
        setMessage('Gagal memulai kamera');
        setStatus('error');
      }
    };

    init();
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
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="font-medium text-sm">Daftarkan Wajah</span>
            </div>
            <button
              onClick={() => { cleanup(); onCancel(); }}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <CardContent className="p-0">
            {/* Video Area */}
            <div className="relative aspect-[4/3] bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'w-full h-full object-cover',
                  (status === 'loading' || status === 'success' || status === 'error') && 'hidden'
                )}
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className={cn(
                  'absolute inset-0 w-full h-full pointer-events-none',
                  (status === 'loading' || status === 'success' || status === 'error') && 'hidden'
                )}
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Scanning Animation */}
              {status === 'detecting' && (
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
              )}

              {/* Quality Badge or No Face Detected */}
              {status === 'detecting' && (
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
                      <span className="text-lg">{quality.icon}</span>
                      <span>{quality.label}</span>
                      {quality.level === 'excellent' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Countdown Overlay */}
              {countdown !== null && countdown > 0 && (
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
                      className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/50"
                    >
                      <span className="text-5xl font-bold text-white">{countdown}</span>
                    </motion.div>
                    <p className="text-white font-medium">Bersiap menangkap...</p>
                  </div>
                </motion.div>
              )}

              {/* States */}
              {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <p className="text-white text-sm mt-4">{message}</p>
                </div>
              )}

              {status === 'capturing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    >
                      <Camera className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-white font-medium">{message}</p>
                  </div>
                </div>
              )}

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
                    className="text-white text-xl font-semibold"
                  >
                    {message}
                  </motion.p>
                </motion.div>
              )}

              {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90">
                  <X className="w-16 h-16 text-white mb-3" />
                  <p className="text-white text-center px-6">{message}</p>
                </div>
              )}
            </div>

            {/* Quality Info Section */}
            {status === 'detecting' && (
              <div className="p-4 bg-gray-50 border-b">
                {!faceDetected ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Menunggu Wajah</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Pastikan wajah Anda terlihat di kamera
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Hindari menutupi wajah dengan tangan atau benda
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Periksa apakah kamera berfungsi dengan baik
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Kualitas Deteksi</span>
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
                    <div className="mt-3 space-y-1.5">
                      {quality.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-400" />
                          {tip}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Instructions */}
            {status === 'detecting' && faceDetected && quality.level === 'poor' && (
              <div className="p-4 bg-amber-50 border-b">
                <h4 className="font-medium text-amber-800 text-sm mb-2 flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Tips Pencahayaan:
                </h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Pastikan wajah terkena cahaya yang cukup</li>
                  <li>• Hindari cahaya dari belakang (backlight)</li>
                  <li>• Gunakan cahaya alami dari jendela</li>
                </ul>
              </div>
            )}

            {/* Position Guide */}
            {status === 'detecting' && faceDetected && quality.level !== 'excellent' && quality.level !== 'poor' && (
              <div className="p-4 bg-cyan-50 border-b">
                <h4 className="font-medium text-cyan-800 text-sm mb-2 flex items-center gap-2">
                  <Focus className="w-4 h-4" />
                  Posisi Wajah:
                </h4>
                <ul className="text-xs text-cyan-700 space-y-1">
                  <li>• Pusatkan wajah di tengah lingkaran putus-putus</li>
                  <li>• Lihat lurus ke kamera</li>
                  <li>• Jaga jarak sekitar 30-50 cm dari kamera</li>
                </ul>
              </div>
            )}
          </CardContent>

          {/* Footer */}
          <div className="p-4 bg-white border-t flex gap-3">
            {status === 'detecting' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => { cleanup(); onCancel(); }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={captureFace}
                  disabled={!faceDetected || quality.level === 'poor'}
                  className={cn(
                    'flex-1',
                    faceDetected && quality.level === 'excellent' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  )}
                >
                  {!faceDetected ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Tidak Ada Wajah
                    </>
                  ) : quality.level === 'excellent' ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Capture Sekarang
                    </>
                  ) : quality.level === 'good' ? (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Posisikan Wajah
                    </>
                  )}
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => { cleanup(); onCancel(); }}
                  className="flex-1"
                >
                  Tutup
                </Button>
                <Button
                  onClick={handleRetry}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              </>
            )}

            {saving && (
              <Button disabled className="flex-1 bg-emerald-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
