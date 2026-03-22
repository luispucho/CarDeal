# CarDeal 🚗

A multi-tenant car dealership platform with an integrated CRM. Car dealers manage inventory, track costs, and sell vehicles while individual sellers consign their cars through a transparent process.

## What It Does

CarDeal is a full-featured marketplace connecting car dealers, sellers, and buyers:

1. **Buyers** browse the public inventory, filter by make/year/price, and view detailed listings
2. **Sellers** register and submit vehicles for consignment with photos and asking prices
3. **Dealers** (tenants) manage their inventory, track purchase/sale costs, and handle consignments
4. **Admins** review submissions, make offers, negotiate terms, and manage employees
5. **Super Admins** oversee the entire platform — create tenants, view analytics, manage dealers

## Live Demo

| Service | URL |
|---------|-----|
| **Client** | https://orange-beach-07fca1b0f.4.azurestaticapps.net |
| **API** | https://cardeal-api.azurewebsites.net/api |
| **API Docs** | https://cardeal-api.azurewebsites.net/scalar/v1 |

## Tech Stack

### Backend
- **ASP.NET Core 10** — RESTful API with controllers
- **Entity Framework Core 10** — SQL Server ORM with code-first migrations
- **ASP.NET Identity + JWT** — Authentication and role-based authorization
- **Google + GitHub OAuth** — Social login support
- **Azure Blob Storage** — Car/profile image hosting (with local file fallback for dev)

### Frontend
- **React 19** with **TypeScript** — Component-based UI
- **Vite** — Fast dev server and build tool
- **Tailwind CSS** — Utility-first responsive styling
- **TanStack React Query** — Server state management
- **React Hook Form + Zod** — Form handling with schema validation
- **React Router v7** — Client-side routing
- **i18next** — Multi-language support (English & Spanish)

### Infrastructure
- **GitHub Actions** — CI/CD pipelines for API and Client
- **Azure App Service** — API hosting (.NET 10)
- **Azure Static Web Apps** — Client hosting
- **SQL Server** — Production database (LocalDB for development)

## Getting Started

### Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/) with npm
- SQL Server LocalDB (included with Visual Studio)

### Run Locally

```bash
# Clone the repo
git clone https://github.com/luispucho/CarDeal.git
cd CarDeal

# Start the API (auto-applies migrations and seeds roles + super admin)
cd src/CarDeal.Api
dotnet restore
dotnet run
# API running at http://localhost:5228

# In a new terminal — start the client
cd src/CarDeal.Client
npm install
npm run dev
# Client running at http://localhost:5173
```

### Default Credentials

Register a new account through the UI to use the app as a regular seller.

### Demo Tenants & Accounts

| Tenant | Tier | Admin Email | Password | Employees |
|--------|------|-------------|----------|-----------|
| **Sunshine Motors** | Basic | sarah@sunshinemotors.com | Sunshine1 | mike@sunshinemotors.com, lisa@sunshinemotors.com |
| **Elite Auto Group** | Pro | james@eliteauto.com | EliteAuto1 | emma@eliteauto.com, carlos@eliteauto.com |
| **Pacific Car Exchange** | Enterprise | diana@pacificcars.com | Pacific2026 | ryan@pacificcars.com, sophia@pacificcars.com |

Employee passwords are the same as their tenant admin. Each tenant has 10 pre-loaded inventory cars.

### Seeded Roles

| Role | Description |
|------|-------------|
| **SuperAdmin** | Platform-wide management — tenants, analytics, user management |
| **Admin** | Car review, offers, consignment management |
| **TenantAdmin** | Dealership management — employees, CRM, inventory costs |
| **User** | Submit cars for consignment, manage own listings |

## Features

### 🏠 SaaS Platform
- 🌐 **SaaS Landing Page** (`/0`) — Sells the platform to dealers with features, pricing tiers, demo dealers
- 🏪 **Tenant-Specific Sites** (`/{dealer-slug}`) — Each dealer gets their own branded landing page
- 🍪 **Cookie-Based Context** — Browsing a dealer stores context for seamless navigation

### 🏪 Public Marketplace
- 🔍 **Car Inventory** — Sidebar filters (make, year, price, listing type, sort), collapsible sections
- 🔄 **Car Comparison** — Select up to 4 cars to compare side-by-side with difference highlighting
- 🏷️ **Listing Ribbons** — Color-coded: Consigned (gray), Inventory (blue), Certified (gold), Trusted Partner (silver)
- ⭐ **Featured Cars** — Admin-promoted vehicles on tenant landing pages
- 🚗 **Car Detail Pages** — Image carousel with lightbox, keyboard navigation, thumbnails
- 📋 **VIN Decode** — NHTSA API integration for automatic vehicle identification
- 💬 **"I'm Interested" Contact Form** — Public car inquiry without registration
- 🚙 **Consignment Inquiry** — "Sell My Car" multi-step form with VIN lookup

