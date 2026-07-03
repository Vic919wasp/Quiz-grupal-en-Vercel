# ⚽ Quiz Grupal

Herramienta de diagnóstico grupal basada en **Insights Discovery** e **Inteligencias Múltiples (Gardner)**.
Auth con Google · Datos en Supabase · Generación de preguntas con IA · Deploy en Netlify.

---

## 🚀 Setup paso a paso

### 1. Crear proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com) → **Start your project** → loguearse con GitHub o Gmail
2. **New project** → ponerle nombre (ej: `quiz-grupal`) → elegir contraseña → región `South America (São Paulo)` → **Create new project**
3. Esperar ~2 minutos a que termine de crear
4. En el menú izquierdo: **SQL Editor** → **New query** → pegar todo el contenido de `supabase_setup.sql` → **Run**
5. En el menú izquierdo: **Authentication** → **Providers** → **Google** → habilitar → completar Client ID y Secret (ver paso 2)

### 2. Habilitar Google Auth en Supabase

Para obtener el Client ID y Secret de Google:
1. Ir a [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs: pegar la URL que muestra Supabase en Authentication → Providers → Google (algo como `https://xxxx.supabase.co/auth/v1/callback`)
5. Copiar **Client ID** y **Client Secret** → pegarlos en Supabase → **Save**

### 3. Obtener las variables de entorno de Supabase

En Supabase → **Settings** (ícono ⚙️) → **API**:
- `VITE_SUPABASE_URL` → Project URL
- `VITE_SUPABASE_ANON_KEY` → anon public key

### 4. Subir a GitHub

```bash
git init
git add .
git commit -m "feat: Quiz Grupal con Supabase"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/quiz-grupal.git
git push -u origin main
```

### 5. Deploy en Netlify

1. Ir a [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from GitHub**
2. Seleccionar el repo `quiz-grupal`
3. Build command: `npm run build` · Publish directory: `dist` (se autodetectan)
4. **Environment variables** → agregar:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `VITE_ADMIN_EMAIL` | Tu email de Google (para acceso admin) |
| `ANTHROPIC_API_KEY` | Tu API key de Anthropic |

5. **Deploy site** → Netlify genera una URL tipo `quiz-grupal-abc123.netlify.app`

### 6. Autorizar la URL de Netlify en Supabase

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: pegar tu URL de Netlify (ej: `https://quiz-grupal-abc123.netlify.app`)
3. **Redirect URLs**: agregar `https://quiz-grupal-abc123.netlify.app/**`
4. **Save**

### 7. Probar

Abrir la URL de Netlify → clic en **Continuar con Google** → ¡listo!

---

## 📁 Estructura del proyecto

```
quiz-grupal/
├── public/index.html
├── src/
│   ├── supabase.js              ← cliente Supabase
│   ├── App.jsx                  ← router con auth
│   ├── index.css
│   ├── main.jsx
│   ├── lib/quiz.js              ← preguntas, perfiles, calcProfiles()
│   ├── pages/
│   │   ├── Login.jsx            ← Google OAuth via Supabase
│   │   ├── Dashboard.jsx        ← lista grupos del usuario
│   │   ├── Grupo.jsx            ← carga tests alumno a alumno
│   │   ├── Resultados.jsx       ← análisis Insights + Gardner + Operativo
│   │   ├── GeneradorIA.jsx      ← preguntas IA via Netlify Function
│   │   └── Admin.jsx            ← vista admin (ve todo)
│   └── components/
│       ├── NavBar.jsx
│       └── ProtectedRoute.jsx
├── netlify/functions/
│   └── claude.js                ← proxy seguro para ANTHROPIC_API_KEY
├── supabase_setup.sql           ← SQL para crear tablas y políticas RLS
├── .env.example
├── netlify.toml
├── package.json
└── vite.config.js
```

---

## 🔐 Seguridad

- **API key de Anthropic**: solo en Netlify como variable de entorno, nunca en el frontend
- **RLS de Supabase**: cada usuario solo accede a sus propios grupos y alumnos
- **Admin**: definido por `VITE_ADMIN_EMAIL` — ve todos los datos desde `/admin`
- **Google OAuth**: manejado 100% por Supabase, sin código de auth propio

---

## 🧠 Modelos implementados

- **Insights Discovery**: Rojo Fuego · Amarillo Sol · Verde Tierra · Azul Mar
- **Gardner**: Lingüística · Lógico-matemática · Espacial · Musical · Kinestésica · Interpersonal · Intrapersonal · Naturalista
- **Datos operativos**: acceso tecnológico, modalidad, comprensión, preferencias de contenido

---

## ⏱️ Tiempo estimado de setup

| Paso | Tiempo |
|---|---|
| Crear proyecto Supabase + SQL | ~10 min |
| Configurar Google OAuth | ~10 min |
| Subir a GitHub | ~5 min |
| Deploy en Netlify | ~5 min |
| **Total** | **~30 min** |
