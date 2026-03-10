# Deploying the Insights Edge Function to Supabase

## Step 1 — Install Supabase CLI

```bash
npm install -g supabase
```

Verify:
```bash
supabase --version
```

## Step 2 — Set up the folder structure

In your project root, create this folder:
```
supabase/
  functions/
    insights/
      index.ts    ← paste the edge function code here
```

## Step 3 — Login and link to your project

```bash
supabase login
```
This opens your browser — log in with your Supabase account.

Then link to your project (find your project ID in Supabase Dashboard → Project Settings → General):
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

## Step 4 — Deploy the function

```bash
supabase functions deploy insights --no-verify-jwt
```

`--no-verify-jwt` means the frontend can call it directly without passing an auth token.

You'll see:
```
Deployed Function insights on project YOUR_PROJECT_ID
```

Your function is now live at:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/insights
```

## Step 5 — Update frontend

Replace `src/hooks/useInsights.js` with the new version that uses `supabase.functions.invoke()`.

Remove `VITE_ML_API_URL` from `.env.local` — no longer needed.

## Step 6 — Deploy frontend to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then:
```bash
vercel --prod
```

## Final architecture

```
Browser (Vercel — free forever)
    ↓  auth + data queries
Supabase Postgres (free, just log in weekly)
    ↓  insights API
Supabase Edge Function (free, 500k calls/month)
```

Zero separate servers. Zero monthly cost. Zero spin-down delays.
