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
| 8 | Factoriser `useZAP*Contract`, swap handlers, `useTokenPrice`, `useSwap` (TGG/TMC/TSP500) | 🟡 | ✅ | `useZapHook`, `useZapSwapHandler`, `useZapSwap` ; `useTokenPrice` splitté en 4 hooks dédiés (1033→567 lignes côté swap) |
| 9 | `useUserTokenAssets` → multicall ; déplacer `usePrefetchStablePrices` aux pages concernées | 🟡 | ✅ | `PUBLIC_CLIENTS` en `batch: { multicall: true }` ; `usePrefetchStablePrices` retiré (Exchange déclenche déjà la query sur les pages concernées) — **maj 2026-05-25 : `useUserTokenAssets` réécrit en `client.multicall()` réel (le batch config seul ne suffisait pas, cf. revue)** |
| 10 | `useSwap` : `useCallback` + supprimer try/throw bruyants | 🟡 | ✅ | Appliqué aussi à `useTmcSwap`, `useTsp500Swap`, `useMarketplaceContract` (mêmes warnings exhaustive-deps) |
| 11 | LCP : `priority`/`sizes`/`blurDataURL` sur la hero ; AVIF dans `next.config.ts` | 🟡 | ✅ | `priority` + `sizes` + `blurDataURL` (sharp 10px blur inline) ; AVIF + WebP configurés |
| 12 | `<Suspense>` autour des blocs Wagmi | 🟡 | ✅ | `Exchange` chargé via `next/dynamic({ ssr:false, loading: ExchangeSkeleton })` sur les 4 pages marketplace |
| 13 | Aligner ESLint 16 ; retirer `fs`, dédup `redis`/`ioredis`, choisir un set d'icônes | 🟢 | ✅ | `redis` retiré ; `react-icons` retiré (lucide-react choisi) ; `fs` déjà retiré |
| 14 | `next.config.ts` : `typedRoutes`, `optimizePackageImports`, `remotePatterns`, `output: 'standalone'` si Docker | 🟢 | 🟡 | `typedRoutes`, `optimizePackageImports`, `formats` ajoutés ; `remotePatterns` à compléter quand on connaît les hosts |
| 15 | Nettoyage : code mort, doublons `.d.ts`, POC, `ToDo.md`, logs `console.*` | 🟢 | ✅ | HouseCard nettoyé ; 32 `console.*` migrés sur logger ; `ToDo.md` supprimé ; POC sortis des index SEO (noindex + robots disallow) |
| 16 | Refacto `TokenContexts` (1 effet, `createContext<T \| null>`, hook guard) + mismatch hydration | 🟢 | ✅ | Reconstruit sur `useSyncExternalStore` ; même fix appliqué à `UserForm` (anti-pattern jumeau) |
| 17 | `type="button"` partout, `@wagmi/cli`, logger central | 🟢 | 🟡 | `lib/logger.ts` (leveled, scoped, env-aware) ; `type="button"` sweep (79 boutons) ; reste `@wagmi/cli` |

Légende : ✅ done · 🟡 partiel · ⏳ à faire

---

## 💬 Revue de la branche (2026-05-23)

Revue indépendante de la branche `refacto` (76 commits atomiques, ~5k+ / 3.3k− sur 114 fichiers).

### Vue d'ensemble

Refacto sérieux, structuré, discipliné. La méthode (plan → lots → `docs(REFACTO): mark lot X done` après chaque lot) est exemplaire pour un chantier de cette taille. Commits conventionnels (`feat/fix/refactor/perf/chore/docs`), scopés, courts — facile à reviewer. Lint passe (0 erreur, 44 warnings résiduels).

### Ce qui est vraiment bien

**Sécurité — solide**
- `lib/authOptions.ts` : fallbacks en dur supprimés, throw au boot si l'env manque. C'était critique.
- `lib/ratelimit.ts` : Redis primaire + fallback in-memory LRU (5k entrées), headers `X-RateLimit-*` + `Retry-After`. Pas de dépendance Upstash, autonome.
- `lib/schemas/transactions.ts` : Zod centralisé, `discriminatedUnion` sur `paymentMethod` pour Sell (élégant), `preprocess` pour rester rétro-compatible. Les `: any` ont disparu des routes.
- Atomicité tx/email via `after()` : l'email part en post-traitement, l'erreur Resend ne fait plus échouer une transaction déjà persistée. Vrai bug, pas seulement de l'hygiène.
- `/api/snapshot` : `fs.writeFileSync` → Redis. Indispensable serverless / multi-instance.

