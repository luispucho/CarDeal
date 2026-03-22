# CLAUDE.md — AI Assistant Instructions for CarDeal

## Project Overview

CarDeal is a multi-tenant car dealership platform with an integrated CRM. Dealers manage inventory with cost tracking, publish to external marketplaces, and handle consignments. Individual sellers submit cars through a transparent process. Built with .NET 10 API + React 19 frontend.

## Architecture

- **Backend**: ASP.NET Core 10 REST API (`src/CarDeal.Api/`)
- **Frontend**: React 19 + TypeScript + Vite (`src/CarDeal.Client/`)
- **Database**: SQL Server (LocalDB for dev) via Entity Framework Core 10
- **Auth**: JWT tokens + Google/GitHub OAuth with ASP.NET Identity
- **Roles**: SuperAdmin, Admin, TenantAdmin, User (role-based access + tier-based feature gating)
- **Multi-tenancy**: Tenant model with tiers (Basic/Pro/Enterprise), branding, and scoped access
- **CRM**: Integrated inventory cost tracking, expense management, communication notes, statistics
- **External Publishing**: Pluggable connector pattern for Facebook, Craigslist, Cars.com, AutoTrader, CarGurus, OfferUp
- **Storage**: Azure Blob Storage for images (LocalBlobStorageService fallback for dev)
- **i18n**: i18next (English + Spanish), per-tenant language setting
- **CI/CD**: GitHub Actions → Azure App Service (API) + Azure Static Web Apps (Client)

## How to Build & Run

### API

```bash
cd src/CarDeal.Api
dotnet restore
dotnet build
dotnet run          # http://localhost:5228 — migrations run automatically on startup
```

### Client

```bash
cd src/CarDeal.Client
npm install
npm run dev         # http://localhost:5173 — proxies API calls to localhost:5228
```

### Prerequisites

