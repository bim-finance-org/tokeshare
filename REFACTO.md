# Analyse Refacto — Tokeshare

Branche : `refacto`
Date : 2026-05-23
Référentiel : skills Vercel `next-best-practices` + `vercel-react-best-practices`

## Pile détectée

- **Next.js 16.1.4** (App Router) — ESLint config encore en `eslint-config-next@15.1.4` (à aligner)
- **React 19.1.2**
- TypeScript strict
- Tailwind + shadcn/ui
- Prisma 6, ioredis (+ `redis` en doublon)
- NextAuth (Credentials, JWT)
- Wagmi 2 / viem 2 / Reown AppKit
- Resend, react-email
- Recharts, Swiper

---

## 🔴 Critique

### Sécurité

- **`lib/authOptions.ts:6` et `:43` — fallbacks en dur**
  - `DASHBOARD_PASSWORD || 'default-password'`
  - `NEXTAUTH_SECRET || 'tokeshare-dashboard-secret'`
  - Si la variable d'env est absente en prod, l'app accepte ces valeurs.
  - **Fix** : `throw new Error(...)` au boot si l'env est manquante.

- **Pas de rate-limit sur les endpoints publics** (`/api/cmc`, `/api/transactions/buy` POST, `/api/transactions/sell` POST, `/api/emails`).
  - Risque : spam de la DB / des APIs payantes (CMC, Resend).
  - **Fix** : Upstash ratelimit (compatible Vercel/Edge) ou un middleware maison basé Redis.

- **Pas de validation Zod sur les inputs API** alors que `zod` est en dépendance.
  - Tous les `hasRequiredFields(data: any)` doivent devenir des `BuyTxSchema.parse(data)`.
  - Bonus : types inférés via `z.infer<typeof Schema>`.

- **`app/api/transactions/buy/route.ts:54-92` et `sell/route.ts:60-94` — pas d'atomicité tx / email.**
  - Si Resend échoue, on a déjà créé la ligne Prisma → on renvoie 500 mais la transaction est en DB.
  - **Fix** : envoyer l'email en post-traitement (`after()` Next 15) ou file d'attente. Si vraiment couplé, faire un `prisma.$transaction` + email avant commit avec rollback en cas d'erreur.

> ℹ️ **Note métier** : les POST de `/api/transactions/buy` et `sell` sont publics par design (user anonyme remplit le form, admin valide à la main dans le dashboard). On ne touche pas à l'auth de ces routes, on ajoute uniquement rate-limit + validation.

### Architecture App Router

- **`components/layout/NavBar.tsx:8,35-44` — `next/head` utilisé dans App Router.**
  - `next/head` est un reliquat du Pages Router, il ne fonctionne pas en App Router.
  - Le bloc JSON-LD ne sera jamais rendu côté HTML.
  - **Fix** : exporter la metadata via `app/layout.tsx` ou utiliser `next/script` avec `strategy="afterInteractive"` et `id` (obligatoire pour les inline scripts).

- **`app/api/snapshot/route.ts:24-26` — `fs.writeFileSync` dans `public/snapshots/`.**
  - Ne fonctionne pas en serverless (FS read-only) ni en multi-instance.
  - **Fix** : stocker le JSON dans Redis (clé `snapshot:holders:latest`), Postgres (table `snapshots`), ou un blob storage.

---

## 🟠 Important

### Server vs Client

45 fichiers en `'use client'`. Plusieurs n'en ont pas besoin :

