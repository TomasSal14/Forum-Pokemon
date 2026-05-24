# PokeForum — Frontend

React frontend for PokeForum, built with [Vite](https://vitejs.dev/).

## Requirements

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
```

## Available Scripts

### `npm run dev`

Starts the development server at [http://localhost:3000](http://localhost:3000).

The page hot-reloads on file changes.

### `npm run build`

Builds the app for production into the `dist/` folder.
Output is minified and filenames include content hashes.

### `npm run preview`

Serves the production build locally for inspection before deploying.

### `npm run lint`

Runs ESLint across all source files.

## Project Structure

```
frontend/
├── index.html          # Entry HTML (Vite root)
├── vite.config.js      # Vite configuration (port 3000, React plugin)
├── eslint.config.js    # ESLint flat config
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx         # Root component with routing
    ├── App.css         # Global shared styles
    ├── components/     # Reusable components
    ├── pages/          # Page components (one per route)
    └── utils/          # Shared helpers (api.js, permissions.js)
```

## Configuration

The API base URL is set in `src/utils/api.js`:

```js
export const API_BASE = 'http://127.0.0.1:8000/api';
```

Change this value if the backend runs on a different host or port.
