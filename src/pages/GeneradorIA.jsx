import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { IK, GK, PD, GD } from '../lib/quiz'

const TEMA_MAP = { futbol:'fútbol y el mundial de fútbol', tecnologia:'tecnología, redes sociales y vida digital', musica:'música, cultura pop y entretenimiento', naturaleza:'naturaleza, medioambiente y entorno cotidiano', escuela:'situaciones de la vida escolar y el aula', libre:'situaciones cotidianas variadas y realistas' }
const FOCO_MAP = { balanced:'Insights Discovery (R/Y/G/B) e Inteligencias Múltiples de Gardner', insights:'Insights Discovery únicamente', gardner:'Inteligencias Múltiples de Gardner únicamente', operativo:'Datos operativos: acceso tecnológico, modalidad y preferencias' }
const NIVEL_MAP = { primario:'primaria (educación básica)', secundario:'secundaria (educación media)', terciario:'terciario o universitario', adultos:'educación de adultos', corporativo:'formación corporativa / empresarial' }
const CONTEXTO_MAP = { urbano:'zona urbana (ciudad, acceso a tecnología)', suburbano:'zona suburbana (periferia de ciudad)', rural:'zona rural (campo, recursos limitados)', virtual:'modalidad virtual o semipresencial' }
const LENGUAJE_MAP = { primario:'simple y claro, con ejemplos del mundo infantil o preadolescente.', secundario:'informal y cercano, en español rioplatense (vos, che). Referenciás la vida escolar, el deporte, la música y las redes.', terciario:'maduro pero accesible. Podés incluir referencias a la vida universitaria y autonomía personal.', adultos:'respetuoso y directo. Referenciás trabajo, familia y responsabilidades cotidianas.', corporativo:'profesional pero no formal en exceso. Referenciás equipo, liderazgo y productividad.' }
const CODE_LABELS = { R:'🔴 Rojo', Y:'🟡 Amarillo', G:'🟢 Verde', B:'🔵 Azul', LI:'📝 Lingüística', LM:'🔢 Lóg-Mat', ES:'🎨 Espacial', MU:'🎵 Musical', CK:'⚽ Kinestésica', IP:'🤝 Interpersonal', IA:'🔮 Intrapersonal', NA:'🌿 Naturalista' }
const codeLabel = c => !c ? '' : c.includes(':') ? '🔍 Operativo' : CODE_LABELS[c] || c

