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
    return toast.custom(content, options);
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

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    return toast.custom(
      (t: Toast) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      onConfirm();
                    }}
                    className="btn btn-sm btn-primary"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      onCancel?.();
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
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
    showConfirm,
    dismiss,
  };
};