import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { QUESTIONS, calcProfiles, aluId } from '../lib/quiz'

export default function Grupo({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grupo,   setGrupo]   = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [nroHoja, setNroHoja] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [alert,   setAlert]   = useState({ msg:'', type:'' })

  useEffect(() => {
    supabase.from('grupos').select('*').eq('id', id).single().then(({ data }) => {
      if (!data || data.user_id !== user.id) { navigate('/'); return }
      setGrupo(data)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    supabase.from('alumnos').select('*').eq('grupo_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setAlumnos(data || []); setLoading(false) })
  }, [id])

  function pick(qi, oi) { setAnswers(prev => ({ ...prev, [qi]: oi })) }

  function showAlert(msg, type='ok') {
    setAlert({ msg, type })
    setTimeout(() => setAlert({ msg:'', type:'' }), 3500)
  }

  async function guardar() {
    if (!nroHoja.trim()) { showAlert('Ingresá el número de hoja.','err'); return }
    if (!grupo?.version)  { showAlert('El grupo no tiene versión asignada.','err'); return }
    const total = Object.keys(answers).length
    if (total < 20) { showAlert(`Faltan ${20 - total} preguntas.','err'); return }

    const newId = aluId({ nroAlumno:nroHoja, escuela:grupo.escuela, curso:grupo.curso, fecha:grupo.fecha })
    if (alumnos.find(a => a.alu_id === newId)) {
      showAlert(`Ya existe el alumno ${newId}.','err'); return
    }

    setSaving(true)
    try {
      const profiles = calcProfiles(grupo.version, answers)
      const { error } = await supabase.from('alumnos').insert({
        grupo_id:   id,
        user_id:    user.id,
        nro_alumno: nroHoja.trim(),
        escuela:    grupo.escuela,
        curso:      grupo.curso,
        fecha:      grupo.fecha,
        version:    grupo.version,
        alu_id:     newId,
        answers:    answers,
        ins:        profiles.ins,
        gar:        profiles.gar,
        op:         profiles.op,
        d_i:        profiles.dI,
        d_g:        profiles.dG,
      })
      if (error) throw error
      await supabase.from('grupos').update({ alumnos: (grupo.alumnos||0)+1 }).eq('id', id)
      setGrupo(prev => ({ ...prev, alumnos:(prev.alumnos||0)+1 }))
      setAlumnos(prev => [{ alu_id:newId, d_i:profiles.dI, d_g:profiles.dG }, ...prev])
      setNroHoja(''); setAnswers({})
      showAlert(`✓ Alumno ${newId} guardado.`)
      document.getElementById('nroInput')?.focus()
    } catch(e) {
      showAlert('Error: ' + e.message,'err')
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(alumnoId, grupoAlumnos) {
    if (!confirm('¿Eliminar este alumno?')) return
    await supabase.from('alumnos').delete().eq('id', alumnoId)
    await supabase.from('grupos').update({ alumnos: Math.max(0,(grupoAlumnos||1)-1) }).eq('id', id)
    setAlumnos(prev => prev.filter(a => a.id !== alumnoId))
    setGrupo(prev => ({ ...prev, alumnos: Math.max(0,(prev.alumnos||1)-1) }))
  }

  if (!grupo) return <div style={{ padding:'28px', color:'var(--muted)' }}>Cargando…</div>

  const qs = QUESTIONS[grupo.version] || []
  const answered = Object.keys(answers).length

  const PD_HEX = { R:'#E63946', Y:'#E9A320', G:'#2A9D8F', B:'#457B9D' }
  const GD_HEX = { LI:'#7C3AED',LM:'#0EA5E9',ES:'#F59E0B',MU:'#EC4899',CK:'#10B981',IP:'#F97316',IA:'#6366F1',NA:'#84CC16' }

  return (
    <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto' }}>
      {/* BREADCRUMB */}
      <div style={{ fontSize:'12px', color:'var(--muted)', marginBottom:'12px', display:'flex', gap:'6px' }}>
        <span style={{ cursor:'pointer', color:'var(--b)' }} onClick={() => navigate('/')}>Mis grupos</span>
        <span>›</span>
        <span>Escuela {grupo.escuela} · Curso {grupo.curso}</span>
      </div>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'4px' }}>Escuela {grupo.escuela} · Curso {grupo.curso}</h2>
          <p style={{ fontSize:'12px', color:'var(--sub)' }}>
            Versión {grupo.version} · {grupo.fecha ? `${grupo.fecha.slice(0,2)}/${grupo.fecha.slice(2,4)}/${grupo.fecha.slice(4)}` : 'Sin fecha'}
            · {alumnos.length} alumno{alumnos.length!==1?'s':''} cargado{alumnos.length!==1?'s':''}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button style={{ padding:'9px 16px', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', background:'rgba(42,157,143,.15)', color:'var(--g)', border:'1px solid var(--g)' }}
            onClick={() => navigate(`/grupo/${id}/resultados`)}>📊 Ver Resultados</button>
          <button style={{ padding:'9px 16px', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', background:'rgba(69,123,157,.15)', color:'var(--b)', border:'1px solid var(--b)' }}
            onClick={() => navigate(`/grupo/${id}/ia`)}>🤖 Preguntas IA</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'18px', alignItems:'start' }}>
        {/* IZQUIERDA */}
        <div>
          {/* TIP */}
          <div style={{ background:'rgba(69,123,157,.08)', border:'1px solid rgba(69,123,157,.3)', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px', display:'flex', gap:'10px' }}>
            <span style={{ fontSize:'18px', flexShrink:0 }}>📋</span>
            <span style={{ fontSize:'12px', color:'var(--sub)', lineHeight:'1.6' }}>
              <strong style={{ color:'var(--text)' }}>Tip:</strong> Es conveniente numerar las hojas físicas antes de empezar.
              Ese número, junto con escuela, curso y fecha, genera el identificador único del alumno.
            </span>
          </div>

          {/* DATOS FIJOS */}
          <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'10px', paddingBottom:'6px', borderBottom:'1px solid var(--border)' }}>🏫 Datos del grupo (fijos)</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
              {[['Escuela',grupo.escuela],['Curso',grupo.curso],['Fecha',grupo.fecha||'—'],['Versión',grupo.version]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', marginBottom:'4px' }}>{l}</div>
                  <div style={{ fontSize:'18px', fontWeight:'800' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NRO HOJA */}
          <div style={{ background:'rgba(42,157,143,.05)', border:'2px solid var(--g)', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--g)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'10px' }}>📄 Nro. de Hoja</div>
            <div style={{ display:'flex', gap:'14px', alignItems:'flex-end', flexWrap:'wrap' }}>
              <div style={{ flex:'0 0 160px' }}>
                <input id="nroInput" type="text" value={nroHoja}
                  onChange={e => setNroHoja(e.target.value)}
                  placeholder="Ej: 12" maxLength={10}
                  style={{ fontSize:'24px', fontWeight:'800', textAlign:'center', letterSpacing:'2px', borderColor:'var(--g)' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'11px', color:'var(--muted)', marginBottom:'5px' }}>ID generado:</div>
                <div style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:'700',
                  color: nroHoja ? 'var(--g)' : 'var(--muted)',
                  background:'var(--s3)', padding:'9px 13px', borderRadius:'8px' }}>
                  {nroHoja||'?'}-{grupo.escuela||'?'}-{grupo.curso||'?'}-{grupo.fecha||'?'}
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESO */}
          <div style={{ marginBottom:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--muted)', marginBottom:'5px' }}>
              <span>Preguntas respondidas</span>
              <span style={{ color:answered===20?'var(--g)':'var(--text)', fontWeight:'700' }}>{answered} / 20 {answered===20?'✓':''}</span>
            </div>
            <div style={{ background:'var(--s3)', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
              <div style={{ width:`${answered/20*100}%`, height:'100%', background:'linear-gradient(90deg,var(--b),var(--g))', transition:'width .3s', borderRadius:'4px' }}/>
            </div>
          </div>

          {/* ALERT */}
          {alert.msg && (
            <div style={{ padding:'11px 15px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', marginBottom:'14px',
              background:alert.type==='ok'?'var(--gl)':'var(--rl)',
              color:alert.type==='ok'?'var(--gd)':'var(--rd)',
              border:`1px solid ${alert.type==='ok'?'var(--g)':'var(--r)'}` }}>{alert.msg}</div>
          )}

          {/* PREGUNTAS */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {qs.map((q, qi) => {
              const [texto, opts] = q
              const sel = answers[qi]
              return (
                <div key={qi} style={{ background:sel!==undefined?'rgba(42,157,143,.06)':'var(--s2)',
                  border:`1px solid ${sel!==undefined?'var(--g)':'var(--border2)'}`,
                  borderRadius:'10px', padding:'12px', transition:'.2s' }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--muted)', marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ background:'var(--s3)', padding:'1px 7px', borderRadius:'4px' }}>P{qi+1}</span>
                    {sel!==undefined&&<span style={{ color:'var(--g)' }}>✓</span>}
                  </div>
                  <div style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)', marginBottom:'8px', lineHeight:'1.4' }}>{texto}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                    {opts.map((o, oi) => {
                      const optText = Array.isArray(o) ? o[0] : o
                      const isSel = sel===oi
                      return (
                        <div key={oi} onClick={() => pick(qi,oi)} style={{
                          display:'flex', alignItems:'flex-start', gap:'7px', padding:'6px 8px',
                          borderRadius:'6px', cursor:'pointer',
                          background:isSel?'rgba(42,157,143,.15)':'var(--s3)',
                          border:`1.5px solid ${isSel?'var(--g)':'var(--border)'}`, transition:'.15s' }}>
                          <span style={{ fontWeight:'800', fontSize:'13px', color:isSel?'var(--g)':'var(--muted)', flexShrink:0, width:'16px' }}>
                            {['A','B','C'][oi]}
                          </span>
                          <span style={{ fontSize:'10px', color:isSel?'var(--text)':'var(--sub)', lineHeight:'1.4' }}>{optText}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* GUARDAR */}
          <button onClick={guardar} disabled={saving} style={{
            marginTop:'16px', width:'100%', padding:'13px', borderRadius:'8px', border:'none',
            fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
            background:'linear-gradient(135deg,#457B9D,#2A9D8F)', color:'#fff',
            opacity:saving?.6:1 }}>
            {saving?'Guardando…':'✓ Guardar Alumno'}
          </button>
        </div>

        {/* DERECHA — lista */}
        <div style={{ position:'sticky', top:'70px' }}>
          <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'12px', padding:'16px' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'12px', paddingBottom:'6px', borderBottom:'1px solid var(--border)' }}>
              📋 Alumnos cargados ({alumnos.length})
            </div>
            {loading ? <p style={{ fontSize:'12px', color:'var(--muted)' }}>Cargando…</p>
            : alumnos.length===0 ? (
              <div style={{ textAlign:'center', padding:'24px', color:'var(--muted)' }}>
                <div style={{ fontSize:'28px', marginBottom:'8px' }}>📭</div>
                <p style={{ fontSize:'12px' }}>Sin alumnos todavía.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'480px', overflowY:'auto' }}>
                {alumnos.map(a => (
                  <div key={a.id||a.alu_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'var(--s3)', borderRadius:'7px', padding:'8px 10px', border:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:'700', fontFamily:'monospace', letterSpacing:'1px' }}>{a.alu_id}</div>
                      <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'2px' }}>
                        {a.d_i&&<span style={{ color:PD_HEX[a.d_i], marginRight:'5px' }}>●{a.d_i}</span>}
                        {a.d_g&&<span style={{ color:GD_HEX[a.d_g]||'var(--muted)' }}>●{a.d_g}</span>}
                      </div>
                    </div>
                    <button onClick={() => eliminar(a.id, grupo.alumnos)} style={{
                      background:'transparent', border:'1px solid var(--r)', color:'var(--r)',
                      padding:'3px 8px', borderRadius:'5px', fontSize:'10px', cursor:'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
