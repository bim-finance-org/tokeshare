# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tokeshare is a blockchain-based real estate tokenization platform built with Next.js 15 (App Router). Users can buy/sell tokenized assets (TGG tokens) and interact with a real estate marketplace on Polygon and Base networks.

## Development Commands

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run lint          # Run ESLint
npm run prisma        # Generate Prisma client + deploy migrations
npm run snapshot      # Run snapshot script (tsx ./lib/snapshot.ts)
npm run vercel-build  # Full production build (prisma generate + migrate + build)
```

## Tech Stack

- **Framework**: Next.js 15 with App Router, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (New York style)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Auth**: NextAuth (Credentials provider for dashboard)
- **Web3**: Wagmi + Viem for Ethereum interactions, Reown AppKit for wallet connection
- **Data**: TanStack React Query, SWR
- **Email**: Resend + react-email

## Architecture

### Directory Structure

- `/app` - Next.js app router (pages and `/api` routes)
- `/components` - React components (`/ui` for shadcn, `/features` for domain-specific, `/layout` for Nav/Footer)
- `/hooks` - Custom React hooks for blockchain interactions (useSwap, useSwapQuote, useERC20, useContracts, etc.)
- `/context` - React Context providers (Wagmi/AppKit setup, TokenContexts)
- `/lib` - Core utilities (auth, Redis, DB helpers, API utils)
- `/utils` - Helper functions (token, blockchain, email, price utilities)
- `/contracts` - Smart contract ABIs and addresses
- `/config` - Wagmi adapter config, token configurations
- `/enums` - TypeScript enums (Blockchain, TokenType, Direction)
- `/interfaces` & `/types` - TypeScript definitions
- `/prisma` - Database schema

### Key Patterns

**Blockchain Integration**:
- Smart contracts: TGG token, ZAP contract, PAXG, TFT_001, Marketplace, Batch Distributor
- Networks: Polygon (primary), Base
- Token configs in `/config/token.ts` contain metadata (addresses, decimals, CMC IDs)
- Viem public clients for read-only calls, Wagmi hooks for wallet transactions

**API Routes**:
- Located in `/app/api/` using route.ts pattern
- Use `requireAuth()` for protected endpoints
- Validation utilities: `validateStatus`, `validateId`, `validateCryptoAmount`
- Redis caching with `getFromCache`/`setCache` helpers

**Frontend**:
- Server Components by default, `'use client'` for client boundaries
- Custom hooks encapsulate blockchain logic
- shadcn/ui components in `/components/ui`

## Environment Variables

Copy `.env.example` to `.env.local`. Required variables:
- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` - PostgreSQL connection
- `REDIS_URL` - Redis cache
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` - Auth config
- `DASHBOARD_PASSWORD` - Admin dashboard access
- `NEXT_PUBLIC_PROJECT_ID` - Reown AppKit project ID
- `COINGECKO_API_KEY` / `COINMARKETCAP_API_KEY` - Price data
- `EXCHANGE_RATE_API_KEY` - Fiat conversion
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` - Email service
- `NEXT_PUBLIC_TOKESHARE_TGG_RECIPIENT` - TGG recipient address

## Code Style

- Prettier: 120 char width, single quotes, trailing commas, LF line endings
- Path alias: `@/*` maps to root directory
- Write code in English
