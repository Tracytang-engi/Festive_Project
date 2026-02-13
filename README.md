# Festive Interactive Web App

A festive social web application featuring **Christmas** and **Spring Festival** themes, stickers, and friend connections.

**Live:** [festickers.vercel.app](https://festickers.vercel.app) · [festickers.com](https://festickers.com)

---

## Features

- **Dual Themes**: Switch between Christmas 🎄 and Spring Festival 🧧
- **Secure Auth**: Phone-based registration with profile creation
- **Social**: Discover friends, send requests, view connected scenes
- **Messaging**: Send festive stickers that unlock on the festival day
- **Friend Decor Page**: View a friend's festive scene (年夜饭 / 贴对联 / 逛庙会 / 放鞭炮), send blessings via sidebar—select sticker first, then write your wish
- **Festive Decor**: Your own scene with draggable stickers from friends, save layout
- **History**: Yearly archival of festive memories
- **Moderation**: Report messages, admin review (ModeratorPage)
- **Private Messages**: Option to send content visible only to sender and recipient; stickers remain visible to all

### Spring Festival Scenes (贴纸分类)

| Scene        | 中文     | Stickers           |
|-------------|----------|--------------------|
| eve_dinner  | 年夜饭   | 8 stickers         |
| couplets    | 贴对联   | 9 stickers         |
| temple_fair | 逛庙会   | 7 stickers         |
| fireworks   | 放烟花   | 4 stickers         |

---

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running on port 27017, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI

### Quick Start

Double-click **`start_app.bat`** in this directory.

### Manual Start

1. **Backend**
   ```bash
   cd server
   npm install
   # Create server/.env with MONGODB_URI, JWT_SECRET, HMAC_SECRET (see DEPLOYMENT.md)
   npm run dev
   ```
2. **Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

---

## Data Persistence

- User and app data stored in **MongoDB** (`festive-app`).
- Data persists automatically across sessions.

---

## Tech Stack

| Layer   | Stack                                |
|---------|--------------------------------------|
| Backend | Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Multer |
| Frontend| React 19, Vite, TypeScript, Framer Motion, Lucide icons |
| Deploy  | Vercel (frontend), 阿里云 + Nginx (API) |

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup (API on Aliyun, frontend on Vercel, domain festickers.com).
