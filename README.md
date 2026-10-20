# MyExpense — Personal Finance Tracker

A modern, full-stack personal finance tracker built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

---

## ✨ Features

- **🔐 Secure Authentication**
  - Custom JWT session management with HTTP-only cookies.
  - User registration, login, and secure session validation.
  - Password hashing with bcrypt.

- **📊 Comprehensive Analytics Dashboard**
  - Summary cards: Total Balance, Total Income, Total Expenses, and Transaction Count.
  - Monthly Income vs. Expense comparison charts using Recharts.
  - Category-wise expense breakdown with donut/pie charts.
  - Period filtering: Current Month, Previous Month, Last 6 Months, and All Time.
  - Quick access to the 5 most recent transactions.

- **💳 Transaction Management**
  - Add, edit, delete, and list income/expense transactions.
  - Categorization, notes, dates, and amounts in INR (₹).
  - Search, category filter, date filter, and pagination.

- **🎯 Budget Management**
  - Category-level monthly budgets.
  - Visual budget progress bars with real-time spending calculations.
  - Status indicators: Under Budget, Near Limit (80–100%), Over Budget (>100%).
  - Month switcher for historical and future budget planning.

- **📈 Financial Reports & Export**
  - Detailed financial summaries and monthly trends.
  - One-click CSV export with localized column headers.

- **🌐 Complete Multilingual Support**
  - Full interface support for 3 languages:
    - **English (en)**
    - **தமிழ் (ta)**
    - **हिन्दी (hi)**
  - Pre-login language selector on first visit with persistence across sessions.
  - In-app language switcher accessible at any time without logging out.

- **📱 Modern & Responsive UI**
  - Clean collapsible vertical sidebar navigation on desktop.
  - Mobile drawer and responsive layouts for tablet and mobile devices.
  - Empty states, loading skeletons, accessible forms, and error handling.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **Database & ORM:** PostgreSQL & Prisma ORM
- **Charts:** Recharts
- **Security:** bcryptjs, jose (JWT)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.17+ or v20+)
- PostgreSQL database (Local or Cloud like Supabase, Neon)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd myexpense
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="your-32-character-secret-key-goes-here"
NODE_ENV="development"
```

### 4. Database Migration

Run Prisma migrations to set up the database schema:

```bash
npx prisma db push
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Build

```bash
# Production Build
npm run build

# Run Automated Test Suites
npx tsx scripts/test-multilingual.ts
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
