# 👶 KiddoCare Kenya — Daycare Marketplace Platform

A full-stack daycare marketplace and flexible weekly billing platform ("Lipa Mdogo Mdogo") for daycare centers, parents, and platform administrators in Kenya.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend API | NestJS + Prisma ORM + PostgreSQL |
| Auth | JWT (Access + Refresh tokens) |
| Payments | M-Pesa STK Push (Daraja API) |
| Email | Resend API |
| File Uploads | UploadThing |
| AI Features | Google Genkit + Gemini 1.5 |
| Caching | Redis |
| Monorepo | Turborepo |

---

## ✅ Prerequisites

Make sure the following are installed before you begin:

1. **Node.js v18+** — [Download](https://nodejs.org/)
2. **PostgreSQL** — either installed natively or via Docker
3. **Redis** — either installed natively or via Docker
4. **Docker Desktop** *(optional but recommended)* — [Download](https://www.docker.com/products/docker-desktop/)

---

## 🚀 Full Setup Guide

### Step 1 — Clone & Install Dependencies

Open **PowerShell** or **Command Prompt** in the project folder:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project"
npm install
```

This installs all workspace packages (root, `apps/api`, `apps/web`, shared packages).

---

### Step 2 — Configure Environment Variables

The project uses **two `.env` files** — both must be configured:

#### File 1: `apps/api/.env` (Backend API — primary)
```env
DATABASE_URL="postgresql://christine:christine1234@localhost:5432/daycare?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="7d"
MASTER_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Google Gemini AI — get free key at: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY"
AI_SERVICE_URL=http://localhost:3002

# Resend Email — get key at: https://resend.com/api-keys
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="KiddoCare Kenya <info@yourdomain.com>"

# UploadThing — get token at: https://uploadthing.com/dashboard
UPLOADTHING_TOKEN="YOUR_UPLOADTHING_TOKEN"
```

#### File 2: `.env` (Root — mirrors the API .env for Turborepo)
Copy the same values into the root `.env` file as well.

> **Note:** The `RESEND_FROM_EMAIL` sender domain must be verified in your Resend dashboard. Until then, emails can only be delivered to the email address used to register your Resend account.

---

### Step 3 — Start PostgreSQL & Redis

#### Option A: Docker Desktop (Recommended)

Make sure Docker Desktop is **open and running**, then:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project"
docker compose up -d
```

This starts PostgreSQL on port `5432` and Redis on port `6379` as background containers.

To stop them later:
```powershell
docker compose down
```

#### Option B: Native PostgreSQL & Redis on Windows

If you have PostgreSQL installed natively, create the database and user:

```powershell
# Create user 'christine' with password 'christine1234'
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE USER christine WITH PASSWORD 'christine1234';"

# Create database 'daycare' owned by that user
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE daycare OWNER christine;"

# Grant all privileges
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE daycare TO christine;"
```

Or run the equivalent SQL in **pgAdmin** or the `psql` shell:

```sql
CREATE USER christine WITH PASSWORD 'christine1234';
CREATE DATABASE daycare OWNER christine;
GRANT ALL PRIVILEGES ON DATABASE daycare TO christine;
```

---

### Step 4 — Push Database Schema (Create Tables)

Navigate to the API directory and push the Prisma schema to create all tables:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"
npx prisma db push
```

Expected output:
```
🚀  Your database is now in sync with your Prisma schema. Done in XXXms
```

> **Note:** `db push` is used instead of migrations for rapid development. It directly syncs the schema.

---

### Step 5 — Seed the Database ⭐

Seeding creates the admin account, two sample daycare schools, and their service listings.

#### ▶ Method 1: Prisma seed command (from `apps/api` folder)

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"
npx prisma db seed
```

#### ▶ Method 2: Via npm script (same folder)

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"
npm run prisma:seed
```

#### ▶ Method 3: Run the TypeScript seed file directly

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"
npx ts-node prisma/seed.ts
```

#### ✅ Expected seed output:
```
🌱 Seeding Daycare Platform Database...
✅ Admin user created: admin@daycare.com
✅ Daycare Schools & Service Presets seeded cleanly!
```

#### ⚠️ If seed fails with "already exists" errors:
The seed uses `upsert` so it is safe to run multiple times. If you hit errors, reset the database first:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"

# Reset (drops all data) and re-push schema
npx prisma db push --force-reset

# Then seed fresh
npx prisma db seed
```

---

### Step 6 — (Optional) Start the AI Service

The Genkit AI service runs separately. To enable AI profile drafting and executive summary reports:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\Ai\AI_service"
npx tsx src/server.ts
```

The AI service runs on `http://localhost:3002`. Make sure `AI_SERVICE_URL=http://localhost:3002` is set in your `.env`.

---

### Step 7 — Run the Full Platform

From the **project root**, start all services together with Turborepo:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project"
npm run dev
```

Or run each app separately in different terminal windows:

```powershell
# Terminal 1 — Backend API
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"
npm run dev

# Terminal 2 — Frontend Web App
cd "c:\Users\ADMIN\Desktop\Christine project\apps\web"
npm run dev
```

**Running services:**

| Service | URL |
|---|---|
| 🌐 Frontend (Parent & School Portal) | http://localhost:5173 |
| ⚙️ Backend REST API | http://localhost:3000 |
| 🤖 AI Service (optional) | http://localhost:3002 |
| 🗃️ PostgreSQL | localhost:5432 |
| 🗄️ Redis | localhost:6379 |

---

## 🗄️ Prisma Useful Commands

Run these from inside `apps/api`:

```powershell
cd "c:\Users\ADMIN\Desktop\Christine project\apps\api"

# View and explore the database in a browser UI
npx prisma studio

# Re-sync schema to database (no data loss for compatible changes)
npx prisma db push

# Wipe database completely and re-push schema (DELETES ALL DATA)
npx prisma db push --force-reset

# Re-run seed after a reset
npx prisma db seed

# Regenerate Prisma Client after schema changes
npx prisma generate
```

---

## 🔐 Seeded Login Credentials

### 1. Platform Admin
| Field | Value |
|---|---|
| Email | `admin@daycare.com` |
| Password | `Password123!` |
| Access | Onboard schools, verify documents, resolve disputes, view audit logs |

### 2. Sample School Accounts (pre-seeded)

| School | Email | Password |
|---|---|---|
| Little Angels Daycare, Kilimani | `kilimani@littleangels.co.ke` | `Password123!` |
| Sunshine Early Learning, Westlands | `info@sunshineearlylearning.co.ke` | `Password123!` |

> **First login behavior:** Any school account created by the admin via the onboarding form will be forced to change their password on first login, then guided through a multi-step profile creation wizard.

### 3. Parent Accounts
Register directly on the web app — click **Sign In / Register → Register Account**. No seed required.

---

## ✨ Platform Features

1. **Admin Onboarding** — Admin creates school accounts; credentials are emailed via Resend. School is forced to change password on first login.
2. **Multi-Step School Profile Wizard** — New schools complete a guided profile setup (logo, cover images via UploadThing, services, AI-assisted bio).
3. **Public Daycare Marketplace** — Browse schools, view programs, verified badges, average star ratings, and parent reviews.
4. **Child Intake Form** — Register children with name, date of birth, and medical/dietary notes.
5. **Lipa Mdogo Mdogo Weekly Billing** — Monthly daycare fees automatically split into weekly installments. Final week absorbs any remainder.
6. **M-Pesa STK Push Payments** — Pay weekly installments via Safaricom M-Pesa. Generates printable official receipts.
7. **Google Genkit AI Integration** — Auto-draft daycare profiles and generate executive summary reports with financial health ratings and recommendations.
8. **Document Verification & Badges** — Schools upload licensing documents; admin verifies to grant a `✓ Verified` badge.
9. **Dispute Resolution** — Parents flag payment disputes; admins resolve or approve refunds.
10. **School Management** — Admin can deactivate or permanently delete schools from the directory.
11. **Audit Trail** — Every major action (onboard, update, delete, resolve dispute) is logged in an audit trail.

---

## 🔧 Common Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED 5432` | PostgreSQL is not running. Start Docker (`docker compose up -d`) or start native PostgreSQL service. |
| `ECONNREFUSED 6379` | Redis is not running. Start it with Docker or native Redis service. |
| Seed fails with unique constraint error | Run `npx prisma db push --force-reset` then `npx prisma db seed` |
| Login returns 401 | Check that seed ran successfully. Admin email is `admin@daycare.com` (not `admin@daycare.co.ke`) |
| Email not sent on onboarding | Check `RESEND_API_KEY` in `apps/api/.env`. Check spam folder. Resend test mode only delivers to your registered Resend account email unless you verify a custom domain. |
| AI features not working | Make sure `GOOGLE_API_KEY` is set and the AI service is running on port 3002 |
| UploadThing upload fails | Check `UPLOADTHING_TOKEN` in `apps/api/.env` |
#   K i d o o C a r e - K e n y a  
 