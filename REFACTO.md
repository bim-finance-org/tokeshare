# Audit Tokeshare — 2026-07-18

Audit indépendant de l'état actuel de `master` (post-retrait buy/sell, ajout TSG, POC Stellar).
Remplace l'audit précédent de la branche `refacto` (mai 2026), dont les lots critiques/importants ont été traités et mergés.

## État de départ

Sain. `0` erreur ESLint (10 warnings mineurs), `0` `any` dans le code, TypeScript strict.
Buy/Sell retiré proprement (aucune route ni composant zombie). La couche d'**exécution** de swap
est bien factorisée : `useSwap`/`useTsgSwap`/`useTmcSwap`/`useTsp500Swap` (32–65 lignes) délèguent
tous à `useZapSwap`.

**Manque structurel n°1** : aucun test dans le projet (pas de script `test`, aucun fichier
`.test`/`.spec`). Pour une app qui manipule des paiements on-chain, c'est la dette la plus lourde.

---

## 🔴 Critique / Haut impact

## 🟠 Important

### Produit / UX

- ~~**Skeleton incohérent** : `ExchangeSkeleton` affiche 3 onglets, mais le widget n'en a plus
  qu'un.~~ ✅ Skeleton à un seul onglet.
- ~~**Double chargement** : skeleton puis texte brut « Loading… ».~~ ✅ `SwapFormSkeleton` partagé
  entre la frontière lazy et l'état de chargement d'`Exchange`.
- ~~**Prix indisponible = bouton bloqué en silence** (`Swap.tsx`) : si `useTokenPrice` échoue, bouton
  grisé sans explication.~~ ✅ Alerte « Price unavailable » + bouton Retry (`isError`/`refetch`
  remontés dans les hooks de prix).
- ~~**Quote muet sous 0.01** (`useSwapQuote.ts`) : « 0 » en sortie sans message.~~ ✅ Label bouton
  « Minimum 0.01 {token} » + désactivation (seuil exporté).
- ~~**POC Stellar** : pas de vérification du solde USDC avant l'achat.~~ ✅ Solde USDC affiché +
  garde-fou « Not enough USDC ».
- ~~**Input plafonné à 8 caractères** (`TokenInput.tsx`).~~ ✅ `maxLength` 8 → 12 + `inputMode=decimal`.

### Code / SRP

- ~~**`useSwapQuote.ts` — SRP violé + copier-coller TSG.** `queryFn` de ~155 lignes avec 4 branches ;
  TSG quasi identique à TGG.~~ ✅ Pattern stratégie (`hooks/swapQuote/`) : `computeZapQuote()` partagé
  paramétré par `ZapQuoteConfig`, `computeTftQuote()`, registre `useQuoteStrategies()`. `useSwapQuote`
  passe de **290 → 83 lignes**, plus aucun `if`. Comportement préservé (mêmes calculs/précisions/clé
  de query). Le montage inconditionnel de `useSwap()`+`useTsgSwap()` reste (Rules of Hooks) mais isolé
  dans `useQuoteStrategies`.

- **Hooks morts avec bug de scaling latent.** `useZapTmcFees`/`useZapTsp500Fees`
  (`hooks/useTmcSwap.ts:12-40`, `hooks/useTsp500Swap.ts:12-40`) : zéro consommateur, 28 lignes
  dupliquées, et divisent le fee par **100** alors que `useZapSwap.getZapFees` divise par **10000** —
  100× d'écart sur le même champ on-chain. **Fix** : supprimer.

- **Adresses de contrats dupliquées** entre `contracts/contracts.ts` et `config/token.ts` (TGG, TSG,
  TMC, TSP500, TFT…). Divergence silencieuse déjà visible (double TODO TSP500). **Fix** : une seule
  source de vérité.

### Sécurité / backend

- **Rate-limit Redis non atomique** (`lib/ratelimit.ts:56-71`) : `INCR` puis `EXPIRE` séparés → si
  l'`EXPIRE` échoue, clé sans TTL = IP bloquée à vie. **Fix** : script Lua / pipeline.
- **Fallback rate-limit inefficace en serverless** : `memoryStore` par-instance → limite réelle =
  limit × nb d'instances ; éviction par ordre d'insertion (un attaquant peut évincer son propre
  limiteur).
