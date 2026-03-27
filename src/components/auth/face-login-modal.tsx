'use client';

import { FaceLogin } from '@/components/face/face-login';

interface FaceLoginModalProps {
  onClose: () => void;
  onSuccess: (user: {
    id: string;
    namaLengkap: string;
    username: string;
    email: string;
    role: string;
  }, token: string) => void;
}

export function FaceLoginModal({ onClose, onSuccess }: FaceLoginModalProps) {
  return (
    <FaceLogin
      onSuccess={(user, token) => {
        // Map to expected interface
        onSuccess({
          id: user.id,
          namaLengkap: user.namaLengkap,
          username: user.username,
          email: '', // Not returned by face login
          role: user.role,
        }, token);
      }}
      onCancel={onClose}
    />
  );
}
