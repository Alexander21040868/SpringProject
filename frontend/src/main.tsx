import React from 'react'
import ReactDOM from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { FamilyProvider } from './family/FamilyContext'
import { ToastHost, notify } from './components/toast'
import type { ApiError } from './types'
import './index.css'

const errMessage = (e: unknown) => (e as ApiError)?.message || 'Что-то пошло не так'

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
  queryCache: new QueryCache({ onError: (e) => notify(errMessage(e), 'error') }),
  mutationCache: new MutationCache({ onError: (e) => notify(errMessage(e), 'error') }),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <FamilyProvider>
          <App />
          <ToastHost />
        </FamilyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