export default function GeneradorIA({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grupo,    setGrupo]    = useState(null)
  const [alumnos,  setAlumnos]  = useState([])
  const [cant,     setCant]     = useState('10')
  const [foco,     setFoco]     = useState('balanced')
  const [tema,     setTema]     = useState('futbol')
  const [obs,      setObs]      = useState('')
  const [edadMin,  setEdadMin]  = useState('15')
  const [edadMax,  setEdadMax]  = useState('15')
  const [nivel,    setNivel]    = useState('secundario')
  const [ctx_,     setCtx_]     = useState('urbano')
  const [loading,  setLoading]  = useState(false)
  const [preguntas,setPregs]    = useState([])
  const [error,    setError]    = useState('')
  const [copied,   setCopied]   = useState(false)
  const [showCtx,  setShowCtx]  = useState(false)

  useEffect(() => {
    supabase.from('grupos').select('*').eq('id', id).single().then(({ data }) => {
      if (!data || data.user_id !== user.id) { navigate('/'); return }
      setGrupo(data)
    })
    supabase.from('alumnos').select('*').eq('grupo_id', id).then(({ data }) => setAlumnos(data || []))
  }, [id])

  function buildCtx() {
    const n = alumnos.length; if (!n) return null
    const sI={R:0,Y:0,G:0,B:0}, sG={}; GK.forEach(k=>sG[k]=0)
    alumnos.forEach(a=>{ IK.forEach(k=>sI[k]+=(a.ins?.[k]||0)); GK.forEach(k=>sG[k]+=(a.gar?.[k]||0)) })
    const avgI={}, avgG={}
    IK.forEach(k=>avgI[k]=(sI[k]/n).toFixed(1)); GK.forEach(k=>avgG[k]=(sG[k]/n).toFixed(1))
    const domI=IK.reduce((a,b)=>avgI[a]>avgI[b]?a:b)
    const topG=[...GK].sort((a,b)=>avgG[b]-avgG[a]).slice(0,3).map(k=>GD[k].label).join(', ')
    return { n, avgI, avgG, domI, domILabel:PD[domI]?.label, topG,
             sinPC:alumnos.filter(a=>a.op?.pc==='solo_cel'||a.op?.pc==='pc_cole').length,
             sinCel:alumnos.filter(a=>a.op?.cel==='sin_disp').length }
  }
  const ctx = buildCtx()

  function buildPrompt() {
    if (!ctx||!grupo) return ''
    const er=edadMin===edadMax?`${edadMin} años`:`entre ${edadMin} y ${edadMax} años`
    const topG3=[...GK].sort((a,b)=>ctx.avgG[b]-ctx.avgG[a]).slice(0,3).map(k=>GD[k].label).join(', ')
    return `Sos un experto en psicología educativa y diseño de instrumentos de diagnóstico grupal.

TARGET DEL GRUPO:
- Edad: ${er}
- Nivel educativo: ${NIVEL_MAP[nivel]||nivel}
- Contexto: ${CONTEXTO_MAP[ctx_]||ctx_}
- Lenguaje: ${LENGUAJE_MAP[nivel]||'Claro y adaptado al grupo.'}

DATOS DEL GRUPO:
- Escuela ${grupo.escuela}, Curso ${grupo.curso}, ${ctx.n} alumnos
- Perfil Insights dominante: ${ctx.domILabel}
- Promedios Insights: Rojo ${ctx.avgI.R} · Amarillo ${ctx.avgI.Y} · Verde ${ctx.avgI.G} · Azul ${ctx.avgI.B}
- Top 3 Gardner: ${topG3}
- Sin PC en casa: ${ctx.sinPC} · Sin dispositivo: ${ctx.sinCel}
${obs?`- Observación: ${obs}`:''}

TAREA: Generá exactamente ${cant} preguntas de quiz NUEVAS.
1. TEMÁTICA: ${TEMA_MAP[tema]} — adaptadas a ${er} en ${CONTEXTO_MAP[ctx_]||ctx_}.
2. FOCO: Miden ${FOCO_MAP[foco]}.
3. FORMATO: Exactamente 3 opciones (A, B, C).
4. SUTILEZA: El alumno NO sabe qué se mide.
5. ADAPTACIÓN: Perfil dominante ${ctx.domILabel} — incluí preguntas que diferencien los perfiles menos representados.
6. LENGUAJE: ${LENGUAJE_MAP[nivel]||'Claro y adaptado.'}
7. CONTEXTO CULTURAL: Usá referencias propias de ${CONTEXTO_MAP[ctx_]||ctx_}.

RESPONDÉ SOLO con JSON válido, sin texto ni markdown:
{"preguntas":[{"numero":1,"texto":"...","opciones":[{"letra":"A","texto":"...","codigo":"R"},{"letra":"B","texto":"...","codigo":"G"},{"letra":"C","texto":"...","codigo":"LI"}],"mide":"..."}]}

Códigos: R,Y,G,B — LI,LM,ES,MU,CK,IP,IA,NA — CEL:x, PC:x, COM:x, MOD:x`
  }

  async function generar() {
    if (!ctx) { setError('Cargá alumnos primero.'); return }
    setLoading(true); setError(''); setPregs([])
    try {
      const resp = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: buildPrompt() }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error||`Error ${resp.status}`)
      let raw = data.content||''
      raw = raw.replace(/^```json[\r\n]*/,'').replace(/[\r\n]*```$/,'').trim()
      setPregs(JSON.parse(raw).preguntas||[])
    } catch(e) { setError('Error: '+e.message) }
    finally { setLoading(false) }
  }

  function copiar() {
    const txt=preguntas.map(q=>`${q.numero}. ${q.texto}\n`+q.opciones.map(o=>`   ${o.letra}) ${o.texto}`).join('\n')).join('\n\n')
    navigator.clipboard.writeText(txt).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000) })
  }

  function imprimir() {
    if (!preguntas.length||!grupo) return
    const er=edadMin===edadMax?`${edadMin} años`:`${edadMin}–${edadMax} años`
    const nl={primario:'Primario',secundario:'Secundario',terciario:'Terciario',adultos:'Adultos',corporativo:'Corporativo'}[nivel]||nivel
    const cl={urbano:'Urbano',suburbano:'Suburbano',rural:'Rural',virtual:'Virtual'}[ctx_]||ctx_
    const tl={futbol:'Fútbol',tecnologia:'Tecnología',musica:'Música',naturaleza:'Naturaleza',escuela:'Escuela',libre:'Libre'}[tema]||tema
    const mitad=Math.ceil(preguntas.length/2), col1=preguntas.slice(0,mitad), col2=preguntas.slice(mitad)
    const qH=q=>`<div class="qb"><div class="qt"><span class="qn">${q.numero}</span> ${q.texto}</div><div class="qo">${q.opciones.map(o=>`<div class="op"><span class="cb"></span><span><b>${o.letra})</b> ${o.texto}</span></div>`).join('')}</div></div>`
    const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Quiz Grupal</title><style>