### 🏢 Multi-Tenancy
- 🏪 **Dealer System** — Multiple car dealers on one platform with URL-based routing
- 👥 **Employee Management** — Dealer admins add/remove employees
- 🔒 **Scoped Access** — Dealers see only their own tenant's data
- 🤝 **Shared Inventory** — Cars visible across dealers as "Trusted Partner"
- 🚫 **Hide External Cars** — Pro+ dealers can hide specific cars from their view
- 📊 **Hidden Cars Filter** — Employees can review and unhide cars
- 🔐 **Consignment Privacy** — Consigned cars stay private to their dealer
- ⏸ **Dealer Activate/Deactivate** — Soft delete (pause) or hard delete dealers

### 📊 CRM (Customer Relationship Management)
- 📊 **Dashboard** — Platform stats (SuperAdmin) or dealership stats (revenue, profit, monthly sales)
- 💰 **Cost Tracking** — Track purchase price, sale price, and profit per car
- 🧾 **Expense Management** — Log repairs, marketing, transport, inspection costs per vehicle
- 📝 **Communication Notes** — Internal notes timeline per car with author tracking
- 👥 **Employee Management** — DealerAdmin adds/removes employees
- 💰 **Investor Tracking** — Manage investors, contributions, car funding sources (Pro+)
- 📡 **External Publishing** — Publish to Facebook, Craigslist, Cars.com, AutoTrader, CarGurus, OfferUp
- 🎨 **Branding** — Customize colors, logo, dealer name, tagline, site language per tenant
- 🧩 **Landing Page Editor** — Drag-and-drop section reordering (Pro tier)
- 📩 **Car Inquiries** — View and manage public interest submissions

### 💎 Tenant Tiers
- 🥉 **Basic (Free)** — Brand colors, logo, CRM, expenses, employees
- 🥈 **Pro ($)** — + Publishing, investors, advanced stats, layout editor, hide external cars
- 🥇 **Enterprise ($$)** — + Custom domain, priority support

### 🔐 Auth & Security
- 🔑 **JWT Authentication** — Secure token-based auth with refresh tokens
- 👮 **Role-Based Access** — SuperAdmin, Admin, TenantAdmin, User
- 💎 **Tier-Based Feature Gating** — `[RequireTier]` attribute + `<TierGate>` component (🚗🔧 missing tire page)
- 🌐 **Multi-Language** — Full English and Spanish support, per-tenant language setting

### 🎨 UX
- 📱 **Responsive Design** — Desktop, tablet, and mobile
- 🚧 **Fun 404 Page** — Car crash animation with 5-second auto-redirect
- 🖼️ **Image Carousel** — Fullscreen lightbox with arrows, keyboard nav, thumbnails
- 🏷️ **Tenant-Aware Nav** — Shows dealer name/logo, context-appropriate links
- 🖼️ **Image Carousel** — Fullscreen lightbox with arrows, keyboard nav, thumbnails

## Project Structure

```
CarDeal/
├── src/
│   ├── CarDeal.Api/              # .NET 10 backend
│   │   ├── Controllers/          # API endpoints
│   │   │   ├── AuthController    # Login, register, social auth
│   │   │   ├── CarsController    # User car CRUD
│   │   │   ├── AdminController   # Admin car review, offers
│   │   │   ├── PublicController  # Public inventory (no auth)
│   │   │   ├── ProfileController # User profile + account deletion
│   │   │   ├── TenantController  # SuperAdmin tenant management
│   │   │   ├── CrmController     # CRM inventory, expenses, stats
│   │   │   └── ...
│   │   ├── Models/               # Domain entities
│   │   ├── DTOs/                 # Request/response objects
│   │   ├── Services/             # Business logic
│   │   ├── Data/                 # EF Core context
│   │   └── Migrations/           # Database migrations
│   │
│   └── CarDeal.Client/           # React 19 frontend
│       └── src/
│           ├── pages/            # Route components
│           │   ├── crm/          # CRM pages (dashboard, inventory, employees)
│           │   ├── admin/        # Admin pages (dashboard, review, offers)
│           │   └── ...           # Public + user pages
│           ├── components/       # Reusable UI (Layout, ListingRibbon, etc.)
│           ├── api/              # API service layer
│           ├── context/          # Auth state (AuthContext)
│           ├── types/            # TypeScript interfaces
│           └── i18n/             # Translations (en + es)
│
├── .github/workflows/            # CI/CD pipelines
├── CLAUDE.md                     # AI assistant instructions
├── nuget.config                  # NuGet package source
└── CarDeal.sln                   # Solution file
```

## License

This project is for demonstration and educational purposes.
