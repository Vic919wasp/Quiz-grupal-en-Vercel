import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { IK, GK, PD, GD } from '../lib/quiz'

export default function Resultados({ user, isAdmin }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grupo,   setGrupo]   = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [tab,     setTab]     = useState('insights')
  const [selAlu,  setSelAlu]  = useState(null)

  useEffect(() => {
    supabase.from('grupos').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { navigate('/'); return }
      if (!isAdmin && data.user_id !== user.id) { navigate('/'); return }
      setGrupo(data)
    })
    supabase.from('alumnos').select('*').eq('grupo_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAlumnos(data || []))
  }, [id])

  if (!grupo) return <div style={{ padding:'28px', color:'var(--muted)' }}>Cargando…</div>

  if (!alumnos.length) return (
    <div style={{ padding:'28px', maxWidth:'900px', margin:'0 auto' }}>
      <Breadcrumb navigate={navigate} id={id} grupo={grupo} />
      <div style={{ textAlign:'center', padding:'60px', color:'var(--muted)' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
        <p>Sin alumnos cargados. <span style={{ color:'var(--b)', cursor:'pointer' }}
          onClick={() => navigate(`/grupo/${id}`)}>Cargá tests primero →</span></p>
      </div>
    </div>
  )

  const n = alumnos.length
  const sumI={R:0,Y:0,G:0,B:0}; const sumG={}; GK.forEach(k=>sumG[k]=0)
  const cntI={R:0,Y:0,G:0,B:0}
  const opCnt={cel:{},pc:{},comp:{},mod:{},cont:{},gus:{}}
  alumnos.forEach(a => {
    IK.forEach(k=>sumI[k]+=(a.ins?.[k]||0))
    GK.forEach(k=>sumG[k]+=(a.gar?.[k]||0))
    if(a.d_i) cntI[a.d_i]=(cntI[a.d_i]||0)+1
    Object.keys(opCnt).forEach(k=>{const v=a.op?.[k]||'nr'; opCnt[k][v]=(opCnt[k][v]||0)+1})
  })
  const avgI={},avgG={}
  IK.forEach(k=>avgI[k]=(sumI[k]/n).toFixed(1))
  GK.forEach(k=>avgG[k]=(sumG[k]/n).toFixed(1))
  const domI=IK.reduce((a,b)=>avgI[a]>avgI[b]?a:b)
  const topG=[...GK].sort((a,b)=>avgG[b]-avgG[a])

  const s = {
    page: { padding:'24px', maxWidth:'1100px', margin:'0 auto' },
    card: { background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'12px', padding:'18px', marginBottom:'14px' },
    secT: { fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'14px', paddingBottom:'6px', borderBottom:'1px solid var(--border)' },
    tab:  (a) => ({ padding:'9px 16px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:'600',
                    background:a?'var(--s2)':'transparent', color:a?'var(--text)':'var(--muted)', borderBottom:a?'2px solid var(--b)':'2px solid transparent' }),
    btn:  { padding:'9px 18px', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  }

  return (
    <div style={s.page}>
      <Breadcrumb navigate={navigate} id={id} grupo={grupo} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'4px' }}>Resultados · Esc. {grupo.escuela} · Curso {grupo.curso}</h2>
          <p style={{ fontSize:'12px', color:'var(--sub)' }}>
            {n} alumno{n!==1?'s':''} · Ver. {grupo.version} · Perfil dominante: {PD[domI]?.emoji} {PD[domI]?.label}
          </p>
        </div>
        <button style={{ ...s.btn, background:'rgba(69,123,157,.15)', color:'var(--b)', border:'1px solid var(--b)' }}
          onClick={() => navigate(`/grupo/${id}/ia`)}>🤖 Generar Preguntas IA</button>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:'2px', borderBottom:'1px solid var(--border)', marginBottom:'18px' }}>
        {[['insights','🎨 Insights'],['gardner','🧠 Gardner'],['operativo','🔍 Operativo'],['alumnos','👥 Alumnos']].map(([k,lbl])=>(
          <button key={k} style={s.tab(tab===k)} onClick={()=>setTab(k)}>{lbl}</button>
        ))}
      </div>

      {/* INSIGHTS */}
      {tab==='insights' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
            {IK.map(k=>{
              const pct=Math.round((cntI[k]||0)/n*100)
              const avg=parseFloat(avgI[k])
              const barPct=Math.round(avg/20*100)
              return (
                <div key={k} style={{ ...s.card, borderTop:`3px solid ${PD[k].hex}`, marginBottom:0 }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'6px' }}>{PD[k].emoji} {PD[k].label}</div>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'36px', fontWeight:'900', color:PD[k].hex, lineHeight:1, marginBottom:'4px' }}>{pct}%</div>
                  <div style={{ fontSize:'10px', color:'var(--muted)', marginBottom:'10px' }}>{cntI[k]||0} alumno{(cntI[k]||0)!==1?'s':''} · prom {avg}pts</div>
                  <div style={{ background:'var(--s3)', borderRadius:'3px', height:'6px', overflow:'hidden' }}>
                    <div style={{ width:barPct+'%', height:'100%', background:PD[k].hex, borderRadius:'3px' }}/>
                  </div>
                  <div style={{ fontSize:'10px', color:'var(--sub)', fontStyle:'italic', marginTop:'8px', lineHeight:'1.4' }}>{PD[k].desc}</div>
                </div>
              )
            })}
          </div>
          <div style={s.card}>
            <div style={s.secT}>Detalle por alumno — clic para ver perfil individual</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  {['ID Alumno','Perfil',...IK.map(k=>`${PD[k].emoji}${PD[k].short}`)].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:'10px', fontWeight:'700', textTransform:'uppercase', color:'var(--muted)', borderBottom:'1px solid var(--border2)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {alumnos.map(a=>(
                    <tr key={a.id} style={{ cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                      onClick={()=>setSelAlu(selAlu?.id===a.id?null:a)}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--s3)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'9px 12px', fontFamily:'monospace', fontSize:'11px', fontWeight:'700' }}>{a.alu_id}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:PD[a.d_i]?.hex+'22', color:PD[a.d_i]?.hex }}>
                          {PD[a.d_i]?.emoji} {PD[a.d_i]?.short}
                        </span>
                      </td>
                      {IK.map(k=>(
                        <td key={k} style={{ padding:'9px 12px', fontWeight:'700', color:PD[k].hex, textAlign:'center', fontSize:'13px' }}>{a.ins?.[k]??'—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selAlu&&<IndividualCard a={selAlu}/>}
          </div>
        </div>
      )}

      {/* GARDNER */}
      {tab==='gardner' && (
        <div>
          <div style={s.card}>
            <div style={s.secT}>Ranking de inteligencias (promedio grupal)</div>
            {topG.map(k=>{
              const pct=Math.round(parseFloat(avgG[k])/20*100)
              return (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                  <div style={{ fontSize:'11px', width:'160px', textAlign:'right', color:'var(--sub)', flexShrink:0 }}>{GD[k].emoji} {GD[k].label}</div>
                  <div style={{ flex:1, height:'20px', background:'var(--s3)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ width:pct+'%', height:'100%', background:GD[k].hex, borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:'6px', fontSize:'10px', fontWeight:'700', color:'#fff', minWidth:'24px' }}>{pct}%</div>
                  </div>
                  <div style={{ fontSize:'11px', width:'36px', color:'var(--muted)' }}>{avgG[k]}</div>
                </div>
              )
            })}
          </div>
          <div style={s.card}>
            <div style={s.secT}>Top 3 por alumno</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>
                  {['ID Alumno','Top 3',...GK.map(k=>GD[k].emoji)].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:'10px', fontWeight:'700', textTransform:'uppercase', color:'var(--muted)', borderBottom:'1px solid var(--border2)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {alumnos.map(a=>{
                    const top3=[...GK].sort((x,y)=>(a.gar?.[y]||0)-(a.gar?.[x]||0)).slice(0,3)
                    return (
                      <tr key={a.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'9px 12px', fontFamily:'monospace', fontSize:'11px', fontWeight:'700' }}>{a.alu_id}</td>
                        <td style={{ padding:'9px 12px' }}>
                          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                            {top3.map(k=>(
                              <span key={k} style={{ padding:'2px 7px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:GD[k].hex+'22', color:GD[k].hex }}>
                                {GD[k].emoji} {GD[k].label}
                              </span>
                            ))}
                          </div>
                        </td>
                        {GK.map(k=>(
                          <td key={k} style={{ padding:'9px 12px', textAlign:'center', fontSize:'12px', fontWeight:'600', color:GD[k].hex }}>{a.gar?.[k]??'—'}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIVO */}
      {tab==='operativo' && <OperativoTab alumnos={alumnos} opCnt={opCnt} n={n} s={s}/>}

      {/* ALUMNOS */}
      {tab==='alumnos' && (
        <div style={s.card}>
          <div style={s.secT}>{n} alumnos cargados</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {alumnos.map(a=>(
              <div key={a.id} style={{ background:'var(--s3)', borderRadius:'8px', padding:'12px 14px', border:'1px solid var(--border)', cursor:'pointer' }}
                onClick={()=>setSelAlu(selAlu?.id===a.id?null:a)}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:'700' }}>{a.alu_id}</div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {a.d_i&&<span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:PD[a.d_i]?.hex+'22', color:PD[a.d_i]?.hex }}>{PD[a.d_i]?.emoji} {PD[a.d_i]?.short}</span>}
                    {a.d_g&&<span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'700', background:GD[a.d_g]?.hex+'22', color:GD[a.d_g]?.hex }}>{GD[a.d_g]?.emoji} {GD[a.d_g]?.label}</span>}
                  </div>
                </div>
                {selAlu?.id===a.id&&<IndividualCard a={a}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IndividualCard({ a }) {
  const totI=Object.values(a.ins||{}).reduce((s,v)=>s+v,0)||1
  const totG=Object.values(a.gar||{}).reduce((s,v)=>s+v,0)||1
  const sortedG=[...GK].sort((x,y)=>(a.gar?.[y]||0)-(a.gar?.[x]||0))
  const OP_LBL={
    cel:{cel_datos:'📱 Con datos',tv:'📺 TV/radio',sin_disp:'⚠️ Sin dispositivo'},
    pc:{pc_propia:'💻 PC propia',solo_cel:'📱 Solo celular',pc_cole:'🏫 Solo PC colegio'},
    comp:{rapido:'⚡ Rápido',visual:'👁️ Con ejemplos',practica:'🔄 Necesita práctica',paso_paso:'📝 Paso a paso',variable:'↔️ Variable'},
    mod:{solo:'👤 Solo',grupo:'👥 Grupo',pareja:'🤝 Pareja',mixto_plan:'🔀 Mixto'},
    cont:{activo:'⚡ Activo',visual:'🎥 Visual',lectura:'📖 Lectura',debate:'💬 Debate',mixto:'🔀 Mezcla'},
    gus:{practica:'⚽ Prácticas',grupal:'👥 Grupales',orden:'📐 Ordenadas',reflexion:'💭 Reflexión',variedad:'🎨 Variedad'},
  }
  return (
    <div style={{ marginTop:'14px', padding:'14px', background:'var(--s1)', borderRadius:'10px', border:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
        <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:PD[a.d_i]?.hex+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>
          {PD[a.d_i]?.emoji}
        </div>
        <div>
          <div style={{ fontSize:'16px', fontWeight:'800', marginBottom:'2px', fontFamily:'monospace', letterSpacing:'1px' }}>{a.alu_id}</div>
          <div style={{ fontSize:'12px', color:'var(--sub)' }}>{PD[a.d_i]?.label} · {GD[a.d_g]?.emoji} {GD[a.d_g]?.label}</div>
          <div style={{ fontSize:'11px', color:'var(--muted)', fontStyle:'italic', marginTop:'2px' }}>{PD[a.d_i]?.desc}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        <div>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', marginBottom:'8px' }}>Insights Discovery</div>
          {IK.map(k=>{const pct=Math.round((a.ins?.[k]||0)/totI*100); return(
            <div key={k} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ fontSize:'10px', width:'80px', textAlign:'right', color:'var(--sub)' }}>{PD[k].emoji} {PD[k].short}</div>
              <div style={{ flex:1, height:'14px', background:'var(--s3)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ width:pct+'%', height:'100%', background:PD[k].hex, borderRadius:'2px' }}/>
              </div>
              <div style={{ fontSize:'10px', width:'28px', color:'var(--muted)' }}>{pct}%</div>
            </div>
          )})}
        </div>
        <div>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', marginBottom:'8px' }}>Inteligencias Múltiples</div>
          {sortedG.map(k=>{const pct=Math.round((a.gar?.[k]||0)/totG*100); return(
            <div key={k} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ fontSize:'10px', width:'105px', textAlign:'right', color:'var(--sub)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{GD[k].emoji} {GD[k].label}</div>
              <div style={{ flex:1, height:'14px', background:'var(--s3)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ width:pct+'%', height:'100%', background:GD[k].hex, borderRadius:'2px' }}/>
              </div>
              <div style={{ fontSize:'10px', width:'28px', color:'var(--muted)' }}>{pct}%</div>
            </div>
          )})}
        </div>
      </div>
      {a.op&&Object.values(a.op).some(v=>v)&&(
        <div style={{ marginTop:'12px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
          {Object.entries(a.op).filter(([,v])=>v).map(([k,v])=>{
            const lblMap={cel:{cel_datos:'📱 Con datos',tv:'📺 TV/radio',sin_disp:'⚠️ Sin dispositivo'},pc:{pc_propia:'💻 PC propia',solo_cel:'📱 Solo celular',pc_cole:'🏫 Solo PC colegio'},comp:{rapido:'⚡ Rápido',visual:'👁️ Con ejemplos',practica:'🔄 Necesita práctica',paso_paso:'📝 Paso a paso',variable:'↔️ Variable'},mod:{solo:'👤 Solo',grupo:'👥 Grupo',pareja:'🤝 Pareja',mixto_plan:'🔀 Mixto'},cont:{activo:'⚡ Activo',visual:'🎥 Visual',lectura:'📖 Lectura',debate:'💬 Debate',mixto:'🔀 Mezcla'},gus:{practica:'⚽ Prácticas',grupal:'👥 Grupales',orden:'📐 Ordenadas',reflexion:'💭 Reflexión',variedad:'🎨 Variedad'}}
            const lbl=lblMap[k]?.[v]
            return lbl?<span key={k} style={{ padding:'2px 9px', borderRadius:'20px', fontSize:'10px', background:'var(--s3)', color:'var(--sub)', border:'1px solid var(--border2)' }}>{lbl}</span>:null
          })}
        </div>
      )}
    </div>
  )
}

function OperativoTab({ alumnos, opCnt, n, s }) {
  const CFG=[
    {key:'cel',title:'📱 Celular',opts:{cel_datos:['#10b981','Con datos'],tv:['#6b7280','TV/radio'],sin_disp:['#ef4444','Sin dispositivo']}},
    {key:'pc',title:'💻 PC',opts:{pc_propia:['#10b981','PC propia'],solo_cel:['#f59e0b','Solo celular'],pc_cole:['#ef4444','PC colegio']}},
    {key:'comp',title:'🧠 Comprensión',opts:{rapido:['#10b981','Rápido'],visual:['#3b82f6','Con ejemplos'],practica:['#f59e0b','Necesita práctica'],paso_paso:['#ef4444','Paso a paso'],variable:['#8b5cf6','Variable']}},
    {key:'mod',title:'👥 Modalidad',opts:{solo:['#6366f1','Solo'],grupo:['#10b981','Grupo'],pareja:['#3b82f6','Pareja'],mixto_plan:['#f59e0b','Solo+grupo']}},
    {key:'cont',title:'📚 Contenido',opts:{activo:['#ef4444','Activo'],visual:['#3b82f6','Visual'],lectura:['#8b5cf6','Lectura'],debate:['#f59e0b','Debate']}},
    {key:'gus',title:'✨ Gusta',opts:{practica:['#ef4444','Prácticas'],grupal:['#10b981','Grupales'],orden:['#457B9D','Ordenadas'],reflexion:['#6366f1','Reflexión'],variedad:['#f59e0b','Variedad']}},
  ]
  const sinPC=alumnos.filter(a=>a.op?.pc==='solo_cel'||a.op?.pc==='pc_cole')
  return (
    <div>
      {sinPC.length>0&&<div style={{ background:'rgba(230,57,70,.08)', border:'1px solid rgba(230,57,70,.3)', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px' }}>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#E63946', marginBottom:'6px' }}>⚠️ Sin PC en casa ({sinPC.length})</div>
        <div style={{ fontSize:'11px', color:'var(--sub)' }}>{sinPC.map(a=>a.alu_id).join(' · ')}</div>
      </div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        {CFG.map(cfg=>{
          const counts=opCnt[cfg.key]||{}
          return (
            <div key={cfg.key} style={{ ...s.card, marginBottom:0 }}>
              <div style={s.secT}>{cfg.title}</div>
              {Object.entries(cfg.opts).map(([k,[hex,lbl]])=>{
                const v=counts[k]||0; if(!v)return null
                const pct=Math.round(v/n*100)
                return (
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'7px' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:hex, flexShrink:0 }}/>
                    <div style={{ fontSize:'11px', flex:1, color:'var(--sub)' }}>{lbl}</div>
                    <div style={{ flex:2, height:'12px', background:'var(--s3)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ width:pct+'%', height:'100%', background:hex, borderRadius:'2px' }}/>
                    </div>
                    <div style={{ fontSize:'10px', width:'28px', textAlign:'right', color:'var(--muted)' }}>{pct}%</div>
                    <div style={{ fontSize:'10px', width:'14px', color:'var(--muted)' }}>{v}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Breadcrumb({ navigate, id, grupo }) {
  return (
    <div style={{ fontSize:'12px', color:'var(--muted)', marginBottom:'14px', display:'flex', gap:'6px', alignItems:'center' }}>
      <span style={{ cursor:'pointer', color:'var(--b)' }} onClick={()=>navigate('/')}>Mis grupos</span>
      <span>›</span>
      <span style={{ cursor:'pointer', color:'var(--b)' }} onClick={()=>navigate(`/grupo/${id}`)}>Esc. {grupo?.escuela} · C. {grupo?.curso}</span>
      <span>›</span>
      <span>Resultados</span>
    </div>
  )
}
