import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './authContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

// Inside your root JSX (e.g. in <App />)
<Toaster position="top-right" />

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);