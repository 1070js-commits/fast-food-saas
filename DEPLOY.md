# Déploiement Vercel

## 1. Préparer le repo

```powershell
cd C:\Users\fadis\Documents\fastfood-saas
git init
git add .
git commit -m "modules 1-7"
```

Pousser sur GitHub (`gh repo create fastfood-saas --private --source=. --push` ou via l'UI).

## 2. Variables d'environnement Vercel

Dans le dashboard Vercel → Settings → Environment Variables, ajouter :

| Nom | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (⚠️ secret) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `TWILIO_ACCOUNT_SID` | console.twilio.com → Account Info |
| `TWILIO_AUTH_TOKEN` | console.twilio.com → Account Info |
| `TWILIO_FROM_NUMBER` | numéro vérifié Twilio au format E.164 |
| `NEXT_PUBLIC_APP_URL` | https://votre-domaine.vercel.app |

## 3. Connecter Vercel au repo

`vercel` (CLI) ou via l'UI : Import Project → choisir le repo.
Le `vercel.json` à la racine définit déjà :
- region `cdg1` (Paris)
- timeouts étendus pour les routes IA et SMS

## 4. Migrations Supabase

Exécuter dans l'ordre les fichiers `supabase/migrations/00X_*.sql`
via le SQL Editor Supabase ou la CLI :

```powershell
npx supabase db push
```

Ordre :
- `001_*.sql` à `003_*.sql` (modules 1-3 existants)
- `004_stock.sql`
- `006_tickets.sql`

## 5. Vérifier après déploiement

- `/login` accessible
- `/dashboard` redirige vers `/login` si non connecté
- `/dashboard/stats` affiche les graphes
- `/dashboard/ai-insights` → bouton « Lancer l'analyse » ne renvoie pas 500
- `/track/<token>` accessible sans auth après une commande
