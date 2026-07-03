import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { PD, GD } from '../lib/quiz'

export default function Admin() {
  const [grupos,  setGrupos]  = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [tab,     setTab]     = useState('grupos')
  const [search,  setSearch]  = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('grupos').select('*').order('created_at',{ascending:false}).then(({data})=>setGrupos(data||[]))
    supabase.from('alumnos').select('*').order('created_at',{ascending:false}).then(({data})=>setAlumnos(data||[]))
  }, [])

  const totalUsers   = [...new Set(grupos.map(g=>g.user_id))].length
  const insGlobal    = {}; alumnos.forEach(a=>{if(a.d_i)insGlobal[a.d_i]=(insGlobal[a.d_i]||0)+1})
  const gardGlobal   = {}; alumnos.forEach(a=>{if(a.d_g)gardGlobal[a.d_g]=(gardGlobal[a.d_g]||0)+1})
  const filtGrupos   = grupos.filter(g=>!search||g.escuela?.includes(search)||g.curso?.includes(search)||g.email?.toLowerCase().includes(search.toLowerCase()))
  const filtAlumnos  = alumnos.filter(a=>!search||a.alu_id?.includes(search)||a.escuela?.includes(search)||a.curso?.includes(search))

  const s = {
    page: {padding:'24px',maxWidth:'1200px',margin:'0 auto'},
    card: {background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:'12px',padding:'18px',marginBottom:'14px'},
    secT: {fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'14px',paddingBottom:'6px',borderBottom:'1px solid var(--border)'},
    tab:  (a)=>({padding:'9px 16px',borderRadius:'8px 8px 0 0',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'13px',fontWeight:'600',background:a?'var(--s2)':'transparent',color:a?'var(--text)':'var(--muted)',borderBottom:a?'2px solid var(--y)':'2px solid transparent'}),
    btn:  {padding:'7px 14px',borderRadius:'7px',border:'none',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'},
  }

  return (
    <div style={s.page}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <h2 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>🔧 Panel de Administración</h2>
          <p style={{fontSize:'12px',color:'var(--sub)'}}>Vista global — todos los grupos y alumnos del sistema</p>
        </div>
        <div style={{background:'rgba(233,163,32,.1)',border:'1px solid rgba(233,163,32,.4)',padding:'4px 14px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',color:'#E9A320'}}>🔑 Admin</div>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'22px'}}>
        {[{label:'Usuarios',val:totalUsers,color:'var(--b)',emoji:'👤'},{label:'Grupos',val:grupos.length,color:'var(--y)',emoji:'📋'},{label:'Tests cargados',val:alumnos.length,color:'var(--g)',emoji:'📝'},{label:'Tests cargados',val:alumnos.length,color:'var(--r)',emoji:'👥'}].map((item,i)=>(
          <div key={i} style={{...s.card,borderTop:`3px solid ${item.color}`,marginBottom:0}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'6px'}}>{item.emoji} {item.label}</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'38px',fontWeight:'900',color:item.color,lineHeight:1}}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* DISTRIBUCIÓN */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'22px'}}>
        <div style={s.card}>
          <div style={s.secT}>🎨 Insights (global)</div>
          {Object.entries(insGlobal).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
            const pct=alumnos.length?Math.round(v/alumnos.length*100):0
            return (
              <div key={k} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                <div style={{fontSize:'11px',width:'110px',textAlign:'right',color:'var(--sub)'}}>{PD[k]?.emoji} {PD[k]?.label}</div>
                <div style={{flex:1,height:'18px',background:'var(--s3)',borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{width:pct+'%',height:'100%',background:PD[k]?.hex,borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:'6px',fontSize:'10px',fontWeight:'700',color:'#fff',minWidth:'24px'}}>{pct}%</div>
                </div>
                <div style={{fontSize:'11px',width:'20px',color:'var(--muted)'}}>{v}</div>
              </div>
            )
          })}
        </div>
        <div style={s.card}>
          <div style={s.secT}>🧠 Gardner (global)</div>
          {Object.entries(gardGlobal).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>{
            const pct=alumnos.length?Math.round(v/alumnos.length*100):0
            return (
              <div key={k} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                <div style={{fontSize:'11px',width:'130px',textAlign:'right',color:'var(--sub)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{GD[k]?.emoji} {GD[k]?.label}</div>
                <div style={{flex:1,height:'18px',background:'var(--s3)',borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{width:pct+'%',height:'100%',background:GD[k]?.hex,borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:'6px',fontSize:'10px',fontWeight:'700',color:'#fff',minWidth:'24px'}}>{pct}%</div>
                </div>
                <div style={{fontSize:'11px',width:'20px',color:'var(--muted)'}}>{v}</div>
              </div>
            )
          })}
        </div>
      </div>

      <input placeholder="🔍 Buscar por escuela, curso, email o ID…" value={search}
        onChange={e=>setSearch(e.target.value)} style={{maxWidth:'400px',marginBottom:'16px'}}/>

      <div style={{display:'flex',gap:'2px',borderBottom:'1px solid var(--border)',marginBottom:'18px'}}>
        {[['grupos','📋 Grupos'],['alumnos','👥 Alumnos']].map(([k,lbl])=>(
          <button key={k} style={s.tab(tab===k)} onClick={()=>setTab(k)}>{lbl}</button>
        ))}
      </div>

      {tab==='grupos'&&(
        <div style={s.card}>
          <div style={s.secT}>{filtGrupos.length} grupos</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['Escuela','Curso','Fecha','Versión','Alumnos','Email','Acciones'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',color:'var(--muted)',borderBottom:'1px solid var(--border2)'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtGrupos.map(g=>(
                  <tr key={g.id} style={{borderBottom:'1px solid var(--border)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--s3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'9px 12px',fontWeight:'700'}}>{g.escuela}</td>
                    <td style={{padding:'9px 12px'}}>{g.curso}</td>
                    <td style={{padding:'9px 12px',fontSize:'11px',color:'var(--muted)'}}>
                      {g.fecha?`${g.fecha.slice(0,2)}/${g.fecha.slice(2,4)}/${g.fecha.slice(4)}`:'—'}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',background:{A:'#E63946',B:'#E9A320',C:'#2A9D8F',D:'#457B9D'}[g.version]+'22',color:{A:'#E63946',B:'#E9A320',C:'#2A9D8F',D:'#457B9D'}[g.version]}}>
                        Ver. {g.version}
                      </span>
                    </td>
                    <td style={{padding:'9px 12px',fontWeight:'700'}}>{g.alumnos||0}</td>
                    <td style={{padding:'9px 12px',fontSize:'11px',color:'var(--muted)'}}>{g.email}</td>
                    <td style={{padding:'9px 12px'}}>
                      <button onClick={()=>navigate(`/grupo/${g.id}/resultados`)}
                        style={{...s.btn,background:'rgba(42,157,143,.15)',color:'var(--g)',border:'1px solid var(--g)'}}>
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='alumnos'&&(
        <div style={s.card}>
          <div style={s.secT}>{filtAlumnos.length} tests</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                {['ID Alumno','Escuela','Curso','Ver.','Insights','Gardner','Cargado'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',color:'var(--muted)',borderBottom:'1px solid var(--border2)'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtAlumnos.map(a=>(
                  <tr key={a.id} style={{borderBottom:'1px solid var(--border)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--s3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:'11px',fontWeight:'700'}}>{a.alu_id}</td>
                    <td style={{padding:'9px 12px'}}>{a.escuela}</td>
                    <td style={{padding:'9px 12px'}}>{a.curso}</td>
                    <td style={{padding:'9px 12px',fontSize:'11px'}}>Ver. {a.version}</td>
                    <td style={{padding:'9px 12px'}}>
                      {a.d_i&&<span style={{padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',background:PD[a.d_i]?.hex+'22',color:PD[a.d_i]?.hex}}>{PD[a.d_i]?.emoji} {PD[a.d_i]?.short}</span>}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      {a.d_g&&<span style={{padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',background:GD[a.d_g]?.hex+'22',color:GD[a.d_g]?.hex}}>{GD[a.d_g]?.emoji} {GD[a.d_g]?.label}</span>}
                    </td>
                    <td style={{padding:'9px 12px',fontSize:'11px',color:'var(--muted)'}}>
                      {a.created_at?new Date(a.created_at).toLocaleDateString('es-AR'):'—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
