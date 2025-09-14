# Hair Studio Booking App

A modern booking and payment platform for a hair studio in Turkey. Built with Next.js 15, TypeScript, TailwindCSS, Material UI, Prisma, and Stripe/iyzico.

Features

📅 Real-time service booking with owner-defined availability

💳 Secure deposits & payments (Stripe or iyzico)

👩‍🎨 Service catalog (wig installations, braiding, protective styles)

📸 Animated photo gallery (Framer Motion)

🔔 Email reminders & confirmations

🛠️ Admin dashboard for managing bookings, clients, and payments

📱 Mobile-first, responsive UI

#  Tech Stack

  Framework: Next.js 15 (App Router) + TypeScript
  
  UI: TailwindCSS + Material UI + Framer Motion
  
  Database: PostgreSQL (via Prisma ORM)
  
  Auth: Auth.js (NextAuth v5, Google/Email)
  
  Payments: Stripe or iyzico (Turkey)
  
  Notifications: Email (Resend / SendGrid / SMTP)
  
  Deployment: Vercel (app) + Neon/Supabase (DB)

##  Getting Started
1. Clone and install
   
        git clone https://github.com/yourusername/hair-studio-booking.git
        cd hair-studio-booking
        pnpm install

3. Configure environment

Create .env file:

    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hair_studio"
    NEXTAUTH_SECRET="your_secret"
    NEXTAUTH_URL="http://localhost:3000"
    
    # Stripe
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    
    # iyzico (optional)
    IYZICO_API_KEY="sandbox-..."
    IYZICO_SECRET="sandbox-..."

3. Setup database

       pnpm prisma migrate dev --name init
       pnpm prisma db seed

4. Run dev server

       pnpm dev

5.  Project Structure

           src/
         ├─ app/            # Next.js App Router routes
         ├─ components/     # UI components
         ├─ lib/            # Utilities (auth, booking, payments)
         ├─ prisma/         # Prisma schema & migrations
         └─ styles/         # Tailwind + global CSS


##Scripts

    pnpm dev → start dev server
    
    pnpm build → production build
    
    pnpm start → run production build
    
    pnpm prisma studio → inspect database

##Roadmap

     Core booking flow (services, availability, payments)
    
     Admin dashboard
    
     Framer Motion gallery
    
     Reviews & testimonials
    
     Loyalty/discount system

License

MIT License


