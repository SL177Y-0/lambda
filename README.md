## Sparkonomy Code-With-Me Guide (Tailored to This Codebase)

This repo is a Next.js 15 App Router, React 19, TypeScript, Tailwind, Radix UI, Recharts app. It currently renders a fully client-side dashboard (`app/page.tsx`) with mocked data. This guide shows how to extend it across backend APIs, frontend UI, fullstack wiring, middleware/security, database modeling, debugging, algorithms, and system design — all aligned with this project’s style.

Important aliases:
- `@/app` → Next.js App Router (pages + future API routes)
- `@/components/ui` → Shadcn-style UI wrappers
- `@/lib` → Utilities (e.g., `cn`)

---

### 1) Backend API Tasks (Next.js App Router)

We’ll use Next.js Route Handlers under `app/api/.../route.ts`. For data, prefer MongoDB via Mongoose or a simple in-memory array while prototyping.

- Foldering pattern:
```
app/
  api/
    invoices/
      route.ts           # GET (list with filters/pagination), POST (create)
    invoices/
      [id]/
        route.ts         # GET (by id), PUT/PATCH (update), DELETE (remove)
    invoices/
      [id]/pay/
        route.ts         # PUT (mark paid)
```

- GET /invoices/overdue
```ts
// app/api/invoices/overdue/route.ts
import { NextResponse } from 'next/server'
import { getDb, Invoice } from '@/server/db' // create these (see DB section)

export async function GET() {
  await getDb()
  const overdue = await Invoice.find({ status: 'Overdue' }).lean()
  return NextResponse.json({ data: overdue })
}
```

- GET /invoices/:id
```ts
// app/api/invoices/[id]/route.ts
import { NextResponse } from 'next/server'
import { getDb, Invoice } from '@/server/db'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await getDb()
  const inv = await Invoice.findById(params.id).lean()
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: inv })
}
```

- PUT /invoices/:id/pay
```ts
// app/api/invoices/[id]/pay/route.ts
import { NextResponse } from 'next/server'
import { getDb, Invoice } from '@/server/db'

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  await getDb()
  const updated = await Invoice.findByIdAndUpdate(
    params.id,
    { status: 'Paid' },
    { new: true }
  ).lean()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}
```

- Pagination + Filtering/Sorting (query params: `page`, `limit`, `status`, `q`, `sort`, `from`, `to`)
```ts
// app/api/invoices/route.ts
import { NextResponse } from 'next/server'
import { getDb, Invoice } from '@/server/db'

export async function GET(req: Request) {
  await getDb()
  const url = new URL(req.url)
  const page = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 10)
  const status = url.searchParams.get('status')
  const q = url.searchParams.get('q') // client name search
  const sort = url.searchParams.get('sort') ?? '-createdAt' // default newest
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const filter: any = {}
  if (status) filter.status = status
  if (q) filter.clientName = { $regex: q, $options: 'i' }
  if (from || to) filter.createdAt = {
    ...(from ? { $gte: new Date(from) } : {}),
    ...(to ? { $lte: new Date(to) } : {}),
  }

  const cursor = Invoice.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean()
  const [data, total] = await Promise.all([
    cursor,
    Invoice.countDocuments(filter),
  ])

  return NextResponse.json({ data, page, limit, total })
}
```

- Validation (Zod) + 404s
```ts
import { z } from 'zod'

const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['Paid','Unpaid','Partially Paid','Overdue','Disputed','Awaited','Draft']).optional(),
  currency: z.string().default('USD'),
  discount: z.number().min(0).max(100).optional(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = createInvoiceSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  // ... insert and return
}
```

- Performance tips
  - Use `.lean()` for reads (faster plain objects).
  - Create indexes on `clientName`, `status`, `createdAt`.

- Error middleware analog in App Router: centralize helpers (e.g., `safeJson`) and wrap handlers in try/catch; return structured errors (`{ error, code }`).

---

### 2) Frontend Tasks (This UI)

- Search bar (client name)
  - Add `Input` above the invoice list; keep a `search` state; call `/api/invoices?q=...` or filter locally.

- Status badges
  - Already implemented in `app/page.tsx` with color mapping.

- Form validation
  - Use `zod` with a small helper to validate `newInvoice` before allowing submit; show `DialogDescription` for errors.

