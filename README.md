# Travelly

A working, shareable version of Travelly: visitors plan a trip, pick a plan
(₹49 Explorer / ₹99 Plus), pay, and get an AI-written, admin-verified
itinerary — with a real database, an admin panel, and order tracking behind
it.

## What's included

- **Real login** — email/password and "Continue with Google", via Supabase
  Auth. Free either way.
- **Trip planner** → **plan selection & payment** (Razorpay, test mode by
  default) → **AI-generated itinerary** (Claude), merged with your verified
  facts
- **Verified vs AI-Suggested badges** throughout
- **Real database** (Supabase/Postgres) — destinations and orders persist
- **Admin panel** at `/admin` — add/edit/delete destinations (no code edits,
  no redeploy), view every order and its status. Separate password-based
  system from customer login.
- **"My trips"** at `/trips` — customers log in to see their own past orders
  (properly secured — tied to their account, not just a typed-in phone
  number)
- **Order lifecycle** tracked end to end: payment received → AI planning →
  ready
- Installable PWA

## What's intentionally not included yet

- **Multiple admin accounts / roles.** One shared password protects `/admin`.
  Fine for a solo founder; not real RBAC.
- **Robust rate limiting.** The built-in limiter is a simple, free, per-IP
  in-memory guard — good enough to slow down casual abuse, not a substitute
  for a real service like Upstash if this gets real traffic.
- **SMS/WhatsApp delivery.** The itinerary is shown in-browser and
  downloadable as text. Sending it by SMS/WhatsApp needs a paid provider.

## Before you share this with a single real customer

Open `/admin/destinations` once deployed. Every hotel name, price, phone
number, and entry fee in the sample destinations (Jaipur, Munnar) is a
**placeholder** — the admin dashboard will show a warning banner until you
replace it with facts you've actually verified. This isn't optional — it's
the entire point of Travelly's trust model.

---

## Step-by-step: get this live

### 1. Create your accounts and get keys

- **Supabase** (free database) — sign up at supabase.com, create a new
  project, then go to Settings → API and copy the **Project URL** and the
  **service_role** key (not the "anon" key).
- **Anthropic (Claude) API key** — console.anthropic.com → API Keys.
- **Razorpay keys** — dashboard.razorpay.com → Settings → API Keys. Generate
  **Test** keys first (free, no real money moves).

### 2. Set up the database

1. In your Supabase project, open the **SQL Editor** → New query.
2. Open `supabase/schema.sql` from this project, copy the whole file, paste
   it in, and click **Run**.
3. This creates the `destinations` and `orders` tables and loads the two
   sample destinations (still placeholder data — see above).

### 3. Put the code on GitHub

1. Create a free GitHub account if you don't have one.
2. Create a new empty repository (e.g. `travelly`).
3. Upload this whole folder to it (GitHub's website lets you drag-and-drop
   files under "uploading an existing file" if you don't want to use the
   command line).

### 4. Deploy to Vercel (free)

1. Go to vercel.com, sign up with your GitHub account.
2. "Add New Project" → pick your `travelly` repository.
3. Before clicking Deploy, open **Environment Variables** and add every
   variable listed in `.env.local.example`, using your real values. Keep
   `NEXT_PUBLIC_SKIP_PAYMENT=true` and `ALLOW_UNPAID_REQUESTS=true` for now —
   this lets you test everything for free. Pick your own `ADMIN_PASSWORD`
   and a random `SESSION_SECRET`.
4. Click **Deploy**. You'll get a live URL in a couple of minutes.

### 5. Turn on login

Email/password login works with no extra setup. For "Continue with Google":

1. console.cloud.google.com → create a free project (no billing needed) →
   APIs & Services → Credentials → Create OAuth client ID (type: Web).
2. Add Authorized redirect URI:
   `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. In Supabase: Authentication → Providers → Google → paste the Client ID
   and Secret → Save.

You can skip this and email/password alone still works fine.

### 6. Test the whole thing

See the step-by-step testing checklist in the conversation where this was
built, or just: visit your URL → plan a trip → pick a plan → "pay" (free
right now) → see your itinerary → visit `/admin` and log in → visit
`/trips` and look up the phone number you just used.

### 7. Go live with real payments (when ready)

1. In Razorpay, complete business verification and switch to **Live** keys.
2. In Vercel's Environment Variables, swap in the live Razorpay keys, and
   set `NEXT_PUBLIC_SKIP_PAYMENT=false` and `ALLOW_UNPAID_REQUESTS=false`.
   Redeploy.

---

## Local development (optional)

```bash
npm install
cp .env.local.example .env.local   # then fill in your real keys
npm run dev
```


Then open http://localhost:3000 — and http://localhost:3000/admin for the
admin panel.
