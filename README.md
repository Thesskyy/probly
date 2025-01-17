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
- OpenAI API
- Handsontable

## Development Roadmap
- [x] Add a chat history
- [x] Add visualizations / graphing
- [x] Add excel import / export
- [ ] Try to respect formatting on import
- [x] Add an accept / reject button on the chat response prior to applying it to the spreadsheet
- [ ] Other kinds of operations (hide rows where, hide columns where, sort table by attribute, etc.)
- [ ] Support for multiple sheets (or select sheet to use on import)
- [ ] Make more of the top toolbar buttons work (first check out of the box hands on table functionality)
- [x] Keybindings / hotkeys
- [x] Hide chat window with expand / collapse button
