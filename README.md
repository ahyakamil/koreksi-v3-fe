Koreksi Frontend (Next.js + Tailwind)

Quick start

1. Copy `.env.local.example` to `.env.local` and edit `NEXT_PUBLIC_API_URL` if needed.
2. Install dependencies:

```bash
cd fe
npm install
```

3. Run dev server:

```bash
npm run dev
```

Notes
- The frontend expects the backend API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`).
- Login/Register store `accessToken` and `refreshToken` in `localStorage`.
