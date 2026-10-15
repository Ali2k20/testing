# KhaleejiBot

Multi-tenant SaaS for UAE businesses to run Arabic-first AI customer-service bots.
Each business trains a bot on its own menus, prices and policies, deploys it as a
website widget and on the **WhatsApp Cloud API**, and the bot understands Emirati
Arabic, Arabizi, English and **voice notes**. When it isn't sure — or the customer
is upset, or asks for a person — it **hands the conversation to a human agent** in a
live, bilingual team inbox.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · next-intl
(Arabic RTL / English LTR, IBM Plex Sans Arabic) · Supabase (Postgres, Auth, RLS,
pgvector, Realtime, Storage) · Vercel AI SDK 7 (Gemini 2.5 Flash / GPT-4o, Whisper
Large-v3 Turbo, OpenAI/Gemini embeddings).

---

## How a message flows

```
Website widget ─┐                       ┌─ save customer message (+ voice note in Storage, transcribed by Whisper)
                ├─► processIncomingMessage ─┤
WhatsApp webhook┘   (src/lib/ai/engine.ts)  ├─ conversation HUMAN_PENDING / HUMAN_ACTIVE?
                                           │     └─ YES → stop. AI stays silent; agents are notified (Realtime)
                                           ├─ pgvector: top-5 knowledge chunks for this bot
                                           ├─ LLM → strict Zod-validated turn (reply, dialect, confidence, frustration, handoff, summary)
                                           └─ handoff policy
                                                 ├─ hand off → status HUMAN_PENDING + AI summary; send bot's AR/EN handoff message
                                                 └─ otherwise → send the AI reply
```

**Handoff triggers** (any one is enough — `src/lib/ai/handoff.ts`):

| Trigger | Source |
| --- | --- |
| `low_confidence` | model's `confidence_score` < the bot's `confidence_threshold` (default 0.75) |
| `frustration` | model's `user_frustration_detected` |
| `model_requested` | model's `requires_human_handoff` (complaints, refunds, payments, …) |
| `explicit_human_request` | deterministic backstop regex: "talk to a human", «أبي أكلم موظف», "abi akalem mowazaf"… |
| `ai_unavailable` | LLM error/timeout/invalid output — fail safe to a person |

Safety details worth knowing:
- **The AI never talks over an agent.** Human-owned conversations skip the LLM entirely.
  If an agent takes over *while* the model is generating, the AI reply is discarded;
  the handoff transition is a conditional `AI_ACTIVE → HUMAN_PENDING` update.
- **Grounded answers.** Knowledge is fenced as data (prompt-injection resistant) and
  the model is told to hand off rather than guess prices, hours or policies.
- **Idempotent webhooks.** WhatsApp message ids are unique in `messages.external_id`;
  Meta retries are dropped before any paid transcription or LLM work.
- **Voice notes in human mode** are still stored and transcribed (speech-to-text only)
  so agents can read them; no reply is generated.

## Project layout

```
supabase/migrations/001_init.sql   schema, RLS, pgvector + match_knowledge_chunks, Realtime, Storage
supabase/tests/                    tenant-isolation assertions (run against real Postgres)
src/lib/ai/
  engine.ts                        Module B: the unified message processor (pure, dependency-injected)
  engine-deps.ts                   production wiring: Supabase repository, AI SDK calls, Realtime notifier
  schema.ts                        the strict structured-output Zod schema
  handoff.ts                       handoff policy, human-request backstop, reply-language choice
  prompts.ts                       dialect personas, grounding rules, history → model messages
  providers.ts                     provider factory (chat / transcription / embeddings via env)
src/lib/channels/whatsapp.ts       inbound WhatsApp → engine → reply; agent replies → WhatsApp
src/lib/whatsapp/                  webhook signature + payload parsing, Graph API client
src/lib/knowledge/                 chunking and embedding of business documents
src/app/api/whatsapp/webhook       Meta verification + signed webhook (processed after the 200)
src/app/api/widget/[botId]/...     public widget API (send text/voice, poll for agent replies)
src/app/widget/[botId]             the chat UI that runs inside the widget iframe
public/widget.js                   one-line embed loader (Shadow DOM launcher + iframe)
src/app/dashboard/                 overview, bots (settings/knowledge/deploy/try), inbox, settings
src/components/inbox/              the Realtime human-handoff inbox
messages/{ar,en}.json              all UI copy (Arabic is the default locale)
```