*{box-sizing:border-box;margin:0;padding:0}@page{size:A4;margin:1.1cm 1.3cm}
body{font-family:Arial,sans-serif;font-size:8pt;color:#111;background:#fff}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:8px}
.hdr h1{font-size:12pt;font-weight:900;letter-spacing:1px;margin-bottom:1px}.hdr p{font-size:7pt;color:#555}
.hdr-r{text-align:right;font-size:7pt;color:#555;line-height:1.7}
.datos{display:flex;gap:10px;border:1px solid #bbb;border-radius:3px;padding:5px 8px;margin-bottom:8px;background:#f9f9f9}
.di{display:flex;align-items:baseline;gap:4px;flex:1}.dl{font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#555;white-space:nowrap}
.dl2{border-bottom:1px solid #888;flex:1;height:13px;min-width:28px}
.instr{font-size:7pt;background:#f0f0f0;border-left:3px solid #333;padding:4px 7px;margin-bottom:8px;line-height:1.5}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}.col{display:flex;flex-direction:column;gap:6px}
.qb{border:1px solid #ddd;border-radius:2px;padding:5px 6px;page-break-inside:avoid}
.qt{font-size:7.8pt;font-weight:700;line-height:1.4;margin-bottom:4px}
.qn{display:inline-block;background:#222;color:#fff;border-radius:2px;padding:0 3px;font-size:7pt;margin-right:2px}
.qo{display:flex;flex-direction:column;gap:2px}
.op{display:flex;align-items:flex-start;gap:4px;font-size:7.3pt;line-height:1.4}
.cb{display:inline-block;width:9px;height:9px;border:1.2px solid #555;border-radius:1px;flex-shrink:0;margin-top:1px}
.ftr{margin-top:8px;border-top:1px solid #ccc;padding-top:4px;font-size:6pt;color:#888;display:flex;justify-content:space-between}
</style></head><body>
<div class="hdr"><div><h1>QUIZ GRUPAL</h1><p>Esc. ${grupo.escuela} · Curso ${grupo.curso} · ${er} · ${nl} · ${cl}</p></div>
<div class="hdr-r"><div>Temática: ${tl}</div><div>Preguntas: ${preguntas.length}</div><div>Fecha: ___/___/______</div></div></div>
<div class="datos">
<div class="di"><span class="dl">Nro. Hoja:</span><div class="dl2"></div></div>
<div class="di"><span class="dl">Escuela Nro.:</span><div class="dl2"></div></div>
<div class="di"><span class="dl">Curso Nro.:</span><div class="dl2"></div></div>
<div class="di"><span class="dl">Fecha (ddmmaaaa):</span><div class="dl2"></div></div></div>
<div class="instr"><b>INSTRUCCIONES:</b> Leé cada situación y marcá con una <b>X</b> la opción (A, B o C) que mejor te describe. No hay respuestas correctas ni incorrectas — elegí la más honesta. Completá todas las preguntas.</div>
<div class="cols"><div class="col">${col1.map(qH).join('')}</div><div class="col">${col2.map(qH).join('')}</div></div>
<div class="ftr"><span>Quiz Grupal · IA · ${new Date().toLocaleDateString('es-AR')}</span><span>Esc.${grupo.escuela} · C.${grupo.curso} · ${er}</span></div>
<script>window.onload=()=>window.print();<\/script></body></html>`
    const w=window.open('','_blank'); if(w){w.document.write(html);w.document.close()}
    else alert('Habilitá las ventanas emergentes para imprimir.')
  }

  const s={page:{padding:'24px',maxWidth:'960px',margin:'0 auto'},card:{background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:'12px',padding:'18px',marginBottom:'14px'},lbl:{fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:'5px'},secT:{fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'12px',paddingBottom:'6px',borderBottom:'1px solid var(--border)'},btn:{padding:'9px 18px',borderRadius:'8px',border:'none',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}

  const insData=ctx?IK.map(k=>({k,label:PD[k].label,emoji:PD[k].emoji,hex:PD[k].hex,avg:parseFloat(ctx.avgI[k]),pct:Math.round(parseFloat(ctx.avgI[k])/20*100),count:alumnos.filter(a=>a.d_i===k).length})):[]

  if (!grupo) return <div style={{padding:'28px',color:'var(--muted)'}}>Cargando…</div>

  return (
    <div style={s.page}>
      <div style={{fontSize:'12px',color:'var(--muted)',marginBottom:'14px',display:'flex',gap:'6px'}}>
        <span style={{cursor:'pointer',color:'var(--b)'}} onClick={()=>navigate('/')}>Mis grupos</span><span>›</span>
        <span style={{cursor:'pointer',color:'var(--b)'}} onClick={()=>navigate(`/grupo/${id}`)}>Esc. {grupo.escuela} · C. {grupo.curso}</span><span>›</span>
        <span>Preguntas IA</span>
      </div>
      <h2 style={{fontSize:'22px',fontWeight:'800',marginBottom:'6px'}}>🤖 Generador de Preguntas IA</h2>
      <p style={{fontSize:'13px',color:'var(--sub)',marginBottom:'22px',lineHeight:'1.7'}}>
        Claude analiza el perfil del grupo y genera nuevas preguntas adaptadas al target configurado.
        {!ctx&&<span style={{color:'var(--r)'}}> Cargá alumnos primero.</span>}
      </p>

      {/* PERFIL */}
      {ctx&&(
        <div style={s.card}>
          <div style={{...s.secT,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>📊 Perfil del grupo ({ctx.n} alumnos)</span>
            <button style={{...s.btn,background:'var(--s3)',color:'var(--muted)',border:'1px solid var(--border2)',padding:'4px 10px',fontSize:'11px'}} onClick={()=>setShowCtx(!showCtx)}>{showCtx?'Ocultar ▲':'Ver detalle ▼'}</button>
          </div>
          <div style={{display:'flex',gap:'7px',flexWrap:'wrap',marginBottom:showCtx?'14px':'0'}}>
            {insData.map(d=><div key={d.k} style={{padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',background:d.hex+'22',color:d.hex}}>{d.emoji} {d.label}: {d.avg}pts ({d.count}alu)</div>)}
            {ctx.sinPC>0&&<div style={{padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',background:'rgba(230,57,70,.15)',color:'var(--r)'}}>⚠️ {ctx.sinPC} sin PC</div>}
          </div>
          {showCtx&&insData.map(d=>(
            <div key={d.k} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'7px',marginTop:'10px'}}>
              <div style={{fontSize:'11px',width:'120px',textAlign:'right',color:'var(--sub)'}}>{d.emoji} {d.label}</div>
              <div style={{flex:1,height:'18px',background:'var(--s3)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{width:d.pct+'%',height:'100%',background:d.hex,borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:'6px',fontSize:'10px',fontWeight:'700',color:'#fff',minWidth:'24px'}}>{d.pct}%</div>
              </div>
              <div style={{fontSize:'11px',width:'36px',color:'var(--muted)'}}>{d.avg}</div>
            </div>
          ))}
        </div>
      )}

      {/* TARGET */}
      <div style={s.card}>
        <div style={s.secT}>🎯 Target del grupo</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'12px'}}>
          <div><label style={s.lbl}>Edad mínima</label><input type="number" min="6" max="70" value={edadMin} onChange={e=>setEdadMin(e.target.value)} style={{fontSize:'20px',fontWeight:'800',textAlign:'center'}}/></div>
          <div><label style={s.lbl}>Edad máxima</label><input type="number" min="6" max="70" value={edadMax} onChange={e=>setEdadMax(e.target.value)} style={{fontSize:'20px',fontWeight:'800',textAlign:'center'}}/></div>
          <div><label style={s.lbl}>Nivel educativo</label>
            <select value={nivel} onChange={e=>setNivel(e.target.value)}>
              <option value="primario">🏫 Primario</option><option value="secundario">📚 Secundario</option>
              <option value="terciario">🎓 Terciario</option><option value="adultos">👤 Adultos</option>
              <option value="corporativo">💼 Corporativo</option>
            </select></div>
          <div><label style={s.lbl}>Contexto</label>
            <select value={ctx_} onChange={e=>setCtx_(e.target.value)}>
              <option value="urbano">🏙️ Urbano</option><option value="suburbano">🏘️ Suburbano</option>
              <option value="rural">🌾 Rural</option><option value="virtual">💻 Virtual</option>
            </select></div>
        </div>
        <div style={{background:'var(--s3)',borderRadius:'8px',padding:'9px 13px',fontSize:'12px',color:'var(--sub)',border:'1px solid var(--border)'}}>
          <strong style={{color:'var(--text)'}}>Target: </strong>
          {edadMin===edadMax?`${edadMin} años`:`${edadMin}–${edadMax} años`}
          {' · '}{nivel==='secundario'?'Secundario':nivel==='primario'?'Primario':nivel==='terciario'?'Terciario':nivel==='adultos'?'Adultos':'Corporativo'}
          {' · '}{ctx_==='urbano'?'Zona urbana':ctx_==='suburbano'?'Zona suburbana':ctx_==='rural'?'Zona rural':'Virtual'}
        </div>
      </div>

      {/* CONFIG */}
      <div style={s.card}>
        <div style={s.secT}>⚙️ Configuración</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
          <div><label style={s.lbl}>Cantidad</label>
            <select value={cant} onChange={e=>setCant(e.target.value)}>
              {['5','10','15','20'].map(v=><option key={v} value={v}>{v} preguntas</option>)}
            </select></div>
          <div><label style={s.lbl}>Foco diagnóstico</label>
            <select value={foco} onChange={e=>setFoco(e.target.value)}>
              <option value="balanced">Balanceado (Insights + Gardner)</option>
              <option value="insights">Solo Insights Discovery</option>
              <option value="gardner">Solo Gardner (IM)</option>
              <option value="operativo">Solo datos operativos</option>
            </select></div>
          <div><label style={s.lbl}>Temática</label>
            <select value={tema} onChange={e=>setTema(e.target.value)}>
              <option value="futbol">⚽ Fútbol y mundial</option><option value="tecnologia">📱 Tecnología</option>
              <option value="musica">🎵 Música</option><option value="naturaleza">🌿 Naturaleza</option>
              <option value="escuela">🏫 Vida escolar</option><option value="libre">💬 Libre</option>
            </select></div>
        </div>
        <div><label style={s.lbl}>Observación adicional (opcional)</label>
          <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3}
            placeholder="Ej: diferenciá mejor Rojo de Amarillo, son de zona rural evitá referencias urbanas…"
            style={{resize:'vertical'}}/></div>
      </div>

      <button onClick={generar} disabled={loading||!ctx}
        style={{...s.btn,background:'linear-gradient(135deg,#457B9D,#2A9D8F)',color:'#fff',padding:'13px 28px',fontSize:'14px',width:'100%',marginBottom:'20px',opacity:(loading||!ctx)?.6:1}}>
        {loading?'⚙️ Generando preguntas…':'✨ Generar Preguntas con IA'}
      </button>

      {error&&<div style={{background:'rgba(230,57,70,.1)',border:'1px solid var(--r)',borderRadius:'8px',padding:'12px 16px',fontSize:'13px',color:'var(--r)',marginBottom:'16px'}}>⚠️ {error}</div>}
      {loading&&<div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>
        <div style={{fontSize:'34px',marginBottom:'12px',display:'inline-block',animation:'spin 1.2s linear infinite'}}>⚙️</div>
        <p style={{fontSize:'13px'}}>Claude está generando {cant} preguntas…</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>}

      {preguntas.length>0&&!loading&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginBottom:'10px',flexWrap:'wrap'}}>
            <div style={s.secT}>{preguntas.length} preguntas generadas</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button style={{...s.btn,background:'var(--s3)',color:'var(--muted)',border:'1px solid var(--border2)'}} onClick={copiar}>{copied?'✓ Copiado':'📋 Copiar'}</button>
              <button style={{...s.btn,background:'rgba(42,157,143,.15)',color:'var(--g)',border:'1px solid var(--g)'}} onClick={imprimir}>🖨️ Imprimir / PDF</button>
              <button style={{...s.btn,background:'var(--s3)',color:'var(--muted)',border:'1px solid var(--border2)'}} onClick={generar}>🔄 Regenerar</button>
            </div>
          </div>
          <div style={{background:'rgba(42,157,143,.08)',border:'1px solid rgba(42,157,143,.25)',borderRadius:'8px',padding:'9px 13px',marginBottom:'14px',fontSize:'11px',color:'var(--sub)',display:'flex',gap:'8px'}}>
            <span>🖨️</span><span>Clic en <strong style={{color:'var(--text)'}}>Imprimir / PDF</strong> para abrir la hoja A4 lista. Elegí <em>"Guardar como PDF"</em> en el diálogo.</span>
          </div>
          {preguntas.map((q,i)=>(
            <div key={i} style={{...s.card,marginBottom:'10px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'10px',marginBottom:'10px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:'10px',flex:1}}>
                  <div style={{background:'var(--g)',color:'#fff',borderRadius:'6px',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'13px',flexShrink:0}}>{q.numero}</div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text)',lineHeight:'1.5'}}>{q.texto}</div>
                </div>
                {q.mide&&<div style={{fontSize:'10px',color:'var(--muted)',background:'var(--s3)',padding:'3px 8px',borderRadius:'20px',whiteSpace:'nowrap',flexShrink:0,border:'1px solid var(--border)'}}>🎯 {q.mide}</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {q.opciones?.map((o,oi)=>(
                  <div key={oi} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'8px 12px',background:'var(--s3)',borderRadius:'7px',border:'1px solid var(--border)'}}>
                    <div style={{fontWeight:'800',fontSize:'15px',color:'var(--g)',flexShrink:0,width:'16px'}}>{o.letra}</div>
                    <div style={{fontSize:'12px',color:'var(--sub)',flex:1,lineHeight:'1.5'}}>{o.texto}</div>
                    <div style={{fontSize:'10px',color:'var(--muted)',flexShrink:0,padding:'2px 7px',background:'var(--bg)',borderRadius:'20px'}}>{codeLabel(o.codigo)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
