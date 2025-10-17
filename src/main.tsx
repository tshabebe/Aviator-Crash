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


