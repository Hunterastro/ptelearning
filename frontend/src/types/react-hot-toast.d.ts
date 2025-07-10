declare module 'react-hot-toast' {
  import { ReactNode } from 'react';

  export interface ToastOptions {
    id?: string;
    icon?: ReactNode;
    duration?: number;
    ariaProps?: Record<string, any>;
    className?: string;
    style?: React.CSSProperties;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    iconTheme?: {
      primary?: string;
      secondary?: string;
    };
  }

  export interface ToasterToastOptions extends ToastOptions {
    success?: ToastOptions;
    error?: ToastOptions;
    loading?: ToastOptions;
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    toastOptions?: ToasterToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
  }

  interface ToastFunction {
    (message: string, options?: ToastOptions): string;
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    loading: (message: string, options?: ToastOptions) => string;
    custom: (jsx: ReactNode, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      },
      options?: ToastOptions
    ) => Promise<T>;
  }

  declare const toast: ToastFunction;
  export default toast;

  export const Toaster: React.FC<ToasterProps>;
} 