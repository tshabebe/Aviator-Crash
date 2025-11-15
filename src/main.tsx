import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './index.scss';
import App from './app';
import { Provider } from './context';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            <Provider>
              <App />
              <ToastContainer position="top-center" theme="dark" />
            </Provider>
          }
        />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

// Register service worker in production to cache heavy Unity and audio assets
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(() => {
        // Ignore service worker registration errors; app still works without it
      });
  });
}


