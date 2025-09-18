

# Sparkonomy – Invoice Management Dashboard

A modern, mobile-first dashboard built with Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Recharts, and Framer Motion. It showcases invoice tracking, KPI cards, time filtering, and a composited bar/line chart.

This README is a deep, practical walkthrough of the code under the three key aliases:
- `@/app` – App Router pages, global styles, HTML wrapper
- `@/components/ui` – Reusable headless UI components (shadcn-style wrappers over Radix + Tailwind)
- `@/lib` – Utilities used across the UI layer

It explains how things are wired, what each part does, and why it’s written the way it is. Where files are long (e.g., mock data arrays and JSX markup), we focus on meaningful blocks instead of repeating equivalent lines.

---

## Quickstart

```bash
pnpm i         # or npm i / yarn
pnpm dev       # start dev server
pnpm build     # production build
pnpm start     # run production build
```

Project targets Next.js 15 and React 19. Tailwind is configured in `tailwind.config.ts`, with CSS entry at `app/globals.css`.

---

## Path Aliases

Aliases are configured via `components.json` and TypeScript config:
- `@/app` → `app/`
- `@/components` and `@/components/ui` → `components/` and `components/ui/`
- `@/lib` → `lib/`

You’ll see imports like `import { Button } from "@/components/ui/button"` and `import { cn } from "@/lib/utils"` everywhere.

---

## Deep Dive: `@/lib`

### File: `lib/utils.ts`
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
- `clsx` merges truthy class names and handles arrays/objects nicely.
- `twMerge` resolves Tailwind class conflicts (e.g., `p-2` vs `p-4`).
- `cn` combines both: write expressive class logic, get deduped Tailwind output.

This helper is used by virtually all UI components to keep class composition clean and human-readable.

---

## Deep Dive: `@/components/ui`

These are thin, readable wrappers around Radix primitives and Tailwind variants. They give us consistent behavior and styling across the app without locking us into a heavy component framework.

### `components/ui/button.tsx`
- Imports
  - `Slot` from Radix enables `asChild` so Button can render another element (e.g., `<Link>`)
  - `cva` builds a simple variant system for Tailwind classes
  - `cn` merges classes
- `buttonVariants`:
  - Defines `variant` styles: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
  - Defines `size` styles: `default`, `sm`, `lg`, `icon`.
  - Gives sensible defaults.
- `Button`:
  - `asChild` flag decides whether to render a native `button` or pass props to a child via `Slot`.
  - Applies the composed classes using `buttonVariants` and `cn`.

Usage example:
```tsx
<Button variant="outline" size="sm">Click</Button>
```

### `components/ui/badge.tsx`
- Uses `cva` to create a pill badge with `variant` options: `default`, `secondary`, `destructive`, `outline`.
- Renders a simple `div` that takes on styles via `badgeVariants` and `cn`.

### `components/ui/card.tsx`
- A set of wrappers: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- Each is a `forwardRef` div that applies modest Tailwind styling via `cn`.
- Keeps layout concerns tidy and consistent throughout the dashboard.

### `components/ui/avatar.tsx`
- Wraps Radix Avatar: `Avatar`, `AvatarImage`, `AvatarFallback`.
- Uses `cn` for consistent styles.
- In the dashboard header, it renders either the user image or a fallback initial.

### `components/ui/dialog.tsx`
- Wraps Radix Dialog with sensible defaults and transitions.
- Exposes `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`, `DialogPortal`.
- Adds a close button (`X`) in the top-right of the content.

### `components/ui/dropdown-menu.tsx`
- Wraps Radix Dropdown Menu.
- Exposes a comprehensive surface: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, etc.
- Used for the per-invoice status picker.

### `components/ui/input.tsx`
- A styled `<input>` using Tailwind classes.
- For consistency with the design system.

### `components/ui/label.tsx`
- Wraps Radix Label with class-variance.
- Consistent label styling and accessibility.

### `components/ui/select.tsx`
- Wraps Radix Select to create a custom select with Tailwind styling.
- Exposes: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectLabel`, etc.
- Used in the create-invoice dialog for picking status.

### `components/ui/popover.tsx`
- Simple Radix Popover wrapper.
- Provides `Popover`, `PopoverTrigger`, `PopoverContent` with consistent spacing, border, and animation.

### `components/ui/calendar.tsx`
- Wraps `react-day-picker` and wires it to our button styles.
- Reuses `buttonVariants` for the calendar nav and day buttons.
- Exports a drop-in `Calendar` component used to choose dates.

---

## Deep Dive: `@/app`

### Global styles: `app/globals.css`
- Tailwind layers setup (`base`, `components`, `utilities`).
- CSS variables for both light and dark themes in `@layer base`:
  - Tokens like `--background`, `--foreground`, `--ring`, and a set of chart colors.
  - A small set of `--sidebar-*` tokens for layouts that need sidebars.
- Applies the background/foreground to `body`.
- Adds a tiny utility `.text-balance` under `@layer utilities` to balance headings.

Key idea: design tokens live as CSS variables. Tailwind consumes them via config, so the UI stays consistent and easy to theme.

### HTML wrapper: `app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sparkonomy',
  description: 'Sparkonomy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```
