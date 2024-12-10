# Excel-Gen-AI

A Next.js application with an Excel-like interface using Jspreadsheet, available as an Electron desktop application.

## Requirements

- Node.js 18 or higher
- npm or yarn

## Installation and Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Running the Application

Development mode:
```bash
# Start Next.js development server
npm run dev
# In a separate terminal, start Electron
npm run electron-dev
```

Production build:
```bash
# Build Next.js
npm run build
# Start Electron with production build
npm run electron-start
```

## Tech Stack

- Next.js 14
- TypeScript
- Jspreadsheet CE
- Electron
- OpenAI API