**Architecture App Router — propre**
- NavBar : `next/head` → `next/script` avec `id` + `strategy="afterInteractive"`. Le JSON-LD sortira enfin dans le HTML.
- RSC : home, `real-estate/[id]`, `commodities/[name]`, `dashboard` repassées en serveur. Dashboard splittée en page RSC + îlots client (`DashboardLogin`, `SignOutButton`).
- Tous les fichiers spéciaux présents : `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`.
- `generateMetadata` dynamique sur les pages détail avec `params: Promise<{...}>` (signature Next 15).

**Perf / React — gros gain**
- `useZapSwap` : factory qui collapse `useSwap` (TGG) + `useTmcSwap` + `useTsp500Swap` — `useSwap.ts` passe de 427 à 33 lignes. Pareil pour `useContracts` (3 `useZAP*Contract` → un seul `useZapHook`).
- `useTokenPrice` splitté en 4 hooks dédiés : un composant n'appelle plus 4 hooks de prix pour en utiliser 1.
- `TokenContexts` reconstruit sur **`useSyncExternalStore`** avec store module-level et `getServerSnapshot()` stable. Idiome React 19, tue le mismatch d'hydratation des `typeof window !== 'undefined'`.
- Anti-pattern setState-in-useEffect retiré dans `Buy`, `Sell`, `Swap`, `TradeWidget`, `useAutoSwitchNetwork`, `useSwapQuote`, `usePaxgPerformance`, `UserForm` — dérivation pendant le render.
- `useCallback` mis sur les helpers de `useSwap`, `useTmcSwap`, `useTsp500Swap`, `useMarketplaceContract`. Le `useMemo` qui retournait un objet neuf à chaque render n'a plus aucun sens dans l'ancien code, c'est corrigé.
- `Exchange` chargé via `next/dynamic({ ssr: false, loading: ExchangeSkeleton })` sur les 4 pages marketplace — retire le flash Wagmi et allège le bundle initial.
- `PUBLIC_CLIENTS` : `batch: { multicall: true }` + `http({ batch: { batchSize: 1000, wait: 16 } })` partout.

**Hygiène**
- `fs` (paquet bidon), `redis` (doublon ioredis), `react-icons` (lucide-react choisi) — tous retirés.
- Logger central `lib/logger.ts` (leveled, scoped, env-aware) + migration de tous les `console.*` (il n'en reste 2 dans `error.tsx`/`global-error.tsx`, ce qui est l'idiome Next).
- `type="button"` sweep sur 79 boutons.
- POC (`poc-stellar`, `buildingInProgress`) sortis des index via `robots.ts` + meta `noindex`.

### Ce qui mérite un coup d'œil

**🟠 `useUserTokenAssets` — le multicall est seulement à moitié fait**

`hooks/useUserTokenAssets.ts:26-57` : la boucle est toujours `for...of` séquentielle avec `await` à chaque itération.

```ts
for (const token of cryptos) {
  for (const [chainStr, tokenAddr] of Object.entries(token.addresses)) {
    ...
    const raw = await client.readContract({ ... });  // ← séquentiel
  }
}
```

`batch: { multicall: true }` sur le client **ne batche que les appels émis dans le même tick d'event loop**. Comme chaque `await` résout avant de lancer le suivant, viem ne voit jamais 2 reads simultanés — donc pas de multicall.

Fix recommandé (lot 9) :
```ts
publicClient.multicall({ contracts: [{ address, abi, functionName: 'balanceOf', args }, ...] })
```
ou au moins un `Promise.all` sur des `readContract()` non-attendus. Aujourd'hui, ça reste N appels HTTP par chain × token. Le statut ✅ du lot 9 est trompeur sur cet aspect.

> ✅ **Corrigé** (`perf(useUserTokenAssets): batch balances via multicall`) — les appels `balanceOf` sont groupés par chain et émis via `client.multicall({ allowFailure: true })` : 1 round-trip par chain au lieu de N. Résultats agrégés en ordre déterministe (`Promise.all` + `flat()`).

**🟠 `Buy.tsx` n'utilise pas les hooks splittés**

`components/features/commodities/Buy.tsx:42-44` appelle encore `usePaxgPrice()`, `useCmc20Price()`, `useDeSPXAPrice()` **tous les trois** à chaque render, alors qu'on a maintenant `useTGGPrice/useTMCPrice/useTSP500Price` qui font exactement ça mais ciblé. Le bénéfice du lot 8 (split `useTokenPrice`) ne s'applique pas à ce composant — à vérifier dans `Sell.tsx` et `Swap.tsx` qui ont peut-être le même problème.

Bonus : `useEffect(() => { ... setInterval(updatePrice, 30000) ... })` dans le même fichier — inutile, les TanStack Query en dessous gèrent déjà leur propre `refetchInterval`. C'est un mirror state (`tggPrice` en `useState`) qui survit au refacto alors qu'on pourrait juste dériver pendant le render.

