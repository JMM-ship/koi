'use client';

import toast, { Toast } from 'react-hot-toast';
import React from 'react';

export const useToast = () => {
  const showMessage = (message: string, options?: any) => {
    return toast(message, options);
  };

  const showSuccess = (message: string, options?: any) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    });
  };

  const showError = (message: string, options?: any) => {
    return toast.error(message, {
      duration: 4000,
      ...options,
    });
  };

  const showLoading = (message: string, options?: any) => {
    return toast.loading(message, options);
  };

  const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: any
  ) => {
    return toast.promise(promise, messages, options);
  };

  const showCustom = (content: React.ReactNode, options?: any) => {
    return toast.custom(content as any, options);
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const showInfo = (message: string, options?: any) => {
    return toast(message, {
      icon: '💡',
      duration: 3000,
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
      ...options,
    });
  };

  const showWarning = (message: string, options?: any) => {
    return toast(message, {
      icon: '⚠️',
      duration: 3500,
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
      ...options,
    });
  };


  return {
    showMessage,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    showPromise,
    showCustom,
    dismiss,
  };
};