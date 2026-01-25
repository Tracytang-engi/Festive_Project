# Festive Interactive Web App

A festive social web application featuring Christmas and Spring Festival themes, stickers, and friend connections.

## Features
- **Dual Themes**: Switch between Christmas 🎄 and Spring Festival 🧨.
- **Secure Auth**: Phone-based registration with profile creation.
- **Social**: Discover friends, send link requests, and view connected scenes.
- **Messaging**: Send festive stickers that unlock on the festival day.
- **History**: Yearly archival of festive memories.

## How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port 27017.

### Quick Start
Double-click the **`start_app.bat`** file in this directory.

### Manual Start
1. **Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

## Data Persistence
- User and application data is stored in your local **MongoDB** database (`festive-app`).
- It is saved automatically and persists even after you close the application.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, MongoDB.
- **Frontend**: React, Vite, TypeScript, Vanilla CSS.
