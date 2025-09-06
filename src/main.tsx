// src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
// FIX: Remove the .tsx extension from the import path
import App from './App' 
import './index.css' // Your main CSS file

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)