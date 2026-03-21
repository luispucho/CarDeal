# CLAUDE.md — AI Assistant Instructions for CarDeal

## Project Overview

CarDeal is a car consignment platform where users submit vehicles for sale and admins review, make offers, and manage consignments. It uses a .NET 9 API backend with a React/TypeScript frontend.

## Architecture

- **Backend**: ASP.NET Core 9.0 REST API (`src/CarDeal.Api/`)
- **Frontend**: React 19 + TypeScript + Vite (`src/CarDeal.Client/`)
- **Database**: SQL Server (LocalDB for dev) via Entity Framework Core 9
- **Auth**: JWT tokens with ASP.NET Identity (roles: Admin, User)
- **Storage**: Azure Blob Storage for car images (Azurite for local dev)
- **i18n**: i18next (English + Spanish), admin-controlled site language
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
src/
├── CarDeal.Api/
│   ├── Controllers/       # HTTP endpoints (Auth, Cars, Admin, Messages, Settings)
│   ├── Models/            # Domain entities (Car, User, CarImage, Offer, Consignment, Message)
│   ├── DTOs/              # Request/response records (AuthDtos, CarDtos, OfferDtos, etc.)
│   ├── Services/          # Business logic interfaces + implementations
│   ├── Data/              # AppDbContext (EF Core)
│   ├── Middleware/        # HTTP middleware
│   ├── Migrations/        # EF Core migrations
│   └── Program.cs         # Startup, DI, seeding, middleware pipeline
│
├── CarDeal.Client/
│   └── src/
│       ├── pages/         # Route components (HomePage, MyCarsPage, admin/*)
│       ├── components/    # Reusable UI (Layout, ProtectedRoute)
│       ├── api/           # Axios service layer (auth, cars, admin, messages, settings)
│       ├── context/       # AuthContext (React Context)
│       ├── types/         # TypeScript interfaces
│       ├── i18n/          # Translation files (en.json, es.json)
│       ├── App.tsx        # Router configuration
│       └── main.tsx       # React DOM root
```

## API Endpoints

### Public
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh JWT
- `GET /api/settings/language` — Get site language

### Authenticated (User)
- `GET|POST /api/cars` — List/create user's cars
- `GET|PUT|DELETE /api/cars/{id}` — Read/update/delete car
- `POST /api/cars/{id}/images` — Upload image (max 5MB, max 10 per car)
- `DELETE /api/cars/{id}/images/{imageId}` — Remove image
- `GET /api/messages` — Inbox threads
- `GET /api/messages/thread?otherUserId=...&carId=...` — Message thread
- `POST /api/messages` — Send message
- `PUT /api/messages/{id}/read` — Mark read
- `GET /api/messages/unread-count` — Unread count

### Admin Only
- `GET /api/admin/dashboard` — Stats
- `GET /api/admin/cars` — All cars (optional `?status=` filter)
- `GET /api/admin/cars/{id}` — Car detail
- `POST /api/admin/cars/{carId}/offer` — Make offer
- `PUT /api/admin/offers/{id}` — Update offer
- `POST /api/admin/cars/{carId}/consign` — Create consignment
- `PUT /api/admin/consignments/{id}` — Update consignment
- `GET /api/admin/consignments` — List consignments
- `PUT /api/settings/language` — Change site language

## Coding Conventions

### C# (Backend)
- **DTOs**: Use `record` types (e.g., `record CreateCarRequest(string Make, string Model, ...)`)
- **Services**: Interface + implementation pattern (`ICarService` / `CarService`)
- **Async**: All data operations use `async/await` with `Task<T>`
- **DI**: Constructor injection via ASP.NET Core built-in container
- **Naming**: PascalCase for classes, methods, properties; camelCase for parameters

### TypeScript (Frontend)
- **Components**: Functional components with hooks
- **API calls**: Centralized in `src/api/` using Axios
- **State**: React Context for auth, TanStack React Query for server state
- **Forms**: React Hook Form + Zod validation schemas
- **Translations**: Use `useTranslation()` hook, keys in `en.json`/`es.json`
- **Styling**: Tailwind CSS utility classes, mobile-first responsive

### General Rules
- All new UI text must include translation keys in both `en.json` and `es.json`
- Keep API endpoints RESTful; use proper HTTP verbs and status codes
- Car images go through Azure Blob Storage (never store in DB or filesystem)
- All DB operations go through EF Core — no raw SQL unless absolutely necessary
- Do not hardcode secrets; use `appsettings.json` / environment variables

## Domain Model

- **Car**: Make, Model, Year, Mileage, VIN, Color, Condition, Description, AskingPrice, Status
- **CarStatus**: `Pending → Reviewed → Offered → Consigned → Sold` (or `Rejected`)
- **CarImage**: BlobUrl, FileName, IsPrimary (belongs to Car)
- **Offer**: Amount, Notes, Status (belongs to Car, created by Admin)
- **Consignment**: AgreedPrice, CommissionPercent, StartDate, EndDate, Status (belongs to Car)
- **Message**: Content, IsRead, SentAt (between Users, optionally linked to Car)
- **User**: extends IdentityUser with FullName, Phone, CreatedAt

## User Roles

| Role  | Can do                                                                  |
| ----- | ----------------------------------------------------------------------- |
| Public | View homepage, login/register                                          |
| User  | Submit cars, upload images, view own cars/offers, send/receive messages |
| Admin | Review all cars, make offers, create consignments, change site language |

## Testing

No test projects exist yet. When adding tests:
- Backend: Use xUnit with EF Core InMemory provider
- Frontend: Use Vitest + React Testing Library

## Configuration Files

- `src/CarDeal.Api/appsettings.json` — DB connection, JWT settings, Azure Blob, admin seed
- `src/CarDeal.Client/vite.config.ts` — Dev server proxy, build settings
- `src/CarDeal.Client/tsconfig.json` — TypeScript config
- `.github/workflows/api.yml` — API CI/CD pipeline
- `.github/workflows/client.yml` — Client CI/CD pipeline
