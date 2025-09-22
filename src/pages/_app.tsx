import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '../utils/errorHandler';
import { createPropertyMonitor } from '../utils/debugHelper';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    setupGlobalErrorHandling();
    createPropertyMonitor('content');
  }, []);

  return <Component {...pageProps} />;
}