- .NET 10.0 SDK (project retargeted from net9.0)
- Node.js 22+ with npm
- SQL Server LocalDB
- [GitHub CLI (`gh`)](https://cli.github.com/) — for repository management and CI/CD operations
- [Azure CLI (`az`)](https://learn.microsoft.com/cli/azure/install-azure-cli) — for managing Azure deployments (publish profiles, app settings)
- Azurite (Azure Storage Emulator) — **optional** for local dev (see Image Storage below)

### Image Storage

- **Production**: Azure Blob Storage
- **Local dev**: When `Azure:BlobStorage:ConnectionString` is `UseDevelopmentStorage=true` and Azurite is not running, the API automatically falls back to `LocalBlobStorageService`, which stores images under `wwwroot/uploads/car-images/`. No setup needed.
- **With Azurite**: Install and run Azurite (`npm install -g azurite && azurite`) for full Azure Blob emulation on port 10000.

### Test Credentials

- **Admin**: `admin@cardeal.com` / `Admin123!` (seeded on startup)

### Seeding Sample Cars via API

After starting the API, you can create sample cars with PowerShell:

```powershell
# Register or login a user
$body = '{"email":"john.doe@email.com","password":"TestUser1","fullName":"John Doe"}'
$resp = Invoke-RestMethod -Uri "http://localhost:5228/api/auth/register" -Method POST -Body $body -ContentType "application/json"
$headers = @{ Authorization = "Bearer $($resp.token)" }

# Create a car
$car = '{"make":"Toyota","model":"Camry","year":2023,"mileage":18500,"color":"White","condition":"Excellent","description":"One owner, full service history.","askingPrice":28500}'
Invoke-RestMethod -Uri "http://localhost:5228/api/cars" -Method POST -Body $car -ContentType "application/json" -Headers $headers
```

## Key Commands

| Task                | Command                                         |
| ------------------- | ----------------------------------------------- |
| API build           | `cd src/CarDeal.Api && dotnet build`             |
| API run             | `cd src/CarDeal.Api && dotnet run`               |
| API watch           | `cd src/CarDeal.Api && dotnet watch run`          |
| Client install      | `cd src/CarDeal.Client && npm install`           |
| Client dev          | `cd src/CarDeal.Client && npm run dev`           |
| Client build        | `cd src/CarDeal.Client && npm run build`         |
| Client lint         | `cd src/CarDeal.Client && npm run lint`          |
| Client typecheck    | `cd src/CarDeal.Client && npx tsc --noEmit`     |
| EF migration add    | `cd src/CarDeal.Api && dotnet ef migrations add <Name>` |
| EF migration apply  | Automatic on startup (`db.Database.MigrateAsync()`)     |
| OpenAPI docs        | `http://localhost:5228/openapi/v1.json`           |

## Project Structure

```
CarDeal.sln
nuget.config
src/
├── CarDeal.Api/
│   ├── Controllers/       # HTTP endpoints
│   │   ├── AuthController       # Login, register, social OAuth, external callbacks
│   │   ├── CarsController       # User car CRUD + image upload
│   │   ├── AdminController      # Car review, offers, consignments, featured toggle
│   │   ├── PublicController     # Public inventory, featured cars, branding (no auth)
│   │   ├── ProfileController    # User profile, picture, account deletion
│   │   ├── TenantController     # SuperAdmin: CRUD tenants, assign users, set tier
│   │   ├── CrmController       # CRM: inventory financials, expenses, notes, employees,
│   │   │                        #   stats, branding, connections, publishing
│   │   ├── MessagesController   # In-app messaging
│   │   └── SettingsController   # Site language
│   ├── Models/            # Domain entities
│   │   ├── Car, CarImage, CarFinancials, CarPublication
│   │   ├── User (extends IdentityUser)
│   │   ├── Tenant, TenantBranding
│   │   ├── Offer, Consignment, Message
│   │   ├── Expense, CrmNote
│   │   ├── ExternalPlatform, PlatformConnection
│   │   └── Enums: CarStatus, ListingType, TenantTier, ExpenseType, PublicationStatus
│   ├── DTOs/              # Request/response records
│   ├── Services/          # Business logic (CarService, OfferService, MessageService,
│   │                      #   BlobStorageService, PublishingService, IPublishingConnector)
│   ├── Middleware/         # ExceptionMiddleware, RequireTierAttribute
│   ├── Data/              # AppDbContext (EF Core)
│   └── Migrations/        # EF Core migrations
│
├── CarDeal.Client/
│   └── src/
│       ├── pages/         # Route components
│       │   ├── HomePage, InventoryPage, ComparePage, PublicCarDetailPage
│       │   ├── LoginPage, RegisterPage, ProfilePage, NotFoundPage
│       │   ├── MyCarsPage, SubmitCarPage, CarDetailPage, InboxPage
│       │   ├── admin/ (DashboardPage, CarReviewPage, MakeOfferPage, ConsignmentsPage, TenantsPage)
│       │   └── crm/ (CrmDashboardPage, CrmInventoryPage, CrmCarDetailPage,
│       │             CrmEmployeesPage, CrmBrandingPage, CrmConnectionsPage)
│       ├── components/    # Reusable UI (Layout, ProtectedRoute, ListingRibbon, TierGate)
│       ├── api/           # Axios service layer (auth, cars, admin, messages, settings,
│       │                  #   profile, public, crm, tenant)
│       ├── context/       # AuthContext (React Context)
│       ├── types/         # TypeScript interfaces
│       ├── i18n/          # Translation files (en.json, es.json — 250+ keys each)
│       ├── App.tsx        # Router configuration
│       └── main.tsx       # React DOM root
```

## API Endpoints

### Public (no auth)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login (redirects to /crm for admin/tenant users)
- `POST /api/auth/refresh` — Refresh JWT
- `GET /api/auth/external/{provider}` — Social login (Google/GitHub)
- `GET /api/public/cars` — Browse inventory (filters: make, year, price, listingType, sort)
- `GET /api/public/cars/featured` — Featured cars for homepage
- `GET /api/public/cars/{id}` — Car detail
- `GET /api/public/branding/{tenantSlug}` — Tenant branding (colors, logo, language)
- `GET /api/public/tenants` — Tenant directory
- `GET /api/settings/language` — Site language

### Authenticated (User)
- `GET|POST /api/cars` — List/create user's cars
- `GET|PUT|DELETE /api/cars/{id}` — Read/update/delete car
- `POST /api/cars/{id}/images` — Upload image (max 5MB, max 10 per car)
- `DELETE /api/cars/{id}/images/{imageId}` — Remove image
- `GET|PUT|DELETE /api/profile` — Profile management + account deletion
- `POST /api/profile/picture` — Upload profile picture
- `GET|POST /api/messages` — Messaging

### Admin
- `GET /api/admin/dashboard` — Stats
- `GET /api/admin/cars` — All cars (optional status filter)
- `POST /api/admin/cars/{carId}/offer` — Make offer
- `PUT /api/admin/cars/{carId}/featured` — Toggle featured
- Consignment management endpoints

### SuperAdmin
- `GET|POST|PUT|DELETE /api/tenant` — CRUD tenants
- `POST|DELETE /api/tenant/{id}/users` — Assign/remove users
- `PUT /api/tenant/{id}/tier` — Set tenant tier
- `GET /api/crm/admin/stats` — Platform-wide statistics
- `POST /api/crm/admin/tenants/{id}/reset-admin` — Reset tenant admin

### CRM (Tenant-scoped)
- `GET /api/crm/inventory` — Inventory with financials
- `PUT /api/crm/inventory/{id}/financials` — Update purchase/sale prices
- `GET|POST|DELETE /api/crm/inventory/{id}/expenses` — Expense management
- `GET|POST /api/crm/inventory/{id}/notes` — Communication notes
- `GET|POST|DELETE /api/crm/employees` — Employee management
- `GET /api/crm/stats` — Tenant statistics
- `GET|PUT /api/crm/branding` — Tenant branding (colors, logo, language, layout)
- `GET|POST|PUT|DELETE /api/crm/connections` — Platform connections
- `POST /api/crm/inventory/{carId}/publish` — Publish to external platform
- `POST /api/crm/publications/{id}/unpublish` — Unpublish

## Domain Model

### Core
- **Car**: Make, Model, Year, Mileage, VIN, Color, Condition, Description, AskingPrice, Status, ListingType, IsFeatured, TenantId
- **CarStatus**: `Pending → Reviewed → Offered → Consigned → Sold` (or `Rejected`, `Withdrawn`)
- **ListingType**: Consigned, Inventory, CertifiedInventory, TrustedPartner
- **CarImage**: BlobUrl, FileName, IsPrimary

### Multi-tenancy
- **Tenant**: Name, Slug, LogoUrl, ContactEmail, Tier (Basic/Pro/Enterprise)
- **TenantBranding**: Colors (primary, secondary, accent, text, bg), Logo, DealerName, Tagline, Language, LandingLayoutJson, CustomDomain
- **User**: extends IdentityUser with FullName, Phone, ProfilePictureUrl, TenantId, CreatedAt

### CRM
- **CarFinancials**: PurchasePrice, SalePrice (1:1 with Car)
- **Expense**: Type (Repair/Marketing/Transport/Inspection/Other), Amount, Description, Date
- **CrmNote**: Content, AuthorUserId, CreatedAt

### Publishing
- **ExternalPlatform**: Name, Slug (facebook, craigslist, carscom, autotrader, cargurus, offerup)
- **PlatformConnection**: TenantId, PlatformId, ApiKey, ApiSecret, AccessToken, AccountId, IsEnabled
- **CarPublication**: CarId, ConnectionId, Status, ExternalListingId, ExternalUrl

### Other
- **Offer**: Amount, Notes, Status (belongs to Car)
- **Consignment**: AgreedPrice, CommissionPercent, StartDate, EndDate, Status
- **Message**: Content, IsRead, SentAt (between Users)

## User Roles & Tiers

### Roles
| Role | Access |
|------|--------|
| Public | Homepage, inventory browse, car detail, register |
| User | Submit cars, manage listings, profile, messaging |
| Admin | Review cars, make offers, consignments, featured toggle |
| TenantAdmin | All Admin + employee management, CRM, branding |
| SuperAdmin | All TenantAdmin + tenant CRUD, tier management, platform stats |

### Tiers (feature gating via `[RequireTier]` attribute)
| Feature | Basic | Pro | Enterprise |
|---------|:-----:|:---:|:----------:|
| Brand colors + logo + language | ✅ | ✅ | ✅ |
| CRM inventory + expenses + notes | ✅ | ✅ | ✅ |
| Employee management | ✅ | ✅ | ✅ |
| External publishing | ❌ | ✅ | ✅ |
| Advanced statistics | ❌ | ✅ | ✅ |
| Landing page layout editor | ❌ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ✅ |
