import React from 'react';
import ReactDOM from 'react-dom/client';
import { getCurrentWindow } from '@tauri-apps/api/window';
import App from './App';
import PetApp from './PetApp';
import './styles.css';

function preparePetSurface() {
  const root = document.getElementById('root');
  document.documentElement.style.background = 'transparent';
  document.documentElement.style.backgroundColor = 'transparent';
  document.documentElement.style.width = '100%';
  document.documentElement.style.height = '100%';
  document.body.style.background = 'transparent';
  document.body.style.backgroundColor = 'transparent';
  document.body.style.minWidth = '0';
  document.body.style.minHeight = '0';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.style.overflow = 'hidden';
  if (root) {
    root.style.background = 'transparent';
    root.style.width = '100%';
    root.style.height = '100%';
  }
}

async function boot() {
  let label = 'main';
  try {
    label = getCurrentWindow().label;
  } catch {
    // Browser-only development falls back to the main application surface.
  }

  if (label === 'pet') preparePetSurface();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>{label === 'pet' ? <PetApp /> : <App />}</React.StrictMode>,
  );
}

void boot();
