import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { authReady } from './firebase.js'

// 等匿名登入完成再渲染，確保所有 Firebase 訂閱都帶有登入身分
authReady.then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
