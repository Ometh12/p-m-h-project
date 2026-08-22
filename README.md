# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## ✨ Core Features

* **🔒 Supabase Authentication:** Secure, token-based Postgres session management.
* **📡 Active Matrix Scanner:** In-browser automated scanning that pings the CheapShark API and triggers UI alerts when target thresholds are breached.
* **📊 Deep Market Analytics:** 30-day price volatility charts and historical low tracking.
* **🎛️ Advanced Grid Controls:** Toggleable printable gridlines, auto-fitting column widths, and Safe Mode row deletion.
* **🌐 Global Thresholds:** Hard-lock fiat currency (USD, EUR, GBP) and establish absolute deal floor percentages across the entire matrix.
* **💾 Data Export:** Compile and export your tracked matrix directly into raw CSV format for tabular spreadsheet analysis.

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, Lucide React (Icons)
* **Backend / Auth:** Supabase
* **Data API:** CheapShark REST API

## 🚀 Getting Started

To initialize this terminal on your local machine, follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/game-tracker-pro.git](https://github.com/YOUR_USERNAME/game-tracker-pro.git)
cd game-tracker-pro
2. Install dependencies
Bash
npm install
3. Establish Database Connection
Create a .env file in the root directory and add your Supabase connection strings:

Code snippet
VITE_SUPABASE_URL=[https://your-project-url.supabase.co](https://your-project-url.supabase.co)
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
4. Boot the Terminal
Bash
npm run dev
