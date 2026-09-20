# 👶 KiddoCare Kenya — Daycare Marketplace & Flexible Billing Platform

KiddoCare Kenya is a full-stack daycare marketplace and flexible weekly installment billing platform (**"Lipa Mdogo Mdogo"**) built for Kenyan daycares, parents, and platform administrators. It features integrated Safaricom M-Pesa STK Push payments, real-time transaction ledgers, dispute resolution, and local Google Genkit AI features for automated school bio creation and executive reporting.

---

## 🏗️ System Architecture & Services

The platform consists of **3 core applications** and **2 infrastructure services**:

| Service | Technology | Port / URL | Description |
|---|---|---|---|
| **Frontend Web** | React 18 + Vite + Tailwind CSS | `http://localhost:5173` | Parent portal, School dashboard, Admin panel |
| **Backend REST API** | NestJS 10 + Prisma ORM | `http://localhost:3000` | Core business logic, auth, M-Pesa, disputes |
| **AI Microservice** | Express + Google Genkit + Gemini 1.5 | `http://localhost:3002` | School bio generation, executive summaries |
| **PostgreSQL** | Postgres 16 | `localhost:5432` | Relational database (users, schools, payments) |
| **Redis** | Redis 7 | `localhost:6379` | Token caching, rate limiting, queues |
| **Ngrok Tunnel** | Ngrok CLI | `https://xxxx.ngrok-free.app` | Public HTTPS tunnel for Safaricom M-Pesa callbacks |

---

## 📋 Prerequisites

Before setting up, ensure you have the following installed on your machine:

