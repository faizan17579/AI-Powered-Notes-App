import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/fallback.css';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../lib/auth-context';

/**
 * Custom App component for Next.js Pages Router
 * 
 * This component wraps all pages and provides:
 * - Global CSS imports
 * - Toast notification system
 * - Global providers and context
 * 
 * Usage: Automatically used by Next.js for all pages
 */
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default MyApp;
