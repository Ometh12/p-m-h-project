# 📡 GameTracker Pro: Next-Gen Telemetry Core

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

A high-performance, terminal-style web application engineered to track real-time multi-store video game pricing telemetry, deep historical volatility metrics, and instant tracking alerts. 

Designed for operators who want profound savings through an ultra-refined, data-dense interface.

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
```
2. Install dependencies
```bash
npm install
```
3. Establish Database Connection
Create a .env file in the root directory and add your Supabase connection strings:

```Code snippet
VITE_SUPABASE_URL=[https://your-project-url.supabase.co](https://your-project-url.supabase.co)
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
(Note: Ensure your supabaseClient.ts is configured to read from these environment variables, or hardcode them strictly for local testing).
```
4. Boot the Terminal
```bash
npm run dev
```
Open http://localhost:5173 in your browser to access the operator dashboard.

⚠️ Known Behaviors & Security
Authentication: Supabase email confirmation must be disabled in your project settings for instant local testing, or a valid SMTP server must be configured.

Scanning: The Active Matrix Scanner relies on live in-browser fetch requests and is only active while the dashboard is running.

🤝 Contributing
Contributions, issues, and feature requests are welcome.

Engineered for players. Structured for analysts.
