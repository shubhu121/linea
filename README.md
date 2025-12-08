# Linea - Research Provenance Engine

A production-ready SaaS platform that traces the origin, evolution, and conceptual ancestry of scientific ideas through AI-powered provenance analysis.

## 🚀 Features

### Core Functionality
- **5-Agent AI Pipeline**: Concept refinement, phrase generation, strategic search, provenance analysis, and narrative synthesis
- **Interactive Timeline**: Explore how concepts evolved across eras from foundational origins to modern applications
- **Force-Directed Graph**: Visualize conceptual mutations as a living network of ideas
- **Research Paper Integration**: Powered by Veritus Search API for comprehensive academic paper retrieval

### SaaS Features
- ✅ **Authentication**: Complete auth system with Better-auth (email/password)
- ✅ **Subscription Plans**: 3-tier pricing (Explorer, Researcher, Institution)
- ✅ **Payment Processing**: Integrated with DodoPayments
- ✅ **Usage Tracking**: Monthly concept trace limits with real-time monitoring
- ✅ **User Dashboard**: Comprehensive account management and billing portal
- ✅ **Security**: Rate limiting, input sanitization, auth guards on all API routes

## 💰 Pricing Plans

| Plan | Price | Concept Traces | Features |
|------|-------|----------------|----------|
| **Explorer** (Free) | $0/month | 5 traces/month | Basic provenance analysis, timeline & graph views |
| **Researcher** (Pro) | $29/month | 50 traces/month | Priority AI processing, advanced analytics, multiple export formats |
| **Institution** (Enterprise) | $99/month | 500 traces/month | Full research suite, API access, team features, dedicated support |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Turso (SQLite), Drizzle ORM
- **Authentication**: Better-auth
- **Payments**: DodoPayments (Stripe integration)
- **AI**: Google Gemini API
- **Search**: Veritus Search API
- **Security**: Custom middleware with rate limiting, input sanitization

## 📁 Project Structure

```
linea/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── agents/       # AI agent endpoints
│   │   │   ├── auth/         # Authentication routes
│   │   │   ├── billing/      # Subscription & usage management
│   │   │   ├── dodo/         # Payment integration
│   │   │   ├── linea/        # Core concept tracing logic
│   │   │   └── veritus/      # Search API integration
│   │   ├── billing/          # Billing dashboard
│   │   ├── concept/          # Concept explorer & history
│   │   │   └── [slug]/       # Individual concept view
│   │   ├── login/            # Login page
│   │   ├── pricing/          # Pricing page
│   │   ├── register/         # Registration page
│   │   ├── settings/         # Account settings
│   │   └── page.tsx          # Homepage
│   ├── components/
│   │   ├── ui/               # Shadcn UI components
│   │   ├── PlanBadge.tsx     # Current plan indicator
│   │   ├── UsageIndicator.tsx # Real-time usage display
│   │   ├── UpgradePrompt.tsx  # Upgrade CTAs
│   │   ├── SearchBar.tsx      # Concept search input
│   │   ├── Timeline.tsx       # Interactive timeline
│   │   └── GraphExplorer.tsx  # Force-directed graph
│   ├── config/
│   │   └── plans.ts          # Plan definitions & limits
│   ├── db/
│   │   ├── schema.ts         # Database schema
│   │   └── seeds/            # Data seeders
│   ├── lib/
│   │   ├── agents.ts         # AI agent implementations
│   │   ├── auth.ts           # Auth configuration
│   │   ├── auth-client.ts    # Auth client hooks
│   │   ├── dodo.ts           # DodoPayments client
│   │   ├── security.ts       # Security utilities
│   │   └── veritus.ts        # Veritus API client
│   └── types/
│       └── dodo.ts           # Payment type definitions
├── .env                      # Environment variables
└── middleware.ts             # Auth middleware

```

## 🔐 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=                     # Turso database URL
DATABASE_AUTH_TOKEN=              # Turso auth token

# Authentication
BETTER_AUTH_SECRET=               # Better-auth secret
BETTER_AUTH_URL=http://localhost:3000

# AI & Search
GOOGLE_API_KEY=                   # Gemini API key
VERITUS_API_KEY=                  # Veritus Search API key
VERITUS_CALLBACK_URL=             # Webhook callback URL

# Payments
DODO_PAYMENTS_API_KEY=            # DodoPayments API key
DODO_PAYMENTS_ENVIRONMENT=test_mode  # or 'live_mode'
DODO_PAYMENTS_WEBHOOK_KEY=        # Webhook signature key
NEXT_PUBLIC_DODO_PRO_PRODUCT_ID=  # Pro plan product ID
NEXT_PUBLIC_DODO_ENTERPRISE_PRODUCT_ID= # Enterprise plan product ID

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Turso account (database)
- Google Gemini API key
- Veritus Search API key
- DodoPayments account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd linea
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Fill in your API keys and credentials
```

4. **Set up database**
```bash
bun run db:push    # Push schema to Turso
bun run db:seed    # (Optional) Seed with sample data
```

5. **Configure DodoPayments**
- Create products in your DodoPayments dashboard
- Add product IDs to `.env`
- Set up webhook endpoint: `https://yourdomain.com/api/dodo/webhooks`