- Pagination UI
  - Render Next/Prev buttons; keep `page` in state; fetch `/api/invoices?page=...&limit=...`.

- Date picker
  - `components/ui/calendar` is ready. For forms, either use a popover + calendar or `<input type="date">` as done.

- Summary card
  - KPIs already exist; you can add counts (total invoices, paid count, pending count) from `filteredInvoices`.

- Refresh bug after add
  - The page uses `setInvoices` correctly. If you move to API-backed data, refetch list after POST and optimistic update the UI.

---

### 3) Fullstack Tasks

- Connect form → API
  - On create submit, POST to `/api/invoices` and prepend returned invoice to state (or refetch).

- Dashboard route with totals
  - Current page already computes totals from `filteredInvoices` (`kpiData`). If data becomes server-driven, leverage a summary endpoint (`/api/invoices/summary`).

- Export CSV/PDF
```ts
// CSV: app/api/invoices/export.csv/route.ts
import { NextResponse } from 'next/server'
import { getDb, Invoice } from '@/server/db'

export async function GET() {
  await getDb()
  const rows = await Invoice.find({}).lean()
  const header = 'id,clientName,amount,dueDate,status,createdAt\n'
  const body = rows.map(r => `${r._id},${r.clientName},${r.amount},${r.dueDate},${r.status},${r.createdAt}`).join('\n')
  return new NextResponse(header + body, {
    headers: { 'content-type': 'text/csv; charset=utf-8' },
  })
}
```
  - For PDF, generate server-side (e.g., `pdfkit`/`@react-pdf/renderer`) and return `application/pdf`.

- Download invoice by ID
  - Use `/api/invoices/[id]` for JSON; for PDF, `/api/invoices/[id].pdf` route.

- Toasts/notifications
  - Use a minimal toast lib (e.g., `sonner`) and trigger on status change (Paid/Overdue).

---

### 4) Middleware & Security

- JWT auth (Edge middleware)
```
// middleware.ts at project root
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/invoices')) {
    const token = req.headers.get('authorization')?.replace('Bearer ','')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // verify token (e.g., jose/jwt). On failure -> 401
  }
  return NextResponse.next()
}
```

- RBAC
  - After verifying JWT, attach `role` to request via headers or re-verify inside routes.
  - In handlers, check `role === 'admin'` for write operations.

- Rate limiting
  - Use an in-memory map (dev) or Redis (prod). Guard in `middleware.ts` by IP + route.

- Logging middleware
  - In `middleware.ts`, log `method`, `path`, `ip`, `ts`. For server logs, also wrap handlers.

---

### 5) Database (MongoDB with Mongoose)

- Setup: create `server/db.ts` and `server/models/invoice.ts`.
```ts
// server/db.ts
import mongoose from 'mongoose'

let cached: typeof mongoose | null = null
export async function getDb() {
  if (cached) return cached
  const uri = process.env.MONGODB_URI!
  if (!uri) throw new Error('MONGODB_URI missing')
  cached = await mongoose.connect(uri)
  return cached
}
```
```ts
// server/models/invoice.ts
import { Schema, model, models } from 'mongoose'

const InvoiceSchema = new Schema({
  clientName: { type: String, index: true, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  currency: { type: String, default: 'USD' },
  discount: { type: Number, default: 0 },
  status: { type: String, index: true, enum: ['Paid','Unpaid','Partially Paid','Overdue','Disputed','Awaited','Draft'], default: 'Draft' },
}, { timestamps: { createdAt: true, updatedAt: true } })

export const Invoice = models.Invoice || model('Invoice', InvoiceSchema)
```
- Relations (Client model) and `populate()`
```ts
// server/models/client.ts
import { Schema, model, models } from 'mongoose'
const ClientSchema = new Schema({ name: { type: String, required: true, index: true } })
export const Client = models.Client || model('Client', ClientSchema)

// Add to invoice
// clientId: { type: Schema.Types.ObjectId, ref: 'Client' }

// Query with populate
// const rows = await Invoice.find().populate('clientId').lean()
```

- Aggregations
```ts
// Group by status
// Invoice.aggregate([ { $group: { _id: '$status', total: { $sum: '$amount' } } } ])

// Total revenue
// Invoice.aggregate([ { $match: { status: { $in: ['Paid','Partially Paid'] } } }, { $group: { _id: null, sum: { $sum: '$amount' } } } ])
```

