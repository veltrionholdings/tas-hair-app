import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// Detect when another tab changes the auth session and force reload
window.addEventListener('storage', (event) => {
  if (event.key === 'auth_token') {
    // Token was changed or cleared by another tab — reload to sync
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
