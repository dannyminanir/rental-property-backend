# Rental Property & Tenant Manager with AI Maintenance Triage - Backend API

**Group 5:** Gisubizo Nice, Minani Daniel, Marie Noella Gasana Urumuri, Freddy Rudasingwa  
**Goal:** 3-week MVP backend service for Landlord, Tenant, and Admin management with AI triage.

---

## 📁 Project Structure

```
rental-property-backend/
├── .vscode/                 # Team-shared VS Code settings and debugger
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── src/
│   ├── config/              # DB and environment configuration
│   ├── controllers/         # Business logic per feature owner
│   ├── data/
│   │   └── sampleRequests.json  # 12 required AI test requests
│   ├── middleware/          # JWT auth, error handlers
│   ├── models/              # Database models (User, Unit, Lease, etc.)
│   ├── routes/              # Express API route endpoints
│   ├── services/
│   │   └── aiTriageService.js   # LLM maintenance triage logic
│   └── server.js            # Entry point
├── .env.example             # Template for environment variables
├── .gitignore               # Ignores node_modules and .env
├── package.json
└── README.md
```

---

## 👥 Feature Ownership

| Member | Feature Area | Key Responsibilities |
| :--- | :--- | :--- |
| **Owner 1** | Auth, Invites & Dashboards | Landlord sign up/login, admin approvals, tenant invite tokens, admin dashboard |
| **Owner 2** | Properties & Units | Property/unit CRUD, photos, rental pricing, landlord dashboard views |
| **Owner 3** | Leases & Rent | Tenant lease assignment, rent recording, balances, overdue alerts |
| **Owner 4** | Maintenance & AI Triage | Maintenance form submission, status workflow, LLM API integration, 112 emergency logic |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your database URL and AI API key.

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

---

## 🧪 AI Maintenance Triage Specifications
- **Categories:** `plumbing`, `electrical`, `doors and locks`, `appliances`, `structure (roof, walls, windows)`, `pests`, `other`.
- **Urgency levels:** `low`, `normal`, `urgent`.
- **Emergency handling:** If `is_emergency: true`, prompt tenant to contact **112** immediately.
- **Safety guarantee:** The AI never generates repair instructions.
- **12 Test requests:** Located in `src/data/sampleRequests.json` (includes English, Kinyarwanda, minor, urgent, and emergency scenarios).
