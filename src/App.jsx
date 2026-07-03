import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase, ADMIN_EMAIL } from './supabase'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Grupo       from './pages/Grupo'
import Resultados  from './pages/Resultados'
import GeneradorIA from './pages/GeneradorIA'
import Admin       from './pages/Admin'
import NavBar      from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const [user, setUser]       = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u); setIsAdmin(!!u && u.email === ADMIN_EMAIL)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u); setIsAdmin(!!u && u.email === ADMIN_EMAIL)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'var(--muted)', fontSize:'13px' }}>
      ⚙️ Cargando…
    </div>
  )

  return (
    <>
      {user && <NavBar user={user} isAdmin={isAdmin} />}
      <Routes>
        <Route path="/login"                  element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/"                       element={<ProtectedRoute user={user}><Dashboard user={user} isAdmin={isAdmin} /></ProtectedRoute>} />
        <Route path="/grupo/:id"              element={<ProtectedRoute user={user}><Grupo user={user} /></ProtectedRoute>} />
        <Route path="/grupo/:id/resultados"   element={<ProtectedRoute user={user}><Resultados user={user} isAdmin={isAdmin} /></ProtectedRoute>} />
        <Route path="/grupo/:id/ia"           element={<ProtectedRoute user={user}><GeneradorIA user={user} /></ProtectedRoute>} />
        <Route path="/admin"                  element={<ProtectedRoute user={user} adminOnly isAdmin={isAdmin}><Admin /></ProtectedRoute>} />
        <Route path="*"                       element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
