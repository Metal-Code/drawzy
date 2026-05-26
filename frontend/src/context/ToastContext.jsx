import { createContext, useContext, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = uuidv4()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => { setToasts(prev => prev.filter(t => t.id !== id)) }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onRemove={removeToast} />)}
      </div>
    </ToastContext.Provider>
  )
}

const Toast = ({ toast, onRemove }) => {
  const tones = {
    info: 'bg-cyan',
    success: 'bg-lime',
    error: 'bg-pink text-cream',
    warning: 'bg-yolk',
    tab: 'bg-pink text-cream',
  }
  return (
    <div className={`blok-sm ${tones[toast.type] || tones.info} px-4 py-3 font-body font-bold text-sm max-w-xs cursor-pointer animate-pop-in`}
      onClick={() => onRemove(toast.id)}>
      {toast.message}
    </div>
  )
}

export const useToast = () => useContext(ToastContext)