- **Routes vers APIs payantes sans rate-limit** (`cmc20/*`, `exchange-rates`, `tsp500/price`,
  `commodities/*`) : protégées uniquement par le cache → cache stampede à l'expiration (N requêtes =
  N appels payants), pas de single-flight.
- **Cache-busting `/api/cmc`** (`app/api/cmc/route.ts:21-28`) : IDs non normalisés/whitelistés →
  `1,2` vs `2,1` créent des clés distinctes, contournent le cache, consomment le quota CMC.
- **Fuite d'infos dans les erreurs** : `details: error.message` renvoyé au client (`cmc`, `cmc20`,
  `tsp500`, `commodities/*performance` propage même `Body: …` de l'API amont).

---

## 🟡 Perf / précision

- **Précision float→fixed-point** dans `computeTsgWithdrawAmount` (`hooks/useTsgSwap.ts`) :
  `parseFloat(amount) * 10 ** 9`. **Fix** : `parseUnits` (même classe de bug que celle notée dans
  l'audit précédent pour `useZapSwap`).
- **Constante troy-ounce définie 3 fois, 2 échelles** : `constants/constants.ts:7` (`31.1034768`),
  `hooks/useSwap.ts:9` et `hooks/useTsgSwap.ts:9` (`31_103_476_800`). `computeTggWithdrawAmount` et
  `computeTsgWithdrawAmount` sont identiques à la constante près. **Fix** : constante partagée +
  `computeGoldLikeWithdrawAmount(amount, fee, scaled)`.

---

## 🟢 Hygiène

- **Aucun header de sécurité / CSP / `X-Frame-Options`** (dashboard admin embeddable en iframe →
  clickjacking). Pas de `headers()` dans `next.config.ts` ni `middleware.ts`.
- **Modèle Prisma `Emails`** (`prisma/schema.prisma:11-13`) : email (PII) en clé primaire, pas de
  `createdAt`/consentement/désinscription. (Bon point : réponse toujours `success` sur doublon → pas
  d'énumération.)
- **`snapshot` POST** (`app/api/snapshot/route.ts`) : bien auth-gated, mais scan Base coûteux
  (`maxDuration=300`) sans rate-limit ni verrou « un à la fois ».
- `BASE_TRUSTED_AGGREGATORS` == `TRUSTED_AGGREGATORS` (`contracts/contracts.ts:60-66`, valeurs
  identiques, l'un non utilisé).
- `isTggFirst` (`Swap.tsx`) pilote désormais tous les tokens → renommer `isTokenFirst`.
- ~~`SwapQuoteParams` déclaré deux fois (`Swap.tsx:26` + `useSwapQuote.ts:22`).~~ ✅ Centralisé dans
  `hooks/swapQuote/types.ts`, importé partout.
- `lib/snapshot.ts` : en-tête `// scripts/snapshot.ts` erroné, `ERC20_ABI` redéfini inline, RPC
  hardcodé `base.publicnode.com`, adresses dupliquées.
- 4 casts `as Abi` résiduels (`useContracts.ts:35,57`, `useZapSwap.ts:142,147`) → `@wagmi/cli`.

### Accessibilité / i18n / micro-copy

- `components/shared/TokenInput.tsx:22-31` : label non associé à l'`<input>` (pas de
  `htmlFor`/`aria-label`) ; bouton switch de direction (`Swap.tsx:210`) sans `aria-label`.
- `components/shared/CryptoBalance.tsx:25` : « Balance: 0 » quand déconnecté (trompeur) → « — ».
- i18n FR/EN mélangé côté admin : `components/features/dashboard/DistributeFromWallet.tsx:57,79,126`,
  `app/dashboard/DashboardLogin.tsx:55`.
- `app/marketplace/other/page.tsx:8` : « Invest in **others** assets » → « other assets » ; page au
  pluriel mais une seule carte.
- `components/features/user/dashboard/AssetCard.tsx:29` : `href={… ?? '#'}` (lien mort si pas d'URL).
- `components/features/real-estate/HouseCard.tsx:94-103` : « Learn More » grisé sans dire pourquoi
  (« Coming soon »).

---

## 📋 Plan de refacto (ordonné par ROI)

| #   | Lot                                                                      | Sévérité | Statut | Notes                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------ | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Retirer les textes « Buy, Sell » (UI + metadata SEO)                     | 🔴       | ✅     | « Swap {name} » sur tmc/tsp500/commodities + description SEO régénérée ; langage légal (terms-of-service) conservé                                                                                                                                                         |
| 2   | Rate-limit + comparaison constant-time sur login admin                   | 🔴       | ✅     | Rate-limit 5/min/IP dans `authorize` + `passwordMatches()` (SHA-256 → `timingSafeEqual`)                                                                                                                                                                                   |
| 3   | Corriger commentaire TSG + vérifier déploiement TSP500 (gater si besoin) | 🔴       | ✅     | Commentaires TSG corrigés (`contracts.ts`, `useContracts.ts`) ; TODO TSP500/ZAP_TSP500 retirés (déjà câblés en prod, confirmé)                                                                                                                                             |
| 4   | Garde-fou solde insuffisant + bouton MAX + toast succès (Swap EVM)       | 🔴       | ✅     | Garde-fou solde + labels « Insufficient {token} balance » / « Enter an amount » (`Swap.tsx`) ; toast de succès + lien explorer à la confirmation (`notify.success` accepte un ReactNode). MAX déjà présent (`TradeWidget`) ; erreur brute déjà normalisée par `parseError` |
| 5   | Bouton « Properties » mort + état wallet non connecté (portfolio)        | 🔴       | 🟡     | Bouton « Properties » corrigé (ancre `#properties` + `scroll-mt-24`, `real-estate/page.tsx`) ; état wallet non connecté (`user/dashboard`) reste à faire                                                                                                                   |
| 6   | Supprimer hooks morts `useZapTmcFees`/`useZapTsp500Fees` (bug 100×)      | 🟠       | ⏳     | `useTmcSwap.ts`, `useTsp500Swap.ts`                                                                                                                                                                                                                                        |
| 7   | Factoriser la branche quote TSG↔TGG (`computeZapQuote`)                  | 🟠       | ✅     | Pattern stratégie (`hooks/swapQuote/`), `useSwapQuote` 290→83, comportement préservé + dedup `SwapQuoteParams`                                                                                                                                                             |
| 8   | Rate-limit atomique (Lua) + garantie Redis en prod                       | 🟠       | ⏳     | `ratelimit.ts`, `redis.ts`                                                                                                                                                                                                                                                 |
| 9   | Rate-limit + anti-stampede + whitelist IDs sur routes APIs payantes      | 🟠       | ⏳     | `cmc`, `cmc20/*`, `commodities/*`                                                                                                                                                                                                                                          |
| 10  | Source unique pour les adresses de contrats                              | 🟠       | ⏳     | `contracts.ts` ⟷ `token.ts`                                                                                                                                                                                                                                                |
| 11  | Skeleton/loader cohérents + états prix/quote indisponibles               | 🟠       | ⏳     | `ExchangeSkeleton`, `Exchange`, `Swap`                                                                                                                                                                                                                                     |
| 12  | Précision `parseUnits` + constante troy-ounce partagée                   | 🟡       | ⏳     | `useTsgSwap.ts`, `constants.ts`                                                                                                                                                                                                                                            |
| 13  | Headers de sécurité / CSP / X-Frame-Options                              | 🟢       | ⏳     | `next.config.ts` ou `middleware.ts`                                                                                                                                                                                                                                        |
| 14  | A11y (labels, aria) + i18n EN + micro-copy                               | 🟢       | ⏳     | `TokenInput`, `DistributeFromWallet`, etc.                                                                                                                                                                                                                                 |
| 15  | Socle de tests (compute\*WithdrawAmount, schémas Zod, ratelimit)         | 🟠       | ⏳     | aucun test aujourd'hui                                                                                                                                                                                                                                                     |
| 16  | Nettoyage : `@wagmi/cli`, aggregators dupliqués, scories `snapshot.ts`   | 🟢       | ⏳     | dette basse                                                                                                                                                                                                                                                                |

Légende : ✅ done · 🟡 partiel · ⏳ à faire
