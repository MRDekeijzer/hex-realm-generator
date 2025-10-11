import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import '@/app/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