- Indexes
  - Ensure indexes on `clientName`, `status`, `createdAt`.

---

### 6) Debugging Tasks

- Incorrect total calculation
  - Extract computation into a helper and unit-test with edge cases (empty, negative, partial paid).

- Broken route
  - Check file path under `app/api/.../route.ts`, verify HTTP verb exported (`GET`/`POST` etc.).

- Null values
  - Enforce Zod input validation; set Mongoose `required` fields; handle missing values in UI with graceful fallbacks.

- MongoDB down
  - Catch `getDb()` errors; return 503 with `{ error: 'DB unavailable' }`; in the UI, show a retry toast.

---

### 7) Algorithms (Quick Solutions)

- Reverse string
```ts
const reverse = (s: string) => s.split('').reverse().join('')
```
- Find duplicates in array
```ts
const duplicates = (arr: any[]) => {
  const seen = new Set(), dup = new Set()
  for (const x of arr) (seen.has(x) ? dup.add(x) : seen.add(x))
  return [...dup]
}
```
- Word count
```ts
const countWords = (s: string) => s.toLowerCase().match(/\b\w+\b/g)?.reduce((m, w) => (m[w]=(m[w]??0)+1,m),{} as Record<string,number>) ?? {}
```
- Flatten nested array
```ts
const flatten = (arr: any[]) => arr.flat(Infinity)
```
- Debounce / Throttle
```ts
const debounce = <T extends (...a:any)=>any>(fn:T, ms:number) => { let t:any; return (...a:Parameters<T>) => { clearTimeout(t); t=setTimeout(()=>fn(...a), ms) } }
const throttle = <T extends (...a:any)=>any>(fn:T, ms:number) => { let p=0; return (...a:Parameters<T>) => { const n=Date.now(); if(n-p>=ms){ p=n; fn(...a) } } }
```
- Second largest number
```ts
const secondLargest = (arr:number[]) => { let a=-Infinity,b=-Infinity; for(const n of arr){ if(n>a){ b=a; a=n } else if(n>b && n!==a){ b=n } } return b }
```
- Minimal REST API (hello world)
```ts
// app/api/hello/route.ts
export async function GET(){ return Response.json({ ok:true }) }
```
- REST vs GraphQL
  - REST: resource-based endpoints, caching via HTTP semantics, simpler infra.
  - GraphQL: single endpoint, client specifies shape, reduces over/under-fetching but adds server complexity.
- async/await vs promises
  - `async/await` makes promise chains read like sync code; still returns promises; use `try/catch` for errors.

---

### 8) System Design / Architecture

- Scale to 10k users
  - Next.js on Vercel/Node with stateless API routes.
  - MongoDB Atlas with proper indexes.
  - Cache hot queries (e.g., recent invoices) using edge cache or Redis.
  - Paginate everywhere; avoid N+1 with `populate()` carefully.

- File uploads (invoice PDFs)
  - Client uploads to S3/GCS via signed URLs (no backend proxying large files).
  - Store file metadata + key in DB; serve via CDN with signed URLs.

- Payment gateway (Stripe/Razorpay)
  - Server route to create payment intent/order; store invoice + payment state; webhooks to update status to `Paid`.

- Notifications (email/SMS reminders)
  - CRON (e.g., Vercel Cron + API route) scans `Overdue`/`Awaited` and triggers transactional emails/SMS (Resend/Twilio). Record last-reminded timestamps in DB.

- Multi-tenancy
  - Add `tenantId` to all entities; scope every query by `tenantId` from JWT. Use compound indexes `{ tenantId, clientName }`.

---

### 9) Implementation Notes for This Repo

- Keep code human-readable; small helpers in `@/lib` for logic shared by page and API.
- UI: Prefer existing `@/components/ui/*` primitives; style via Tailwind + `cn`.
- API: co-locate route handlers under `app/api`; validate with Zod; standardize JSON shape `{ data, error?, meta? }`.
- Env: never hardcode secrets; use `process.env.*` and document required envs in README.

---

If you want, I can scaffold the Mongo models and one or two API routes now, then wire the page to fetch from the API instead of mock data.
