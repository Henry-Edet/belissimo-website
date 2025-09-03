## Hair Studio Booking Platform

A modern booking and payment platform for a hair studio in Turkey. Built with **Next.js 15**, **TypeScript**, **TailwindCSS**, **Material UI**, **Prisma**, and **Stripe/iyzico** for payments.

## Features

* 📅 Real-time service booking with owner-defined availability
* 💳 Secure deposits and payments (Stripe or iyzico)
* 👩‍🎨 Service catalog (wig installation, braiding, protective styles)
* 📸 Animated photo gallery of past works (Framer Motion)
* 🔔 Email notifications (confirmation, reminder, cancellation)
* 🛠️ Admin dashboard to manage bookings, clients, and payments
* 📱 Responsive & mobile-first design

## Tech Stack

* **Frontend**: [Next.js 15](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [TailwindCSS](https://tailwindcss.com/), [Material UI](https://mui.com/), [Framer Motion](https://www.framer.com/motion/)
* **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
* **Auth**: [Auth.js](https://authjs.dev/) (Google, Email)
* **Payments**: [Stripe](https://stripe.com/) or [iyzico](https://www.iyzico.com/en)
* **Notifications**: Email (optional SMS/WhatsApp integration)

## Getting Started

### 1. Clone repo & install deps

```bash
git clone https://github.com/yourusername/hair-studio-booking.git
cd hair-studio-booking
pnpm install
```

### 2. Environment setup

Create `.env` in project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hair_studio"
NEXTAUTH_SECRET="your_generated_secret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
IYZICO_API_KEY="sandbox-..."
IYZICO_SECRET="sandbox-..."
```

### 3. Database

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### 4. Run dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
 ├─ app/               # Next.js App Router
 │   ├─ layout.tsx     # Root layout
 │   ├─ providers.tsx  # Theme & Cache Providers
 │   └─ api/           # Serverless API routes (auth, booking, payment)
 ├─ components/        # Reusable UI components
 ├─ styles/            # Tailwind + global CSS
 ├─ prisma/            # Prisma schema & migrations
 └─ lib/               # Utility functions (auth, booking logic)
```

## Scripts

* `pnpm dev` – start dev server
* `pnpm build` – production build
* `pnpm start` – run production server
* `pnpm lint` – lint codebase
* `pnpm prisma studio` – open Prisma Studio

## Deployment

* **Frontend/Backend**: [Vercel](https://vercel.com/) (Next.js)
* **Database**: [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)
* **Secrets**: Store in Vercel Project Settings

## Roadmap

* [x] Service listing & booking
* [x] Deposits/payments
* [x] Photo gallery
* [ ] Testimonials & reviews
* [ ] Loyalty/discount system

## License

MIT

---

Built with ❤️ for a modern salon experience.
