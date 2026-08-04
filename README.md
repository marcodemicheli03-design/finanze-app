# Finanze — Step 1: scheletro + login

Questo è il primo pezzo dell'app: autenticazione via magic link (solo la tua
email può entrare) e una dashboard vuota, pronta per le sezioni successive.

## 1. Recuperare le chiavi Supabase

Nel tuo progetto Supabase: **Project Settings → API**.
Ti servono due valori:
- **Project URL**
- **anon public key**

## 2. Configurare l'ambiente in locale

```
cp .env.local.example .env.local
```

Apri `.env.local` e incolla i due valori:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

## 3. Avviare in locale

```
npm install
npm run dev
```

Apri http://localhost:3000 — dovresti finire sulla pagina di login, ricevere
il magic link via email, ed entrare nella dashboard.

## 4. Caricare su GitHub

```
git init
git add .
git commit -m "Step 1: scheletro app + login"
git branch -M main
git remote add origin <URL_DEL_TUO_REPO_GITHUB>
git push -u origin main
```

(Crea prima un repo vuoto su github.com — nome libero, es. "finanze-app".)

## 5. Deploy su Vercel

1. Su vercel.com → **Add New → Project** → seleziona il repo appena creato
2. In **Environment Variables** aggiungi le stesse due chiavi del punto 2
3. Deploy

## 6. Aggiornare l'URL di redirect in Supabase

Una volta ottenuto l'indirizzo Vercel (es. `finanze-app.vercel.app`), vai in
Supabase → **Authentication → URL Configuration** e aggiungi:
- Site URL: `https://finanze-app.vercel.app`
- Redirect URLs: `https://finanze-app.vercel.app/auth/callback`

Senza questo passaggio il magic link ti riporterà a `localhost` invece che
all'app pubblicata.