1. **Node.js** v18 or v20 LTS — [Download Node.js](https://nodejs.org/)
2. **Git** — [Download Git](https://git-scm.com/)
3. **Docker Desktop** *(Recommended for Postgres & Redis)* — [Download Docker](https://www.docker.com/products/docker-desktop/)  
   *(Alternatively, you can install native PostgreSQL 16 and Redis for Windows).*
4. **Ngrok** *(Required for live M-Pesa STK push testing)* — [Download Ngrok](https://ngrok.com/download)
5. **Google AI Studio API Key** *(Free for Gemini AI)* — [Get Key](https://aistudio.google.com/app/apikey)

---

## 🔑 Environment Variables Setup (`.env`)

The platform requires **three `.env` files** across the workspace. Create each file with the templates provided below:

### 1. File: `apps/api/.env` (Backend API — Primary)
Create or edit `apps/api/.env`:

```env
# ── Database & Redis ────────────────────────────────────────────────────────
# If using Docker Compose (dev:dev):
DATABASE_URL="postgresql://dev:dev@localhost:5432/daycare?schema=public"
# If using Native Postgres on Windows (e.g. christine:christine1234 or postgres:postgres):
# DATABASE_URL="postgresql://christine:christine1234@localhost:5432/daycare?schema=public"

REDIS_URL="redis://localhost:6379"
PORT=3000

# ── Authentication ──────────────────────────────────────────────────────────
JWT_SECRET="56da58d0d0e6928e65c5da70abfee1d99f91376f9b16d4b04a000ac41b11cd98"
JWT_EXPIRES_IN="7d"

# ── AES-256 Credentials Encryption ─────────────────────────────────────────
# 64-character hex key (32 bytes) used to encrypt Daraja API credentials in DB
MASTER_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# ── Public App URL (For M-Pesa Callbacks) ───────────────────────────────────
# Active ngrok tunnel forwarding to port 3000 (e.g. https://your-subdomain.ngrok-free.app)
# NOTE: The API also automatically auto-discovers active local ngrok tunnels via port 4040!
APP_URL="https://your-subdomain.ngrok-free.app"

# ── KiddoCare AI Service (Google Genkit + Gemini) ────────────────────────────
# Free key from: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
AI_SERVICE_URL="http://localhost:3002"

# ── Resend Email Service ─────────────────────────────────────────────────────
# Key from: https://resend.com/api-keys
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="KiddoCare Kenya <info@yourdomain.com>"

# ── UploadThing Service ──────────────────────────────────────────────────────
# Token from: https://uploadthing.com/dashboard
UPLOADTHING_TOKEN="YOUR_UPLOADTHING_TOKEN"
```

### 2. File: `Ai/AI_service/.env` (Genkit AI Microservice)
Create or edit `Ai/AI_service/.env`:

```env
# Google Gemini API key (must match the key in apps/api/.env)
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
PORT=3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### 3. File: `.env` (Project Root — Turborepo Monorepo Mirror)
Create or edit `.env` in the root folder (mirrors the API env):

```env
DATABASE_URL="postgresql://dev:dev@localhost:5432/daycare?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
JWT_SECRET="56da58d0d0e6928e65c5da70abfee1d99f91376f9b16d4b04a000ac41b11cd98"
JWT_EXPIRES_IN="7d"
MASTER_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
APP_URL="https://your-subdomain.ngrok-free.app"
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
AI_SERVICE_URL="http://localhost:3002"
```

> 💡 **Encryption Key Tip:** To generate a new 64-character hex encryption key anytime, run:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 🚀 Step-by-Step Installation & Quickstart

Follow these steps in order to get the complete platform running from scratch:

### Step 1: Install All Dependencies

Open PowerShell or terminal in the project root:

```powershell
# 1. Install root, API, and Web dependencies
npm install

# 2. Install AI Service dependencies
cd Ai/AI_service
npm install
cd ../..
```

---

### Step 2: Start PostgreSQL & Redis

#### Option A: Using Docker Desktop (Recommended)
Make sure Docker Desktop is running, then run:

```powershell
docker compose up -d
```

Verify containers are running:
```powershell
docker ps
```
*(You should see `daycare_postgres` on port `5432` and `daycare_redis` on port `6379`).*

#### Option B: Using Native PostgreSQL & Redis
If you do not use Docker, ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE daycare;
```
Ensure your `DATABASE_URL` in `apps/api/.env` points to your native postgres credentials.

---

### Step 3: Push Database Schema & Seed Data

Push the Prisma schema to create all database tables and seed test accounts:

```powershell
cd apps/api

# Sync tables with Prisma schema
npx prisma db push

# Seed initial admin, sample daycare schools, and parent accounts
npm run prisma:seed

cd ../..
```

Expected output:
```
🌱 Seeding Daycare Platform Database...
✅ Admin user created: admin@daycare.com
✅ Daycare Schools, Services, and Parent seeded cleanly!
```

---

### Step 4: Start the Services

Open **4 separate terminal windows** (or use VS Code / Antigravity terminal tabs):

#### 🖥️ Terminal 1 — Backend API (Port 3000)
```powershell
cd apps/api
npm run dev
```
*Healthcheck:* [http://localhost:3000/api/health](http://localhost:3000/api/health)

#### 🖥️ Terminal 2 — Frontend Web App (Port 5173)
```powershell
cd apps/web
npm run dev
```
*Web Portal:* [http://localhost:5173](http://localhost:5173)

#### 🖥️ Terminal 3 — AI Microservice (Port 3002)
```powershell
# You can run this from root:
npm run ai:start

# Or directly in the folder:
cd Ai/AI_service
npm run dev
```
*Status:* `KiddoCare AI Service listening on port 3002`

#### 🖥️ Terminal 4 — Ngrok Tunnel for M-Pesa Callbacks
Safaricom Daraja servers cannot call `localhost`. Ngrok provides the public callback tunnel:

```powershell
ngrok http 3000
```

> ⚡ **Smart Auto-Discovery:** The KiddoCare API automatically connects to your local ngrok client at `http://127.0.0.1:4040/api/tunnels` to fetch your active forwarding URL on every STK push. Even if your ngrok URL changes, you don't need to restart the API!

---

## 🔐 Seeded Accounts & Login Credentials

All seeded accounts share the same default password: **`Password123!`**

| Role | Email | Password | Access & Capabilities |
|---|---|---|---|
| 👑 **Platform Admin** | `admin@daycare.com` | `Password123!` | School onboarding, document verification, badge approvals, dispute resolution, audit trail |
| 🏫 **School 1** (Kilimani) | `kilimani@littleangels.co.ke` | `Password123!` | Little Angels Daycare profile, service pricing, M-Pesa settings, child roster, attendance |
| 🏫 **School 2** (Westlands) | `info@sunshineearlylearning.co.ke` | `Password123!` | Sunshine Early Learning profile, services, student enrollment |
| 👨‍👩‍👧 **Parent** | `parent@daycare.com` | `Password123!` | Child management, daycare enrollment, Lipa Mdogo Mdogo payments, dispute filing |

> 💡 You can also click **Sign In / Register → Register Account** on the web app to register new parent accounts at any time.

---

## 🧭 How to Maneuver & Test the Platform

Here is a quick walkthrough to test each core user flow:

### Flow 1: Daycare M-Pesa Setup (School Portal)
1. Navigate to [http://localhost:5173](http://localhost:5173) and log in with `kilimani@littleangels.co.ke` / `Password123!`.
2. Go to **Settings** or the **M-Pesa Credentials** section.
3. If not configured, enter Safaricom Daraja Sandbox credentials:
   - **Business Shortcode**: `174379` (Sandbox default)
   - **Passkey**: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
   - **Consumer Key** & **Consumer Secret**: *(From your Daraja developer sandbox app)*.
4. Click **Save Credentials**. The backend encrypts them via AES-256-GCM using `MASTER_ENCRYPTION_KEY`.

---

### Flow 2: Child Enrollment & "Lipa Mdogo Mdogo" Payment (Parent Portal)
1. Log in with `parent@daycare.com` / `Password123!`.
2. Go to **My Children** → ensure a child (e.g. *Joy Wanjiku*) is registered.
3. Go to **Daycare Directory** → select **Little Angels Daycare & Nursery**.
4. Choose a program (e.g., *Full-Day Care* or *Toddler Care*) and click **Enroll Child**.
5. Select the child and submit enrollment.
6. Navigate to **Financial Ledger / Lipa Mdogo Mdogo**:
   - You will see the weekly billing breakdown (Weeks 1 through 4).
   - Select an installment card, or select a custom amount.
   - Enter your Kenyan mobile number (e.g., `07XXXXXXXX` or `01XXXXXXXX`).
   - Click **Pay with M-Pesa**.
7. **The STK Push Prompt** will hit your physical phone:
   - Enter your M-Pesa PIN.
   - Safaricom delivers the callback through your ngrok tunnel to `/api/payments/mpesa/callback`.
   - The UI automatically updates to **COMPLETED** without page reloads.
8. View the payment in the **Payment Transactions & Dispute Center**:
   - Click **View Receipt** to view and print official receipt with M-Pesa Receipt Number.
   - Click **Raise Dispute** to report any issue (overcharge, duplicate, service discrepancy).

---

### Flow 3: AI Bio Generation & Executive Reporting (School & Admin)
1. **School Profile Bio Drafting**:
   - Log in as a school account.
   - Open the School Profile editor or onboarding wizard.
   - Fill in school name, location, and teaching philosophies, then click **Generate Bio with AI**.
   - The Genkit AI service (`localhost:3002`) streams back a tailored profile description.
2. **Executive Financial & Health Reports**:
   - In the School dashboard or Admin panel, click **Generate Executive Report**.
   - The AI evaluates enrollment metrics, payment compliance, and delivers recommendations.

---

### Flow 4: Dispute Resolution & Verification (Admin Portal)
1. Log in with `admin@daycare.com` / `Password123!`.
2. Go to **Disputes**:
   - Review disputes raised by parents with linked transaction receipts and audit IDs.
   - Resolve disputes or approve refunds.
3. Go to **Schools & Verification**:
   - View uploaded licensing and safety documents.
   - Toggle the **Verified Badge** (`✓ Verified`) for legitimate schools.
4. Go to **Audit Logs**:
   - Review immutable system records of every onboarding, payment, and administrative action.

---

## 🛠️ Useful Prisma Commands

Run these inside `apps/api`:

```powershell
cd apps/api

# Open Prisma Studio visual database viewer
npx prisma studio

# Re-push schema if models are changed
npx prisma db push

# Wipe database completely and re-seed (use if test data becomes messy)
npx prisma db push --force-reset
npm run prisma:seed

# Regenerate Prisma Client types
npx prisma generate
```

---

## ❓ Troubleshooting & FAQs

### 1. `ECONNREFUSED 127.0.0.1:5432`
- **Cause:** PostgreSQL is not running.
- **Fix:** Start Docker Desktop and run `docker compose up -d`, or start your native PostgreSQL Windows service.

### 2. `ECONNREFUSED 127.0.0.1:6379`
- **Cause:** Redis is not running.
- **Fix:** Start Docker Desktop (`docker compose up -d`) or start native Redis.

### 3. M-Pesa STK Push: "Could not connect to payment gateway"
- **Cause:** Invalid or missing Safaricom Daraja Consumer Key / Secret in the school settings.
- **Fix:** Log in as the school, go to settings, and confirm your Daraja sandbox credentials are valid.

### 4. STK Push succeeds on phone but payment remains "PENDING"
- **Cause:** Safaricom cannot reach your local machine because Ngrok is not running or callback URL is blocked.
- **Fix:** Ensure `ngrok http 3000` is running in a terminal. Open [http://127.0.0.1:4040](http://127.0.0.1:4040) in your browser to inspect incoming webhook requests from Safaricom in real-time.

### 5. AI Service: "Failed to connect to AI service"
- **Cause:** Genkit AI service is not running on port 3002 or `GOOGLE_API_KEY` is missing.
- **Fix:** Run `npm run ai:start` from the project root and ensure `GOOGLE_API_KEY` is placed in both `apps/api/.env` and `Ai/AI_service/.env`.

### 6. Resetting everything to a clean slate
```powershell
cd apps/api
npx prisma db push --force-reset
npm run prisma:seed
```
This wipes all test transactions, creates all tables fresh, and re-seeds default admin, schools, and parents.