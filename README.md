# CarDeal 🚗

A modern car consignment platform where users can submit their vehicles for sale, receive offers, and manage the consignment process — all through a clean, responsive web interface.

## What It Does

CarDeal connects car owners with a consignment service:

1. **Sellers** register and submit their vehicles with photos, descriptions, and asking prices
2. **Admins** review submissions, make offers, and negotiate terms
3. Once agreed, cars are **consigned** for sale with transparent pricing and commission tracking
4. Built-in **messaging** keeps sellers and admins in sync throughout the process

## Live Demo

| Service | URL |
|---------|-----|
| **Client** | https://orange-beach-07fca1b0f.4.azurestaticapps.net |
| **API** | https://cardeal-api.azurewebsites.net/api |
| **API Docs** | https://cardeal-api.azurewebsites.net/scalar/v1 |

## Screenshots

> *Coming soon*

## Tech Stack

### Backend
- **ASP.NET Core 10** — RESTful API with controllers
- **Entity Framework Core 10** — SQL Server ORM with code-first migrations
- **ASP.NET Identity + JWT** — Authentication and role-based authorization
- **Azure Blob Storage** — Car image hosting (with local file fallback for dev)

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
- **Azure App Service** — API hosting
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

# Start the API (auto-applies migrations and seeds admin user)
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

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Admin | admin@cardeal.com   | Admin123!   |

Register a new account through the UI to use the app as a regular seller.

## Features

- 🚘 **Car Submission** — Add vehicles with make, model, year, mileage, condition, VIN, photos, and asking price
- 📷 **Image Uploads** — Multiple photos per car (max 10, 5MB each)
- 💰 **Offer System** — Admins make and manage offers on submitted cars
- 📝 **Consignment Management** — Track agreed prices, commissions, and consignment status
- 💬 **Messaging** — In-app communication between sellers and admins
- 📊 **Admin Dashboard** — Overview of submissions, active offers, and consignments
- 🌐 **Multi-Language** — Full English and Spanish support, admin-controlled
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🔒 **Secure** — JWT authentication with role-based access control

## Project Structure

```
CarDeal/
├── src/
│   ├── CarDeal.Api/          # .NET backend
│   │   ├── Controllers/      # API endpoints
│   │   ├── Models/           # Domain entities
│   │   ├── DTOs/             # Request/response objects
│   │   ├── Services/         # Business logic
│   │   ├── Data/             # EF Core context
│   │   └── Migrations/       # Database migrations
│   │
│   └── CarDeal.Client/       # React frontend
│       └── src/
│           ├── pages/        # Route components
│           ├── components/   # Reusable UI
│           ├── api/          # API service layer
│           ├── context/      # Auth state
│           ├── types/        # TypeScript interfaces
│           └── i18n/         # Translations
│
├── .github/workflows/        # CI/CD pipelines
├── CLAUDE.md                 # AI assistant instructions
└── CarDeal.sln               # Solution file
```

## License

This project is for demonstration and educational purposes.