## Setup

1. **Supabase project.** Apply the migration with the Supabase CLI
   (`supabase link && supabase db push`) or paste `supabase/migrations/001_init.sql`
   into the SQL editor. It enables `vector`, creates every table with RLS, the
   `voice-notes` private bucket, the Realtime publication and the private-channel
   policy. Under *Authentication → URL configuration* set the Site URL to
   `NEXT_PUBLIC_APP_URL` and add `…/auth/callback` to the redirect URLs.
2. **Environment.** `cp .env.example .env.local` and fill it in.
3. **Run.**
   ```bash
   npm install
   npm run dev        # http://localhost:3000
   ```
   Sign up, name your business, create a bot, add knowledge, then use **Try it**.

### Website widget

Bot → **Deploy** gives the snippet:

```html
<script src="https://YOUR_APP/widget.js" data-bot-id="BOT_ID" data-lang="ar" async></script>
```

`data-lang="en"` for English-first, `data-position="left|right"`, `data-color="#…"`.
The launcher lives in a Shadow DOM so the host site's CSS can't break it; the chat
runs in an iframe from your origin and supports text and voice notes (WebM on
Chrome/Firefox, MP4 on Safari). After a handoff the widget polls for agent replies.

### WhatsApp Cloud API

1. In your Meta app, add the WhatsApp product and create a permanent System User token
   with `whatsapp_business_messaging`.
2. Webhook callback URL: `https://YOUR_APP/api/whatsapp/webhook`, verify token =
   `WHATSAPP_VERIFY_TOKEN`; subscribe to the **messages** field. Set `META_APP_SECRET`
   so payload signatures are verified (unsigned requests are rejected).
3. In the dashboard: **Settings → WhatsApp** — phone number ID + token (encrypted with
   AES-256-GCM before it is stored; dashboard users can never read it back). Then on a
   bot's **Deploy** tab, switch on "Answer WhatsApp with this bot".

## Security model

- Every table has RLS. Members see only their organization's rows; only owners/admins
  change bots, knowledge and settings; agents can work conversations.
- Agents can insert messages only as `human_agent` **and** as themselves — they cannot
  impersonate the AI or a teammate.
- Customer traffic never touches the database directly: the widget API and webhook run
  server-side with the service role and scope every query to the bot/tenant.
- `organizations.whatsapp_access_token` has no SELECT/UPDATE grant for `authenticated`.
- Realtime: `postgres_changes` are RLS-filtered; the engine's `inbox:<org_id>` pings use
  private channels gated by a `realtime.messages` policy and carry ids only.
- Voice notes are in a private bucket under `<org_id>/…`, played via 5-minute signed URLs.

## Tests

```bash
npm test                  # 78 unit tests: engine, handoff policy, prompts, chunker, webhook, crypto…
npm run test:db           # applies the migration to a throwaway Postgres + pgvector, runs 41 RLS/RPC assertions
npm run test:integration  # engine + dashboard queries via supabase-js → PostgREST → Postgres (needs POSTGREST_BIN)
npm run lint && npm run typecheck
```

`test:db` and `test:integration` need PostgreSQL 15+ server binaries with pgvector
(`apt install postgresql-16 postgresql-16-pgvector`); the integration suite also needs
a [PostgREST](https://github.com/PostgREST/postgrest/releases) binary.

## Production notes and known limits

- **Rate limiting** on the public widget API is in-memory per instance. Behind
  multiple instances, add a shared limiter (Upstash, Vercel Firewall, Cloudflare).
- **WhatsApp 24-hour window.** Agents can reply freely within 24 h of the customer's
  last message; later replies need an approved template (not implemented).
- **Knowledge formats:** text, Markdown, CSV and JSON. PDF/DOCX extraction is not
  included yet.
- **Plans** limit bots per organization (`src/lib/plans.ts`); billing is not wired up.
- `iterative_scan` for filtered HNSW search is enabled automatically on pgvector ≥ 0.8
  (current Supabase); older versions fall back to a plain HNSW scan.
