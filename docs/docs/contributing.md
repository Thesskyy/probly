# Contributing to Probly

Thank you for your interest in contributing to Probly! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/PragmaticMachineLearning/probly.git
   cd probly
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test your changes thoroughly
4. Commit your changes with a descriptive message:
   ```bash
   git commit -m "Add feature: description of your feature"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request from your fork to the main repository

## Project Structure

- `/src`: Source code
  - `/components`: React components
  - `/context`: React context providers
  - `/constants`: Application constants
  - `/lib`: Utility libraries
  - `/pages`: Next.js pages
  - `/types`: TypeScript type definitions
  - `/utils`: Utility functions
- `/docs`: Documentation
- `/public`: Static assets

## Key Components

### Spreadsheet

The spreadsheet component (`Spreadsheet.tsx`) is the main interface for data display and manipulation. It uses Handsontable for the grid and integrates with the SpreadsheetContext.

### AI Chat

The chat interface (`ChatBox.tsx`) handles user interactions with the AI assistant. It sends requests to the LLM API and displays responses.

### Python Sandbox

The PyodideSandbox (`pyodideSandbox.ts`) provides Python execution capabilities in the browser using WebAssembly.

## Adding New Features

### New Tools

To add a new tool for the AI assistant:

1. Add the tool definition to `src/constants/tools.ts`
2. Implement the tool handling in `src/pages/api/llm.ts`
3. Update the UI components to handle the tool's output

### UI Components

When adding new UI components:

1. Create the component in `src/components/`
2. Use TypeScript for type safety
3. Follow the existing styling patterns
4. Add appropriate tests

## Documentation

When adding or modifying features, please update the relevant documentation:

1. Update or create markdown files in the `/docs` directory
2. Add JSDoc comments to functions and components
3. Update type definitions as needed

## Testing

Before submitting a PR, please ensure:

1. Your code compiles without errors
2. All existing functionality still works
3. Your new features work as expected
4. You've added appropriate tests for new functionality

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Use functional components with hooks for React
- Use async/await for asynchronous code
- Add appropriate error handling

## Submitting Pull Requests

When submitting a PR:

1. Provide a clear description of the changes
2. Reference any related issues
3. Ensure all tests pass
4. Include screenshots for UI changes if applicable
5. Update documentation as needed

## Questions?

If you have any questions or need help, please:

1. Check the existing documentation
2. Look for similar issues on GitHub
3. Open a new issue with your question

Thank you for contributing to Probly!