> ✅ **Corrigé / nuancé** (`perf(price-feeds): gate by active token`) — vérification faite : `Swap.tsx` utilisait déjà le dispatcher `useTokenPrice(token.symbol)`, seuls `Buy`/`Sell` appelaient les 3 feeds en direct. Le vrai problème n'était pas le passage par le dispatcher (rules-of-hooks impose d'appeler tous les hooks de toute façon) mais l'absence de gating : les 3 feeds HTTP partaient sur chaque page. Ajout d'un `{ enabled }` optionnel sur `usePaxgPrice`/`useCmc20Price`/`useDeSPXAPrice`, threadé dans les hooks dédiés et le dispatcher, + gating des appels directs de `Buy`/`Sell` → seul le feed du token actif tire le réseau. Les 2 `isLoading` morts de `Buy` sont retirés. Le `setInterval` de `Buy` reste à nettoyer (mirror state non-bloquant).

**🟡 44 warnings ESLint résiduels**

Surtout des imports inutilisés (`Link`, `Skeleton`, `FrenchTacosDetails`, `QuadIcon`) et 2 `react-hooks/exhaustive-deps` (`TacosCard`, `PopularTFTCard` — `getMarketplaceBalance` manquant dans les deps de `useEffect`). Aucune règle n'a été silenced, c'est de la dette propre à finir.

**🟡 Lots partiels assumés**

Bien marqués 🟡 dans le tableau, pas un reproche, juste à finir :
- `next.config.ts` : `remotePatterns` pas listés.
- `output: 'standalone'` pas ajouté (OK si pas de Docker).
- `@wagmi/cli` pas mis en place — les ABIs JSON restent typés en `as Abi` au point d'appel.

**🟢 Détails**

- `useZapSwap.ts:316` : `BigInt((parseFloat(params.amount) * Math.pow(10, 18)).toString())` — la conversion float→BigInt via `* 10^18` perd des chiffres sur les grosses valeurs (précision IEEE-754). `parseUnits(params.amount, 18)` ferait pareil sans le détour float. Bug latent hérité de l'ancien code, pas introduit par le refacto, mais visible maintenant qu'il est centralisé.
- `lib/ratelimit.ts:39-41` : éviction LRU naïve (drop la première clé d'insertion). Suffisant comme fallback dégradé, mais une entrée chaude peut se faire évincer.
- `BuyTxSchema` accepte `crypto` comme string libre `min(1).max(10)` — pas de whitelist `z.enum(['TGG', 'TMC', ...])`. Idem pour `blockchain` / `fiat`. Le validateur Zod ne ferme pas complètement la porte ; les valeurs métier sont contrôlées en aval mais une enum serait plus stricte.

### Verdict

Très bon travail. La discipline (plan → lots → status) est exemplaire et la quasi-totalité des findings critiques et importants sont vraiment traités, pas juste cochés. Les 2 vrais points à reprendre avant de merger :

1. **`useUserTokenAssets`** — faire le vrai multicall (ou `Promise.all`) pour réellement gagner le RTT.
2. **`Buy`/`Sell`/`Swap`** — basculer sur les hooks de prix dédiés, sinon le split de `useTokenPrice` n'a aucun effet sur les pages qui l'utilisaient déjà via les hooks bas niveau.

Le reste (lint warnings, `@wagmi/cli`, `remotePatterns`) peut suivre dans des PR de finition.

---

## ✅ Suivi post-revue (2026-05-25)

Les 2 bloqueurs du verdict sont traités (détails inline ci-dessus) :

| Point | Commit | État |
|---|---|---|
| `useUserTokenAssets` → vrai multicall | `perf(useUserTokenAssets): batch balances via multicall` | ✅ |
| Gating des feeds de prix par token actif (Buy/Sell + dispatcher) | `perf(price-feeds): gate PAXG/CMC20/deSPXA queries by active token` | ✅ |

Reste à faire (non bloquant) :

- **Read on-chain TFT non gaté** : le dispatcher `useTokenPrice` appelle toujours `useTFTPrice()` (read `getTokenInfo` via `useMarketplaceContract`) sur toutes les pages. Gating hors-scope car `useMarketplaceContract` est un hook partagé qui sert aussi aux transactions — à traiter séparément si besoin.
- **`Buy.tsx` `setInterval(updatePrice, 30000)`** : mirror state à supprimer au profit d'un `useMemo` (comme `Sell.tsx` le fait déjà).
- **Warnings ESLint** (42 restants) : imports/vars inutilisés + 2 `exhaustive-deps`.
- **Lots 14 / 17 partiels** : `remotePatterns`, `output: 'standalone'` (si Docker), `@wagmi/cli`.
- **`useZapSwap.ts:316`** : conversion float→BigInt à remplacer par `parseUnits`.
- **Schémas Zod** : `crypto`/`blockchain`/`fiat` en `z.enum(...)` plutôt que string libre.