- Imports Next `Metadata` to set page title/description.
- Pulls in Geist fonts (sans, mono) and Vercel Analytics.
- Injects a small `<style>` to expose font CSS variables and set `font-family` on `html` early (before Tailwind applies).
- Renders `{children}` (the routed page), then analytics.

Why inline `<style>`? It makes the font variables available immediately and avoids FOUC without extra CSS hops.

### Main page: `app/page.tsx`
The page contains:
1) Imports
2) Types and mock data
3) Local component state
4) Derived state (`useMemo`) for filtering, KPI computation, and chart data
5) Event handlers
6) JSX markup

Below we annotate the important parts.

#### Imports (selected)
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Bar, XAxis, YAxis, ResponsiveContainer, Line, ComposedChart, Tooltip, Cell } from "recharts"
import { Edit, Bell, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { format } from "date-fns"
```
- Pulls all reusable UI building blocks from `@/components/ui`.
- Chart primitives come from Recharts; icons from lucide-react.
- `motion`/`AnimatePresence` handle subtle animations.
- `next/image` optimizes images.
- `date-fns` helps with date formatting.

#### Types and mock data
```tsx
type InvoiceStatus = "Paid" | "Unpaid" | "Partially Paid" | "Overdue" | "Disputed" | "Awaited" | "Draft"

interface Invoice {
  id: string
  clientName: string
  amount: number
  dueDate: string
  status: InvoiceStatus
  createdAt: string
}

const mockInvoices: Invoice[] = [ /* many entries */ ]
```
- Strong typing for status values avoids typos and simplifies filtering.
- `mockInvoices` is a large seed dataset used to populate the UI and charts.
- We don’t enumerate each entry here; they follow the same shape.

#### Component state
```tsx
const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
const [selectedPeriod, setSelectedPeriod] = useState<"1Month" | "3Months" | "1Year" | "Custom">("3Months")
const [customStartDate, setCustomStartDate] = useState<Date>()
const [customEndDate, setCustomEndDate] = useState<Date>()
const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>("All")
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
const [hoveredBar, setHoveredBar] = useState<number | null>(null)
const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
const [newInvoice, setNewInvoice] = useState({ clientName: "", amount: "", dueDate: "", status: "Draft" as InvoiceStatus })
```
- Data and UI state are co-located for the page.
- `newInvoice` is form state for the create dialog; `amount` is a string until we parse it.

#### Date range formatting helper
```tsx
const formatDateRange = () => {
  const now = new Date()
  let startDate: Date
  let endDate = now
  switch (selectedPeriod) { /* sets start date based on period */ }
  const formatDate = (date: Date) => `${day}.${month}.${year}`
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}
```
- Produces a compact label for the page header (e.g., `01.06.2025 - 10.09.2025`).

#### Badges helpers
```tsx
const getStatusBadgeVariant = (status: InvoiceStatus) => { /* maps to shadcn variants */ }
const getStatusBadgeColor = (status: InvoiceStatus) => { /* maps to Tailwind classes */ }
```
- Two levels of mapping: system variant vs. explicit color classes. The UI uses the explicit color class map for the invoice list badges.

#### Filtered invoices (core memo)
```tsx
const filteredInvoices = useMemo(() => {
  let filtered = invoices
  if (statusFilter !== "All") filtered = filtered.filter((i) => i.status === statusFilter)

  const now = new Date()
  let startDate: Date
  switch (selectedPeriod) {
    case "1Month": /* startDate = now minus 1 month */
    case "3Months": /* startDate = now minus 3 months */
    case "1Year": /* startDate = now minus 1 year */
    case "Custom":
      if (customStartDate && customEndDate) {
        startDate = customStartDate
        const endDate = customEndDate
        filtered = filtered.filter((inv) => {
          const d = new Date(inv.createdAt)
          return d >= startDate && d <= endDate
        })
      }
      // If no data in the range, synthesize a small data set so the chart/UI remain populated.
      if (filtered.length === 0 && customStartDate && customEndDate) {
        // generate weekly/monthly synthetic invoices depending on range length
        return synth
      }
      return filtered
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  }

  const periodFiltered = filtered.filter((inv) => new Date(inv.createdAt) >= startDate && new Date(inv.createdAt) <= now)

  if (periodFiltered.length === 0) {
    // Synthesize data for empty windows for 1Month, 3Months, 1Year
    return synth
  }
  return periodFiltered
}, [invoices, statusFilter, selectedPeriod, customStartDate, customEndDate])
```
- This is the brain of the page: it filters by status and time window.
- It also synthesizes plausible data when filters produce no results so that charts never look empty.

#### KPIs (derived sums)
```tsx
const kpiData = useMemo(() => {
  const totalEarnings = filteredInvoices.filter(paidish).reduce(sum, 0)
  const paymentAwaited = filteredInvoices.filter(i => i.status === "Awaited" || i.status === "Unpaid").reduce(sum, 0)
  const paymentOverdue = filteredInvoices.filter(i => i.status === "Overdue").reduce(sum, 0)
  return { totalEarnings, paymentAwaited, paymentOverdue }
}, [filteredInvoices])
```
- Computes topline numbers shown in the KPI cards. `paidish` means `Paid` or `Partially Paid`.

#### Chart data
```tsx
const chartData = useMemo(() => {
  const months = getMonthsForPeriod() // actually returns week buckets for 1M, month buckets otherwise
  const incomes = months.map((bucket) => {
    // Sum income (Paid + Partially Paid) within that week or month
  })
  return months.map((m, idx) => ({
    month: m.label,
    income: incomes[idx] / 1000, // shown as $xk
    growth: computeGrowth(incomes, idx),
    isHovered: hoveredBar === idx,
  }))
}, [filteredInvoices, selectedPeriod, hoveredBar, customStartDate, customEndDate])
```
- Transforms invoices into the shape Recharts needs.
- Uses previous bucket to compute a constrained MoM growth percentage.

#### Handlers
```tsx
const handleCreateInvoice = () => {
  if (newInvoice.clientName && newInvoice.amount && newInvoice.dueDate) {
    const invoice: Invoice = { /* parse and construct */ }
    setInvoices((prev) => [invoice, ...prev])
    setNewInvoice({ clientName: '', amount: '', dueDate: '', status: 'Draft' })
    setIsCreateModalOpen(false)
  }
}

const updateInvoiceStatus = (invoiceId: string, newStatus: InvoiceStatus) => {
  setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
}
```
- Adds new invoices to the top of the list.
- Updates a single invoice’s status from the dropdown menu.

#### JSX structure (high level)
- Root container sets a background image (`/public/background-gradient.jpg`) and hides scrollbars.
- Header:
  - Back icon (not wired to navigation in this demo)
  - Title `Dashboard`
  - `Avatar` with image or fallback
- Body (rounded white container on gray background):
  - Create New Invoice card with `Dialog` for the form
  - Time Period filter buttons (1M/3M/1Y/Custom) and, when `Custom`, two date inputs
  - KPI cards: Total Earnings, Awaited, Overdue
  - Income Trend `ComposedChart` with a bar (income) and line (growth)
  - "Your Invoices" list with animated rows and a badge to change status
  - Footer with `sparkonomy-logo.svg`

---

## Public Assets Used
- `public/abstract-profile.png` – displayed in `AvatarImage`
- `public/background-gradient.jpg` – page background
- `public/icons/*` – UI icons (back, crown, calendar trigger icon, plus button, logo)

All of these are referenced by `app/page.tsx` via `next/image` or `<img>`-like usage.

---

## Styling & Theming
- Tailwind + CSS variables control the entire color story.
- Light/dark tokens are defined in `app/globals.css` under `:root` and `.dark`.
- Components consume these via Tailwind class names, so the theme remains consistent without hardcoded colors scattered around.

---

## Testing Pointers (lightweight)
- Unit: pure helpers (e.g., extract `computeGrowth`, `formatDateRange`) into small functions for isolated tests.
- Component: the UI components are predictable wrappers; snapshot testing or simple interaction tests (open dialog, pick status) are sufficient.
- E2E: a single flow (create invoice → verify KPI and list update) covers the happy path.

---

## Notes & Conventions
- Prefer small, focused helpers over clever one-liners.
- Keep UI wrappers thin; style with Tailwind; merge classes with `cn`.
- Avoid inline logic inside JSX if it’s non-trivial—lift it into a function or `useMemo`.
- Data shown is mocked. Swap it with API calls by replacing `mockInvoices` and wiring mutations.

---

## What To Change First (if you continue development)
- Replace `mockInvoices` with data fetching (`fetch`/`server actions`/client hook).
- Move synthetic data generation behind a feature flag or remove for production.
- Add input validation to the create-invoice dialog (zod + react-hook-form).
- Add pagination/virtualization for invoice list if it grows large.

---

## License
MIT-like for the app glue. Respect licenses of third-party libraries included via `package.json`.
