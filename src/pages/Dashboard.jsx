import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const VERS_COLOR = { A:'#E63946', B:'#E9A320', C:'#2A9D8F', D:'#457B9D' }

export default function Dashboard({ user, isAdmin }) {
  const [grupos,   setGrupos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const [form,     setForm]     = useState({ escuela:'', curso:'', fecha:'', version:'A' })
  const navigate = useNavigate()

  async function fetchGrupos() {
    const { data } = await supabase
      .from('grupos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGrupos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchGrupos() }, [])

  async function crearGrupo(e) {
    e.preventDefault()
    if (!form.escuela || !form.curso) return
    const { data, error } = await supabase.from('grupos').insert({
      user_id:  user.id,
      email:    user.email,
      escuela:  form.escuela,
      curso:    form.curso,
      fecha:    form.fecha,
      version:  form.version,
      alumnos:  0,
    }).select().single()
    if (!error && data) {
      setCreating(false)
      setForm({ escuela:'', curso:'', fecha:'', version:'A' })
      navigate(`/grupo/${data.id}`)
    }
  }

  const s = {
    page: { padding:'28px', maxWidth:'960px', margin:'0 auto' },
    h2:   { fontSize:'22px', fontWeight:'800', marginBottom:'4px' },
    desc: { fontSize:'13px', color:'var(--sub)', marginBottom:'24px', lineHeight:'1.7' },
    grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' },
    card: { background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'12px', padding:'20px', cursor:'pointer', transition:'.2s' },
    btn:  { padding:'10px 20px', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
    lbl:  { fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px' },
  }

  return (
    <div style={s.page}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
        <h2 style={s.h2}>Mis Grupos</h2>
        <button style={{ ...s.btn, background:'linear-gradient(135deg,#457B9D,#2A9D8F)', color:'#fff' }}
          onClick={() => setCreating(true)}>+ Nuevo Grupo</button>
      </div>
      <p style={s.desc}>
        Cada grupo representa un curso o conjunto de alumnos evaluados.
        Hacé clic en un grupo para cargar tests, ver resultados o generar preguntas con IA.
      </p>

      {/* MODAL CREAR */}
      {creating && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:200,
                      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'var(--s1)', border:'1px solid var(--border2)', borderRadius:'16px',
                        padding:'28px', width:'100%', maxWidth:'440px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'18px', fontWeight:'700' }}>Nuevo Grupo</h3>
              <button onClick={() => setCreating(false)}
                style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'20px', cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={crearGrupo}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                <div>
                  <label style={s.lbl}>Escuela Nro. *</label>
                  <input value={form.escuela} onChange={e => setForm({...form, escuela:e.target.value})}
                    placeholder="Ej: 47" required
                    style={{ fontSize:'20px', fontWeight:'800', textAlign:'center' }}/>
                </div>
                <div>
                  <label style={s.lbl}>Curso Nro. *</label>
                  <input value={form.curso} onChange={e => setForm({...form, curso:e.target.value})}
                    placeholder="Ej: 4" required
                    style={{ fontSize:'20px', fontWeight:'800', textAlign:'center' }}/>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
                <div>
                  <label style={s.lbl}>Fecha (ddmmaaaa)</label>
                  <input value={form.fecha}
                    onChange={e => setForm({...form, fecha:e.target.value.replace(/\D/g,'').slice(0,8)})}
                    placeholder="10062025" maxLength={8}
                    style={{ textAlign:'center', letterSpacing:'2px' }}/>
                </div>
                <div>
                  <label style={s.lbl}>Versión del Quiz</label>
                  <select value={form.version} onChange={e => setForm({...form, version:e.target.value})}>
                    {['A','B','C','D'].map(v => <option key={v} value={v}>Versión {v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="submit"
                  style={{ ...s.btn, background:'linear-gradient(135deg,#457B9D,#2A9D8F)', color:'#fff', flex:1 }}>
                  Crear Grupo
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  style={{ ...s.btn, background:'var(--s3)', color:'var(--muted)', border:'1px solid var(--border2)' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <p style={{ color:'var(--muted)', fontSize:'13px' }}>Cargando grupos…</p>
      ) : grupos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--muted)' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
          <p style={{ fontSize:'13px' }}>Aún no tenés grupos. Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {grupos.map(g => (
            <div key={g.id} style={s.card}
              onClick={() => navigate(`/grupo/${g.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--b)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <div>
                  <div style={{ fontSize:'18px', fontWeight:'800', marginBottom:'2px' }}>Esc. {g.escuela} · C. {g.curso}</div>
                  <div style={{ fontSize:'11px', color:'var(--muted)' }}>
                    {g.fecha ? `${g.fecha.slice(0,2)}/${g.fecha.slice(2,4)}/${g.fecha.slice(4)}` : 'Sin fecha'}
                  </div>
                </div>
                <div style={{ background:VERS_COLOR[g.version]+'22', color:VERS_COLOR[g.version],
                              padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700',
                              border:`1px solid ${VERS_COLOR[g.version]}44` }}>
                  Ver. {g.version}
                </div>
              </div>
              <div style={{ fontSize:'12px', color:'var(--sub)' }}>
                📋 {g.alumnos || 0} alumno{g.alumnos !== 1 ? 's' : ''}
              </div>
              <div style={{ marginTop:'12px', fontSize:'11px', color:'var(--b)', fontWeight:'600' }}>Ver tests →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
