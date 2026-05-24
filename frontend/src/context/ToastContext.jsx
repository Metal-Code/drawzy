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

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const Toast = ({ toast, onRemove }) => {
  const colors = {
    info: 'bg-sky text-navy',
    success: 'bg-mint text-navy',
    error: 'bg-coral text-white',
    warning: 'bg-yellow text-navy',
    tab: 'bg-red-600 text-white',
  }
  return (
    <div
      className={`${colors[toast.type] || colors.info} px-4 py-3 rounded-2xl font-body font-semibold text-sm shadow-xl animate-slide-down flex items-center gap-2 cursor-pointer max-w-xs`}
      onClick={() => onRemove(toast.id)}
    >
      {toast.message}
    </div>
  )
}

export const useToast = () => useContext(ToastContext)
