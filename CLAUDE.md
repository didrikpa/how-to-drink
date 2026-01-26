# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start development server with HMR
npm run build     # Type-check with tsc then build for production
npm run lint      # Run ESLint on the codebase
npm run preview   # Preview production build locally
```

## Tech Stack

- **React 19** with TypeScript
- **Vite** (using rolldown-vite variant for faster builds)
- **ESLint 9** with flat config, TypeScript-ESLint, and React hooks/refresh plugins

## Project Structure

- `src/main.tsx` - Application entry point, renders App into DOM
- `src/App.tsx` - Root React component
- `vite.config.ts` - Vite configuration with React plugin
- `eslint.config.js` - Flat ESLint configuration
- `tsconfig.json` - Project references to app and node configs
- `tsconfig.app.json` - TypeScript config for src/ (strict mode enabled)
