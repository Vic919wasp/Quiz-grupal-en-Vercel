import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleGoogle() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError('No se pudo iniciar sesión. Intentá de nuevo.'); setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div style={{ background:'var(--s1)', border:'1px solid var(--border2)', borderRadius:'16px', padding:'48px 40px', maxWidth:'400px', width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚽</div>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'900', letterSpacing:'2px', marginBottom:'8px',
                     background:'linear-gradient(90deg,#E63946,#E9A320,#2A9D8F,#457B9D)',
                     WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          QUIZ GRUPAL
        </h1>
        <p style={{ fontSize:'13px', color:'var(--sub)', marginBottom:'36px', lineHeight:'1.6' }}>
          Herramienta de diagnóstico grupal<br />
          Insights Discovery + Inteligencias Múltiples
        </p>

        <button onClick={handleGoogle} disabled={loading} style={{
          width:'100%', padding:'13px 20px', background:'#fff', color:'#333',
          border:'1px solid #ddd', borderRadius:'10px', fontSize:'14px', fontWeight:'600',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? 'Conectando…' : 'Continuar con Google'}
        </button>

        {error && (
          <p style={{ marginTop:'16px', fontSize:'12px', color:'var(--r)', background:'rgba(230,57,70,.1)', padding:'10px', borderRadius:'7px', border:'1px solid var(--r)' }}>{error}</p>
        )}
        <p style={{ marginTop:'28px', fontSize:'11px', color:'var(--muted)', lineHeight:'1.6' }}>
          Al continuar aceptás el uso de tu cuenta de Google<br />para autenticarte en esta plataforma educativa.
        </p>
      </div>
    </div>
  )
}
