# KavachAI — Backend API

> **Post-Quantum Cryptographic (PQC) Scanner & Management Platform**
> Built for PNB Hackathon 2026 by **InfiniTech**

A robust Node.js/Express backend that powers KavachAI — a full-stack security platform for discovering assets, scanning their cryptographic posture, and generating actionable PQC migration guidance using AI.

---

## 📌 Table of Contents

- [Features](#-features)
- [Architecture & Flow](#-architecture--flow)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Local Setup (First Time)](#-local-setup-first-time)
- [Running the Server](#-running-the-server)
- [API Endpoints](#-api-endpoints)
- [Team](#-team)

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Two-Factor Login** | Email + password login followed by a Redis-backed OTP sent via email |
| **JWT Auth & RBAC** | Stateless token-based sessions with `user` / `admin` role enforcement |
| **Asset Discovery** | Finds all subdomains, IPs, and open ports for a domain via an external Python service |
| **Cryptographic Scanning** | Soft & Deep TLS/PQC scanning powered by an external Python scanner |
| **ML-Based PQC Scoring** | Calls a PQC ML microservice and combines technical + business context into a final quantum-readiness score |
| **AI Recommendations** | LLM (Groq / LLaMA) generates per-asset remediation steps and PQC migration strategies |
| **CBOM Generation** | Produces a Cryptographic Bill of Materials (aggregate or per-asset) as JSON or downloadable PDF |
| **AI Chatbot** | Context-aware audit assistant answers questions directly about your scan results |
| **Dashboard Stats** | Real-time aggregated stats: risk distribution, PQC adoption, cert expiry, asset types |
| **Reports** | Executive-level PDF reports, on-demand email dispatch, and scheduled automated reports via `node-cron` |
| **Domain Summaries** | Per-domain PQC readiness, TLS distribution, and LLM-generated domain-level recommendations |
| **Crypto Inventory** | Lists every unique KEX, signature algorithm, and cipher found across a domain |

---

## 🔄 Architecture & Flow

```
CLIENT (React/Vite)
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│                  Express API  (Port 3000)                 │
│  authMiddleware (JWT) → roleMiddleware → Route Handler   │
└──────────────────────────────────────────────────────────┘
     │                    │                    │
     ▼                    ▼                    ▼
  MongoDB             Redis               External APIs
 (Mongoose)       (OTP store)     ┌──── Python Crypto Scanner
                                  ├──── Python PQC ML Scorer
                                  └──── Groq LLM (LLaMA 3.1)
```

### Step-by-Step Request Flow

1. **Login** — Client sends `email` + `password` → credentials validated against MongoDB.
2. **OTP** — A 6-digit OTP is generated, stored in Redis (with TTL), and emailed via Nodemailer.
3. **Verify OTP** — Client submits the OTP → Redis validates → a signed JWT is returned.
4. **Protected Access** — All subsequent requests include `Authorization: Bearer <token>` → `authMiddleware` validates it.
5. **Add Domain** → **Discover Assets** → **Run Scan** → **Generate CBOM / Recommendations**.
6. **Reports** — Scheduled reports run automatically via `node-cron`; on-demand reports are emailed instantly.

---

## 🛠️ Tech Stack

### Runtime & Framework
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | LTS | JavaScript runtime |
| **Express.js** | ^5.2.1 | HTTP framework |

### Database & Cache
| Technology | Version | Purpose |
|---|---|---|
| **MongoDB** | Atlas / local | Primary data store |
| **Mongoose** | ^9.2.4 | ODM for MongoDB |
| **Redis** | ^5.11.0 | OTP caching (TTL-based) |

### Authentication & Security
| Technology | Version | Purpose |
|---|---|---|
| **jsonwebtoken** | ^9.0.3 | JWT signing & verification |
| **bcryptjs** | ^3.0.3 | Password hashing |

### AI & Communication
| Technology | Version | Purpose |
|---|---|---|
| **Groq API** (LLaMA 3.1) | — | AI recommendations & chatbot |
| **Nodemailer** | ^8.0.2 | Email OTPs & report dispatch |
| **Axios** | ^1.13.6 | HTTP client for external scanners |

### PDF & Scheduling
| Technology | Version | Purpose |
|---|---|---|
| **Puppeteer** | ^24.39.1 | Headless Chrome PDF generation |
| **node-cron** | ^4.2.1 | Scheduled report automation |
| **uuid** | ^13.0.0 | Unique job ID generation |

### Other
| Technology | Purpose |
|---|---|
| **dotenv** | Environment variable loading |
| **cors** | Cross-origin request handling |
| **node-fetch** | Additional HTTP fetch support |

---

## 📂 Project Structure

```text
backend-pnb/
│
├── app.js                        # 🚪 Entry point — Express setup, route registration, global error handler
│
├── config/
│   └── connectDB.js              # MongoDB connection logic
│
├── controllers/
│   └── authController.js         # Login and OTP verification handlers
│
├── middlewares/
│   ├── authMiddleware.js         # JWT token verification (protects all routes)
│   └── roleMiddleware.js         # Role-based access control (user / admin)
│
├── models/                       # Mongoose schemas
│   ├── User.js                   # User account (email, password hash, role)
│   ├── Domain.js                 # Monitored root domain
│   ├── Asset.js                  # Discovered subdomain / IP / host
│   ├── Service.js                # Open network service (port + protocol) on an asset
│   ├── Scan.js                   # Scan job record (status, type, timing)
│   ├── ScanResult.js             # Per-asset raw scan output + PQC scores
│   ├── Recommendation.js         # Per-asset AI recommendations
│   ├── DomainRecommendation.js   # Domain-level LLM recommendation cache
│   ├── Cbom.js                   # Cryptographic Bill of Materials document
│   ├── Chat.js                   # Chatbot Q&A history
│   └── ReportSchedule.js         # Scheduled report configuration
│
├── routes/
│   ├── authRoutes.js             # /api/auth
│   ├── assetDiscovery.js         # /api/asset-discovery
│   ├── cbom.js                   # /api/cbom
│   ├── chatBot.js                # /api/chatbot
│   ├── dashboard.js              # /api/dashboard
│   ├── domainRoutes.js           # /api/domains
│   ├── scan.js                   # /api/scan
│   ├── services.js               # /api/services
│   └── reportRoutes.js           # /api/reports
│
├── services/                     # Core business logic
│   ├── otpService.js             # Redis OTP generation & verification
│   ├── emailService.js           # Nodemailer email dispatch
│   ├── domainService.js          # Domain helper utilities
│   ├── generateRecommendation.js # Per-asset LLM recommendation via Groq
│   ├── generateDomainRecommendation.js # Domain-level LLM recommendation
│   ├── generateChatPrompt.js     # Chatbot context builder & query handler
│   ├── generateScore.js          # LLM-assisted PQC score normalizer
│   ├── mlFeatureExtractor.js     # Derives ML input features from scan results
│   ├── scoring.js                # computeEnvScore + combineScores logic
│   ├── cbomToHtml.js             # Converts CBOM document to HTML for PDF
│   ├── generatePdf.js            # Puppeteer-based HTML → PDF converter
│   ├── reportEngine.js           # Full report data aggregation + email dispatch
│   ├── reportWorker.js           # node-cron scheduler for automated reports
│   └── runWithConcurrency.js     # Controlled async concurrency runner
│
├── utils/
│   ├── caseConverter.js          # snake_case ↔ camelCase converters (toCamel / toSnake)
│   ├── catchAsync.js             # Async error wrapper
│   └── expressError.js           # Custom error class
│
├── .env                          # Environment variables (do NOT commit)
├── .gitignore
└── package.json
```

---

## ⚙️ Local Setup (First Time)

### Prerequisites

Make sure the following are installed and running before you begin:

- [Node.js](https://nodejs.org/) v18+ (LTS recommended)
- [MongoDB](https://www.mongodb.com/) — either a local instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- [Redis](https://redis.io/) — either a local instance or a cloud provider (e.g., [Upstash](https://upstash.com/))
- A **Gmail account** with an [App Password](https://myaccount.google.com/apppasswords) enabled (for OTP emails)
- A **Groq API key** from [console.groq.com](https://console.groq.com/) (for AI features)
- The **Python Crypto Scanner** and **PQC ML Scorer** services running (external microservices)

---

### 1. Clone & Navigate

```bash
git clone <repository-url>
cd backend-pnb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of `backend-pnb/`:

```env
# ── MongoDB ─────────────────────────────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.evzikfr.mongodb.net/pqcscanner?retryWrites=true&w=majority&appName=Cluster0

# ── Redis ────────────────────────────────────────────────────────────────
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password
REDIS_END_POINT=your_redis_endpoint
REDIS_PORT=6379

# ── Email (Gmail App Password) ───────────────────────────────────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# ── JWT ──────────────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key

# ── AI (Groq) ────────────────────────────────────────────────────────────
GROQ_API_KEY=your_groq_api_key

# ── External Microservices ───────────────────────────────────────────────
API_URL1=http://localhost:8000   # Python Crypto Scanner + CBOM + Discovery
API_URL2=http://localhost:8001   # Python PQC ML Scorer

# ── Server ───────────────────────────────────────────────────────────────
PORT=3000
```

> **Tip:** Copy `.env` from the template above and fill in your values. Never commit this file.

### 4. Seed a User (First Time Only)

There is no public registration endpoint. Add the first user directly in MongoDB (via Atlas UI or Compass):

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "<bcrypt-hashed-password>",
  "role": "admin"
}
```

You can generate a bcrypt hash with a quick Node.js snippet:
```js
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('your_password', 10));
```

---

## 🏃 Running the Server

### Development (with auto-restart using nodemon)

```bash
# Install nodemon globally if not already installed
npm install -g nodemon

nodemon app.js
```

### Production

```bash
node app.js
```

The server starts on **http://localhost:3000** (or the `PORT` defined in `.env`).

You should see:
```
Server running on port 3000
```

---

## 📊 API Endpoints

> **Authentication:** All routes except `/api/auth/*` require a `Authorization: Bearer <JWT>` header.

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Validate credentials and send OTP to email |
| `POST` | `/api/auth/verify-otp` | ❌ | Verify OTP and receive a JWT token |

---

### 🌐 Domains — `/api/domains`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/domains/` | Add a new root domain to monitor |
| `GET` | `/api/domains/` | List all registered domains |
| `GET` | `/api/domains/:domainId/summary` | Get PQC readiness summary + LLM recommendation for a domain |
| `GET` | `/api/domains/:domainId/crypto-inventory` | List all unique cryptographic algorithms found across a domain |

---

### 🔍 Asset Discovery — `/api/asset-discovery`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/asset-discovery/:id/discover` | Trigger background asset discovery (subdomains, IPs, ports) for a domain |
| `GET` | `/api/asset-discovery/:id/assets` | List all discovered assets and their open services for a domain |

---

### 🔬 Scan — `/api/scan`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan/` | Start a new cryptographic scan (soft or deep) for selected assets |
| `GET` | `/api/scan/:id/status` | Get current status and timing of a scan |
| `GET` | `/api/scan/:id/results` | Get raw cryptographic results for a completed scan |
| `POST` | `/api/scan/:scanId/recommendations` | Generate AI recommendations for all assets in a scan |
| `GET` | `/api/scan/:scanId/recommendations` | Retrieve previously generated recommendations for a scan |
| `PATCH` | `/api/scan/:id/cancel` | Cancel a pending or in-progress scan |
| `GET` | `/api/scan/domain/:domainId` | Get full scan history for a domain |

---

### 📋 CBOM — `/api/cbom`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/cbom/:id` | Generate CBOM for a scan (`aggregate` or `perAsset` mode) |
| `GET` | `/api/cbom/:scanId/cbom` | Retrieve a generated CBOM (add `?mode=perAsset` for per-asset mode) |
| `GET` | `/api/cbom/:scanId/cbom/pdf` | Download the CBOM as a PDF report |

---

### 💬 Chatbot — `/api/chatbot`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chatbot/chat` | Ask the AI auditor a question about a specific scan's results |
| `GET` | `/api/chatbot/:scanId` | Retrieve the full chat history for a scan |

---

### 📊 Dashboard — `/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Aggregated dashboard statistics including risk, PQC adoption, cert expiry, asset breakdown |

---

### 🔌 Services — `/api/services`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services/:id/services` | List all open network services (HTTPS, SMTP, etc.) detected on a specific asset |

---

### 📄 Reports — `/api/reports`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/executive-summary` | Get executive-level PQC posture data (JSON) |
| `GET` | `/api/reports/executive-download` | Download the executive summary as a PDF |
| `GET` | `/api/reports/schedule-init` | Fetch available domains for scheduling a report |
| `POST` | `/api/reports/schedule` | Create a new automated report schedule |
| `GET` | `/api/reports/my-schedule` | List all active report schedules for the authenticated user |
| `DELETE` | `/api/reports/schedule/:id` | Delete a specific report schedule |
| `POST` | `/api/reports/on-demand` | Generate and email an audit report immediately |

---

## 👤 Team

- **Author:** InfiniTech
- **Event:** PNB Hackathon 2026

---

## 🔒 Security Notes

- All passwords are stored as **bcrypt hashes** (never plaintext).
- OTPs are stored in **Redis with TTL** and are single-use.
- All business routes are protected by **JWT authentication middleware**.
- CORS is restricted to known frontend origins (`localhost:5173` and `kavachai.mzdev.in`).
- Never commit your `.env` file — it is listed in `.gitignore`.
