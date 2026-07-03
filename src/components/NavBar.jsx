import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

export default function NavBar({ user, isAdmin }) {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const s = {
    nav: { background:'var(--s1)', borderBottom:'1px solid var(--border)', padding:'0 24px', height:'54px',
           display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 },
    logo: { fontFamily:'Georgia,serif', fontSize:'16px', fontWeight:'900', letterSpacing:'2px',
            background:'linear-gradient(90deg,#E63946,#E9A320,#2A9D8F,#457B9D)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textDecoration:'none' },
    right: { display:'flex', alignItems:'center', gap:'14px' },
    avatar: { width:'32px', height:'32px', borderRadius:'50%', background:'var(--b)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'13px', fontWeight:'700', color:'#fff', overflow:'hidden', flexShrink:0 },
    name: { fontSize:'12px', color:'var(--sub)' },
    adminLink: { fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px',
                 background:'rgba(233,163,32,.15)', color:'#E9A320',
                 border:'1px solid rgba(233,163,32,.4)', textDecoration:'none' },
    signout: { fontSize:'12px', padding:'5px 12px', background:'var(--s3)', color:'var(--muted)',
               border:'1px solid var(--border2)', borderRadius:'7px', cursor:'pointer' },
  }

  const avatarUrl  = user?.user_metadata?.avatar_url
  const name       = user?.user_metadata?.full_name || user?.email || '?'
  const initials   = name[0].toUpperCase()

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>⚽ QUIZ GRUPAL</Link>
      <div style={s.right}>
        {isAdmin && location.pathname !== '/admin' && (
          <Link to="/admin" style={s.adminLink}>🔧 Admin</Link>
        )}
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={s.avatar} />
          : <div style={s.avatar}>{initials}</div>
        }
        <span style={s.name}>{name}</span>
        <button style={s.signout} onClick={handleSignOut}>Salir</button>
      </div>
    </nav>
  )
}