- **`app/page.tsx:1,9`** : `'use client'` + `usePaxgPrice()` dont le résultat n'est jamais utilisé. La home n'a aucun handler ni state. → **RSC** (gain LCP/SEO direct), retirer l'appel inutile.
- **`app/marketplace/real-estate/[id]/page.tsx`** : utilise `useParams()` côté client. → RSC avec `params: Promise<{ id: string }>`.
- **`app/marketplace/commodities/[name]/page.tsx`** : déjà sur `params: Promise<...>` + `use()`, mais marquée `'use client'` alors qu'on pourrait la garder RSC et descendre `'use client'` dans `<Exchange />`.
- **`app/dashboard/page.tsx`** : split en page RSC (shell) + `<DashboardClient />` (form + session), pour éviter de tout charger côté client.
- **`components/features/real-estate/HouseCard.tsx:1`** : `'use client'` sans aucun hook ni handler utile, plus `useRef`/`useRouter` importés inutilement.

**Règle** : `'use client'` ne se met **que sur les feuilles interactives**. La page reste RSC quand c'est possible.

### Fichiers spéciaux manquants

Aucun de :

- `app/error.tsx`
- `app/global-error.tsx`
- `app/not-found.tsx` (remplacerait `<div>House not found</div>` dans real-estate)
- `app/loading.tsx` ni segments `loading.tsx` (`app/marketplace/*/loading.tsx`)
- `app/sitemap.ts`, `app/robots.ts`

À créer.

### Metadata / SEO

- Le `RootLayout` définit une `metadata` statique unique → toutes les pages détail (real-estate, commodities, stock-etf, partners, etc.) ont le même `<title>`.
- Aucune page n'utilise `generateMetadata`. Pour les pages dynamiques :
  - `app/marketplace/real-estate/[id]/page.tsx` → titre, description, OG image à partir des données.
  - `app/marketplace/commodities/[name]/page.tsx` → idem.
- Aucune image OG dynamique (`opengraph-image.tsx` / `next/og`).
- Aucun `sitemap.ts` ni `robots.ts`.

### `next.config.ts` minimaliste

Manquent :

- `images.remotePatterns` (logos partenaires hébergés hors-Vercel)
- `output: 'standalone'` si déploiement Docker
- `experimental.typedRoutes: true` (typage `<Link href>`)
- `experimental.optimizePackageImports: ['lucide-react', 'react-icons']`

### Bundling / dépendances

- `package.json` : `"fs": "^0.0.1-security"` — **paquet bidon**, `fs` est natif Node. À retirer.
- Doublon : `"redis"` (v4) + `"ioredis"` (v5) ; on utilise ioredis. Retirer `redis`.
- Doublon icônes : `lucide-react` + `react-icons`. Choisir un seul.
- POC : `@solana/kit` + `@creit.tech/stellar-wallets-kit` pour `/poc-stellar` non utilisé → lourd, à retirer si POC terminé.
- ESLint config en `eslint-config-next@15.1.4` mais Next est en **16.1.4** — désaligné, à passer à `^16`.

---

## 🟡 React / Perf

### Re-renders & hooks

- **`context/TokenContexts.tsx`** : 6 `useEffect` séparés pour `localStorage.setItem`. Compactifier en un seul effet + JSON. Initial state via lazy init **provoque un mismatch d'hydratation** : `typeof window !== 'undefined'` = `false` au SSR, puis `true` après hydratation. **Fix** : initial state fixe + sync dans `useEffect`, ou `suppressHydrationWarning`.
- **`hooks/useTokenPrice.ts`** : appelle inconditionnellement 4 hooks de prix (PAXG, CMC20, deSPXA, marketplace) pour chaque symbol. Splitter en `useTGGPrice`, `useTMCPrice`, `useTSP500Price`, `useTFTPrice` et appeler à la racine du composant qui en a besoin.
- **`hooks/swapHandlers/useSwapHandlerByToken.ts:10-13`** : appelle 4 hooks à chaque render. Même problème, même fix : split.
- **`hooks/useSwap.ts:384-400`** : `useMemo` dépend de `zapMint, zapWithdraw, walletClient, publicClient` mais `performSwapMint`, `performSwapWithdraw`, `checkTokenBalance`, etc. **ne sont pas mémorisés** (recréés à chaque render). Le `useMemo` ne sert à rien : il retourne toujours un nouvel objet. **Fix** : `useCallback` sur chaque fonction (avec les deps correctes), ou factory pattern.
- **`hooks/useUserTokenAssets.ts:41-74`** : `for...of` séquentiel d'appels RPC `readContract` par token × chain. Remplacer par `publicClient.multicall({ contracts: [...] })` → 1 appel HTTP par chain au lieu de N.
- **`components/layout/LayoutWrapper.tsx:12`** : `usePrefetchStablePrices()` exécuté sur **toutes** les pages, même celles qui n'affichent aucun prix. À déplacer aux pages concernées (`marketplace/*`).

