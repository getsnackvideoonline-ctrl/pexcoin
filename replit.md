# Workspace

## Overview

PexCoin Trading Platform — a full crypto exchange platform clone of pexcoin.online built with React + Vite frontend and Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Features

### Frontend (artifacts/pexcoin)
- Homepage: Live crypto ticker (BTC/ETH/BCH), coin grid with 24 trading pairs, Deposit/Withdraw/Support actions
- Login/Register: Tabbed auth interface with email + password
- Dashboard: User balance (USDT, BTC, ETH) + transaction history
- Deposit/Withdraw pages
- Admin login: 网站管理中心 (Chinese title), verification code captcha
- Admin dashboard: Stats, user management, transaction approval/rejection

### Backend (artifacts/api-server)
- Auth routes: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me
- Crypto routes: /api/crypto/prices, /api/crypto/ticker (24 pairs)
- Transaction routes: /api/transactions (deposit/withdrawal)
- User balance route: /api/users/balance
- Admin routes: /api/admin/login, /api/admin/users, /api/admin/transactions, /api/admin/stats

## Admin Credentials
- Username: `admin`
- Password: `admin123`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Auth

Token-based authentication using base64-encoded payloads.
- User token stored in localStorage as `pexcoin_token`
- Admin token stored in localStorage as `pexcoin_admin_token`
- Token sent as `Authorization: Bearer <token>` header

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
