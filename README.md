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

### 🏪 Public Marketplace
- 🔍 **Car Inventory** — Public browsable catalog with filters (make, year, price, listing type, sort)
- 🏷️ **Listing Ribbons** — Color-coded badges: Consigned (gray), Inventory (blue), Certified (gold), Trusted Partner (silver)
- ⭐ **Featured Cars** — Admin-promoted vehicles showcased on the homepage
- 🚗 **Car Detail Pages** — Full image carousel with lightbox, keyboard navigation, and thumbnails

### 👤 User Features
- 🚘 **Car Submission** — Add vehicles with make, model, year, mileage, condition, VIN, photos, and asking price
- ✏️ **Edit Listings** — Inline editing for pending cars
- 📷 **Image Management** — Upload up to 10 photos (5MB each), styled upload buttons, delete with confirmation
- 👤 **Profile Management** — Edit name, phone, upload profile picture
- 🗑️ **Account Deletion** — Delete account with double confirmation (active cars marked as Withdrawn)
- 💬 **Messaging** — In-app communication between sellers and admins

### 🏢 Multi-Tenancy
- 🏪 **Tenant System** — Multiple car dealers/organizations on one platform
- 👥 **Employee Management** — Tenant admins add/remove dealership employees
- 🔒 **Scoped Access** — Dealers only see their own tenant's data
- 🤝 **Shared Inventory** — Inventory cars visible across tenants as "Trusted Partner"
- 🔐 **Consignment Privacy** — Consigned cars stay private to their tenant

### 📊 CRM (Customer Relationship Management)
- 📊 **Dashboard** — Platform stats (SuperAdmin) or dealership stats (revenue, profit, monthly sales)
- 💰 **Cost Tracking** — Track purchase price, sale price, and profit per car
- 🧾 **Expense Management** — Log repairs, marketing, transport, inspection costs per vehicle
- 📝 **Communication Notes** — Internal notes timeline per car with author tracking
- 👥 **Employee Management** — TenantAdmin adds/removes dealership employees

### 🔐 Auth & Security
- 🔑 **JWT Authentication** — Secure token-based auth with refresh tokens
- 🌐 **Social Login** — Google and GitHub OAuth
- 👮 **Role-Based Access** — SuperAdmin, Admin, TenantAdmin, User
- 🌐 **Multi-Language** — Full English and Spanish support, admin-controlled

### 🎨 UX
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🚧 **Fun 404 Page** — Car crash animation with 5-second auto-redirect
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
