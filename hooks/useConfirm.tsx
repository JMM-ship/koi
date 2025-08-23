'use client';

import { useState, useCallback } from 'react';

interface ConfirmState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: undefined,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm,
      onCancel,
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    // Call onCancel if it exists
    if (confirmState.onCancel) {
      confirmState.onCancel();
    }
  }, [confirmState.onCancel]);

  const handleConfirm = useCallback(() => {
    confirmState.onConfirm();
    hideConfirm();
  }, [confirmState.onConfirm, hideConfirm]);

  return {
    confirmState: {
      isOpen: confirmState.isOpen,
      message: confirmState.message,
      onConfirm: handleConfirm,
      onCancel: hideConfirm,
      confirmText: confirmState.confirmText,
      cancelText: confirmState.cancelText,
    },
    showConfirm,
    hideConfirm,
  };
}