### LCP / Images

- `app/page.tsx:15` — image hero sans `priority` ni `sizes` ni `placeholder="blur"`. Probable LCP. **Fix** : `priority`, `sizes="100vw"`, `placeholder="blur"` avec un `blurDataURL`.
- `next.config.ts:4` définit `qualities` mais pas `remotePatterns` ni `formats: ['image/avif', 'image/webp']`.

### Suspense / streaming

- Aucun `<Suspense>` côté pages. Les blocs Wagmi loadent en blanc 1-2s. Wrapper les composants Wagmi dans `<Suspense fallback={<Skeleton />}>`.
- `useSearchParams` / `usePathname` ne sont jamais wrappés → en SSG cela force un opt-out CSR. Pas critique aujourd'hui (toutes les pages sont déjà client) mais bloquera la migration RSC.

---

## 🟢 Hygiène

### Code mort

- `app/marketplace/stock/page.tsx` retourne `<div>page</div>` — stub à supprimer ou implémenter.
- `app/dashboard/page.tsx:6` importe `ContextProvider` jamais utilisé.
- `components/features/real-estate/HouseCard.tsx:3,23` — `useRef` jamais lu ; `useRouter` importé mais inutilisé.
- `app/poc-stellar/page.tsx`, `app/buildingInProgress/page.tsx` — POC en prod. À déplacer derrière un flag ou retirer.
- Doublon : `next-auth.d.ts` à la racine ET `types/next-auth.d.ts` (référencé dans `tsconfig.json`).
- `ToDo.md` sans suivi.

### Duplication

- `hooks/useContracts.ts` : 3 fois la même structure (`useZAPContract`, `useZAPTMCContract`, `useZAPTSP500Contract`). Factoriser en une factory `createZapHook(abi, address)`.
- `hooks/swapHandlers/use*SwapHandler.ts` : 4 handlers quasi-identiques.
- `hooks/useSwap.ts` (TGG), `useTmcSwap.ts`, `useTsp500Swap.ts` : 3 × ~360 lignes du même flow KyberSwap. À factoriser dans `useZapSwap({ abi, contracts, decimals, conversionFn })`.

### TypeScript

- `: any` dans les API (`hasRequiredFields(data: any)`, `validateStatus(status: any)`) → Zod + types inférés.
- `createContext({ ... })` avec stubs vides : remplacer par `createContext<TokenCtx | null>(null)` + hook `useTokenCtx()` qui jette si null. Force le `TokenProvider` à wrap.
- `try { ... } catch (error) { throw error; }` partout dans `useSwap.ts` — bruit ; supprimer (le rethrow est déjà implicite).

### Web3

- `PUBLIC_CLIENTS` (`lib/clients.ts`) n'a pas de `batch: { multicall: true }` configuré sur les transports HTTP — à activer.
- Pas d'`@wagmi/cli` pour générer les types depuis les ABIs → maintenance manuelle des JSON.

### Boutons

La quasi-totalité des `<button>` n'ont pas `type="button"` explicite (BuyModal, DashBoard, dashboard/page.tsx) → submit accidentel possible si dans un `<form>`.

### Logs

23 `console.log/error/warn` dispersés. À remplacer par un logger centralisé (`lib/logger.ts`) env-conditionné.

---