6. **Run development server**
```bash
bun run dev
```

Visit `http://localhost:3000` to see the app.

## 🔄 User Flow

### New User Journey
1. **Landing Page** → User discovers Linea
2. **Sign Up** → Creates account (free Explorer plan)
3. **Trace Concept** → Enters first scientific concept
4. **View Results** → Explores timeline, graph, and narrative
5. **Hit Limit** → Reaches 5 traces/month limit
6. **Upgrade** → Subscribes to paid plan via DodoPayments
7. **Unlimited Access** → Continues tracing with higher limits

### Authenticated User
- **Dashboard**: View all traced concepts with status indicators
- **Billing**: Monitor usage, manage subscription, update payment methods
- **Settings**: Update profile, manage security, quick actions
- **Concept Explorer**: Deep dive into any completed concept trace

## 🔒 Security Features

### API Protection
- **Authentication**: Bearer token validation on all protected routes
- **Rate Limiting**: Prevents abuse (10 traces/minute per user)
- **Input Sanitization**: SQL injection and XSS protection
- **CORS Headers**: Secure cross-origin requests
- **Content Type Validation**: Ensures proper request formatting

### Usage Enforcement
- **Pre-flight Checks**: Validates quota before concept creation
- **Post-creation Tracking**: Increments usage counter
- **Monthly Resets**: Automatic limit refresh on 1st of each month
- **Graceful Degradation**: Clear error messages when limits exceeded

## 📊 Database Schema

### Core Tables
- **user**: User accounts (Better-auth)
- **session**: Active sessions (Better-auth)
- **concepts**: Traced concepts with status
- **veritus_jobs**: Search job tracking
- **papers**: Research papers from Veritus
- **lineage**: Provenance relationships
- **narratives**: Generated insights

### Subscription Tables
- **subscriptions**: User plans and billing status
- **usage_tracking**: Monthly concept trace usage
- **payment_events**: Webhook event log

## 🎨 Design System

- **Colors**: Blue → Purple → Pink gradient theme
- **Typography**: Geist Sans & Geist Mono fonts
- **Components**: Shadcn/UI with custom styling
- **Animations**: Smooth transitions, fade-ins, hover effects
- **Responsive**: Mobile-first design, adaptive layouts

## 🔌 API Endpoints

### Public Routes
- `POST /api/auth/[...all]` - Authentication endpoints

### Protected Routes
- `POST /api/linea/createBlueprint` - Create new concept trace
- `GET /api/linea/getUserConcepts` - Get user's concept history
- `GET /api/linea/getConcept/[slug]` - Get concept details
- `GET /api/billing/subscription` - Get subscription & usage
- `POST /api/billing/usage/check` - Check if user can trace
- `POST /api/billing/usage/track` - Increment usage counter
- `POST /api/dodo/checkout` - Create checkout session
- `POST /api/dodo/portal` - Open billing portal
- `POST /api/dodo/webhooks` - Handle payment webhooks

## 🎯 Key Components

### PlanBadge
Displays user's current plan with icon and color coding:
- Explorer (Free): Gray with Sparkles icon
- Researcher (Pro): Blue with Star icon
- Institution (Enterprise): Amber with Crown icon

### UsageIndicator
Real-time usage display showing:
- Traces used vs. limit
- Remaining traces
- Auto-upgrade CTA when usage > 80%

### UpgradePrompt
Contextual upgrade prompts in 3 variants:
- **Card**: Full-featured upgrade card
- **Banner**: Inline banner with CTA
- **Inline**: Compact alert-style prompt

## 📈 Monitoring & Analytics

- **Usage Tracking**: Monthly concept traces per user
- **Payment Events**: Complete webhook event log
- **Subscription Status**: Active, past_due, canceled tracking
- **Error Logging**: Console error tracking for debugging

## 🚀 Deployment

### Recommended: Vercel

1. **Deploy to Vercel**
```bash
vercel deploy
```

2. **Set environment variables** in Vercel dashboard

3. **Configure webhooks**
- Update `VERITUS_CALLBACK_URL` with production domain
- Update DodoPayments webhook endpoint

4. **Test payment flow** in test mode first

5. **Switch to live mode** when ready

## 🛟 Support & Documentation

- **Pricing**: `/pricing` - Compare plans and features
- **Billing**: `/billing` - Manage subscription and usage
- **Settings**: `/settings` - Account management
- **Concepts**: `/concept` - View traced concepts

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- **Gemini AI** - AI reasoning and analysis
- **Veritus Search** - Academic paper retrieval
- **Turso** - Edge database
- **DodoPayments** - Payment processing
- **Better-auth** - Authentication system
- **Shadcn/UI** - UI component library

---

Built with ❤️ for the research community