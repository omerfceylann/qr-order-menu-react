import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import { AdminApp } from './pages/AdminApp';
import { AdminLogin } from './pages/AdminLogin';
import { CustomerMenu } from './pages/CustomerMenu';
import { Home } from './pages/Home';
import { AppProviders } from './state/AppProviders';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu/:tableCode" element={<CustomerMenu />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