## 📋 Plan de refacto (ordonné)

| # | Lot | Sévérité | Statut | Notes |
|---|---|---|---|---|
| 1 | Rate-limit + validation Zod sur toutes les routes API + atomicité tx/email | 🔴 | ✅ | `lib/ratelimit.ts` (ioredis + fallback) ; schémas Zod centralisés ; email via `after()` (Next 16) |
| 2 | Retirer `next/head` du NavBar, déplacer JSON-LD vers `next/script` ou Metadata | 🔴 | ✅ | Migré vers `next/script` (id + strategy=afterInteractive) |
| 3 | `app/api/snapshot/route.ts` : passer de `fs.writeFileSync` à Redis ou Blob | 🔴 | ✅ | Cache Redis `snapshot:holders:latest` + GET; readers via `/api/snapshot` |
| 4 | Throw au boot si `NEXTAUTH_SECRET` ou `DASHBOARD_PASSWORD` absents | 🔴 | ✅ | Throw au load de `lib/authOptions.ts` |
| 5 | Repasser pages en RSC (home, real-estate/[id], commodities/[name], dashboard) | 🟠 | ✅ | Toutes les pages ciblées sont RSC ; dashboard splittée en shell RSC + îlots client |
| 6 | Ajouter `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `sitemap.ts`, `robots.ts`, `opengraph-image` | 🟠 | ✅ | `opengraph-image` ajouté via next/og (edge) |
| 7 | `generateMetadata` dynamique sur pages détail | 🟠 | ✅ | Posé sur real-estate/[id] et commodities/[name] |
| 8 | Factoriser `useZAP*Contract`, swap handlers, `useTokenPrice`, `useSwap` (TGG/TMC/TSP500) | 🟡 | ⏳ | Dette, lisibilité |
| 9 | `useUserTokenAssets` → multicall ; déplacer `usePrefetchStablePrices` aux pages concernées | 🟡 | 🟡 | `PUBLIC_CLIENTS` configurés en `batch: { multicall: true }` ; reste à déplacer `usePrefetchStablePrices` |
| 10 | `useSwap` : `useCallback` + supprimer try/throw bruyants | 🟡 | ✅ | Appliqué aussi à `useTmcSwap`, `useTsp500Swap`, `useMarketplaceContract` (mêmes warnings exhaustive-deps) |
| 11 | LCP : `priority`/`sizes`/`blurDataURL` sur la hero ; AVIF dans `next.config.ts` | 🟡 | 🟡 | `priority` + `sizes` posés ; AVIF + WebP configurés ; `blurDataURL` à faire |
| 12 | `<Suspense>` autour des blocs Wagmi | 🟡 | ⏳ | UX streaming |
| 13 | Aligner ESLint 16 ; retirer `fs`, dédup `redis`/`ioredis`, choisir un set d'icônes | 🟢 | ✅ | `redis` retiré ; `react-icons` retiré (lucide-react choisi) ; `fs` déjà retiré |
| 14 | `next.config.ts` : `typedRoutes`, `optimizePackageImports`, `remotePatterns`, `output: 'standalone'` si Docker | 🟢 | 🟡 | `typedRoutes`, `optimizePackageImports`, `formats` ajoutés ; `remotePatterns` à compléter quand on connaît les hosts |
| 15 | Nettoyage : code mort, doublons `.d.ts`, POC, `ToDo.md`, logs `console.*` | 🟢 | 🟡 | HouseCard nettoyé ; poc-stellar, buildingInProgress, ToDo.md et logs restants |
| 16 | Refacto `TokenContexts` (1 effet, `createContext<T \| null>`, hook guard) + mismatch hydration | 🟢 | ⏳ | Qualité |
| 17 | `type="button"` partout, `@wagmi/cli`, logger central | 🟢 | ⏳ | Qualité (HouseCard fait) |

Légende : ✅ done · 🟡 partiel · ⏳ à faire
