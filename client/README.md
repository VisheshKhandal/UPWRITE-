# Upwrite Frontend

React TypeScript frontend for Upwrite, built with Vite, Tailwind CSS, Redux Toolkit, RTK Query, React Router, Framer Motion, and lucide-react.

## Setup

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Set the backend URL:

```txt
VITE_API_URL=http://localhost:5000/api/v1
```

## Architecture

- `app/`: Redux store and typed hooks.
- `services/baseApi.ts`: RTK Query base API with access-token attachment and refresh-token retry.
- `features/`: API modules and slices by product domain.
- `components/`: reusable UI and product components.
- `layouts/`: auth layout, app shell, root providers.
- `routes/`: protected/public route guards and lazy route tree.
- `pages/`: route-level screens.

## Product Direction

The UI is intentionally calm, content-first, responsive, and performance-conscious. Upwrite should feel premium through clarity, speed, typography, spacing, and consistency rather than heavy visual effects.
