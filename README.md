# InVolution

**InVolution** is an AI-powered investment platform designed to bridge the gap between visionary startups and strategic investors. Built around trust and data, it streamlines the deal-flow process with automated KYC, AI-driven due diligence, and verifiable financial metrics within a secure, encrypted ecosystem.

## 🚀 Key Features

- **Automated KYC & Verification**: Robust verification for both startups and investors via Aadhaar and PAN validation to ensure a trusted network.
- **AI Due Diligence**: Integrated Google Gemini AI that analyzes 42+ startup signals (market opportunity, competitive moat, business model) to generate an Investability Score, Trust Tier, and comprehensive automated reports.
- **Startup Health Monitor**: Real-time tracking of critical startup vitals, including burn rate, runway, revenue, churn, and gross margins.
- **Encrypted Deal Room**: A 5-phase investment lifecycle environment featuring PII masking, integrated meeting scheduling, and deal negotiation tools.
- **Incubation & Applications**: Dedicated flows for startups to apply for incubation and get discovered by top-tier incubators.
- **In-Platform Communication**: Real-time shared chats and notifications connecting founders and investors directly.

## 🛠 Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TailwindCSS 4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) (Animations)
- [Recharts](https://recharts.org/) (Data Visualization)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend & API:**
- Next.js Route Handlers (Serverless APIs)
- [Supabase](https://supabase.com/) (PostgreSQL Database, Auth, Storage)
- [Google GenAI](https://ai.google.dev/) (Gemini AI integration)
- [NextAuth](https://next-auth.js.org/) (Authentication)
- [Zod](https://zod.dev/) (Schema Validation)

## 📁 Project Structure

```text
InVolution/
├── src/
│   ├── app/                # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/            # Backend API Route Handlers (admin, ai, auth, deals, kyc, etc.)
│   │   └── ...             # Public pages (about, startups, investors, etc.)
│   ├── backend/            # Backend business logic and core services
│   ├── components/         # Shared generic React components
│   ├── frontend/           # Frontend-specific components and hooks (e.g., chat, AIChat)
│   ├── lib/                # Utility libraries (e.g., Gemini report helpers, validations)
│   └── utils/              # General helper functions and Supabase clients
├── supabase/
│   ├── migrations/         # PostgreSQL schema migrations (roles, tables, RLS)
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
└── package.json            # Project dependencies and scripts
```

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/involution.git
   cd involution
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install, pnpm install, bun install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and configure the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_google_gemini_api_key
   NEXTAUTH_SECRET=your_nextauth_secret
   # Add any other required keys (e.g. NextAuth URL)
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🗄 Database Setup (Supabase)

The project uses Supabase as its primary database. The database schema is managed via migrations located in the `supabase/migrations/` directory.

To apply migrations locally using the Supabase CLI:
```bash
supabase start
supabase db push
```

## 📜 License

This project is proprietary. All rights reserved.
