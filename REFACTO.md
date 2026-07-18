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

### Produit / UX

- **Textes « Buy, Sell » résiduels dans tout le parcours trading** alors que ces features ont été
  retirées pour conformité EU.
  - `app/marketplace/stock-etf/tmc/page.tsx:28`
  - `app/marketplace/stock-etf/tsp500/page.tsx:28`
  - `app/marketplace/commodities/[name]/page.tsx:119` + **metadata SEO** `:69` (« buy, sell or swap »)
  - L'UI ne propose qu'un onglet *Swap* → promesse non tenue, et le SEO indexe « buy/sell » que la
    conformité voulait retirer. **Fix** : « Swap {name} » partout + régénérer les descriptions.

- **Aucun garde-fou « solde insuffisant » avant le swap.**
  - `components/features/commodities/Swap.tsx:201-202,333-337` : le bouton n'est grisé que sur
    prix/réseau/pending, jamais sur le solde.
  - L'échec n'arrive qu'à l'exécution (`hooks/useZapSwap.ts:253-257,321-325`) sous forme d'`Error`
    brute multi-lignes (`Insufficient balance.\nRequired:…`) poussée telle quelle dans `notify.error`.
  - **Fix** : comparer le montant au solde côté UI, désactiver le bouton avec label « Insufficient
    balance », ajouter un bouton **MAX**, nettoyer le message d'erreur.

- **Pas de toast de succès sur le swap EVM.** `Swap.tsx:83-85` gère l'erreur mais aucun
  `notify.success` ; le seul retour est un hash tronqué discret. Le POC Stellar, lui, a un bloc vert
  « Purchase confirmed ». **Fix** : toast de succès + lien explorer. Aligner le feedback du Swap EVM
  sur la qualité du POC est le gain le plus rentable.

- ~~**Bouton « Properties » mort** — `app/marketplace/real-estate/page.tsx:17-19` : `<button>` sans
  `onClick`/`Link` → impression de site cassé.~~ ✅ Remplacé par une ancre `<a href="#properties">`
  qui défile vers la grille (`id="properties"` + `scroll-mt-24`), sans quitter le Server Component.

- ~~**Portfolio : aucun état « wallet non connecté ».** `app/user/dashboard/page.tsx` +
  `hooks/useUserTokenAssets.ts:119` : query désactivée sans `address` → affiche « No assets found »
  au lieu de « Connectez votre wallet ».~~ ✅ La page détecte `!isConnected` (`useAccount`) et affiche
  « Connect your wallet to see your portfolio. » + `<ConnectButton />` ; la valeur totale (« $0 »
  trompeur) est masquée tant que le wallet n'est pas connecté.

### Sécurité

- **Login admin sans rate-limit** (`app/api/auth/[...nextauth]`, `lib/authOptions.ts:22-28`) : mot de
  passe unique global, aucun lockout, brute-force illimité (seules `emails` et `cmc` ont un
  rate-limit). **Fix** : envelopper `authorize` avec `rateLimit()` (ex. 5/min/IP).

- **Comparaison de mot de passe non constant-time** (`lib/authOptions.ts:24`, `===`) → sensible au
  timing. **Fix** : `crypto.timingSafeEqual`.

### Config contrats

- **Commentaire mensonger sur les adresses TSG** (`contracts/contracts.ts:40-48`) : « placeholders
  0x0 à remplacer au lancement » au-dessus d'adresses **réelles et déployées** (vérifiées on-chain le
  18/07). Pas de risque de fonds, mais dette de doc dangereuse. **Règle** : jamais un commentaire
  « 0x0 placeholder » au-dessus d'une adresse non-nulle.

- **TSP500 / ZAP_TSP500 marqués `// TODO: replace with deployed address`** (`contracts.ts:17-18`,
  `config/token.ts:68`) mais **câblés en prod** dans `useTsp500Swap` → swap réel. **Fix** : vérifier
  on-chain (comme TSG l'a été) ; gater si non déployé, retirer le TODO sinon.

---

## 🟠 Important

### Produit / UX

- **Skeleton incohérent** : `components/features/commodities/ExchangeSkeleton.tsx:6-10` affiche
  3 onglets, mais `Exchange.tsx:24-28` n'en a plus qu'un → flash + layout shift.
- **Double chargement** : skeleton puis texte brut « Loading… » (`Exchange.tsx:31-35`).
- **Prix indisponible = bouton bloqué en silence** (`Swap.tsx:201-202`) : si `useTokenPrice` échoue,
  bouton grisé indéfiniment sans explication ni retry.
- **Quote muet sous 0.01** (`hooks/useSwapQuote.ts:39`, `enabled=false`) : « 0 » en sortie sans
  message « montant minimum 0.01 ».
- **POC Stellar** : pas de vérification du solde USDC avant l'achat (`app/poc-stellar/page.tsx:49-50`),
  solde de paiement non affiché → échec on-chain après signature.
- **Input plafonné à 8 caractères** (`components/shared/TokenInput.tsx:29`) : blocage silencieux
  au-delà de 7 chiffres.

### Code / SRP

- **`useSwapQuote.ts` — SRP violé + copier-coller TSG.** `queryFn` de ~155 lignes (`:126-281`) avec
  4 branches ; la branche TSG (`:179-229`) est quasi identique caractère pour caractère à la branche
  TGG (`:130-177`). **Fix** : extraire `computeZapQuote({ getRoute, getConversion, underlying,
  underlyingDecimals })` : ~290 → ~120 lignes. Bonus : le hook monte `useSwap()` **et** `useTsgSwap()`
  inconditionnellement (`:111-112`) même pour un quote TMC.

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
- `SwapQuoteParams` déclaré deux fois (`Swap.tsx:26` + `useSwapQuote.ts:22`).
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

| # | Lot | Sévérité | Statut | Notes |
|---|---|---|---|---|
| 1 | Retirer les textes « Buy, Sell » (UI + metadata SEO) | 🔴 | ✅ | « Swap {name} » sur tmc/tsp500/commodities + description SEO régénérée ; langage légal (terms-of-service) conservé |
| 2 | Rate-limit + comparaison constant-time sur login admin | 🔴 | ⏳ | `authOptions.ts` + `ratelimit.ts` |
| 3 | Corriger commentaire TSG + vérifier déploiement TSP500 (gater si besoin) | 🔴 | ⏳ | `contracts.ts`, `token.ts` |
| 4 | Garde-fou solde insuffisant + bouton MAX + toast succès (Swap EVM) | 🔴 | ✅ | Garde-fou solde + labels « Insufficient {token} balance » / « Enter an amount » (`Swap.tsx`) ; toast de succès + lien explorer à la confirmation (`notify.success` accepte un ReactNode). MAX déjà présent (`TradeWidget`) ; erreur brute déjà normalisée par `parseError` |
| 5 | Bouton « Properties » mort + état wallet non connecté (portfolio) | 🔴 | 🟡 | Bouton « Properties » corrigé (ancre `#properties` + `scroll-mt-24`, `real-estate/page.tsx`) ; état wallet non connecté (`user/dashboard`) reste à faire |
| 6 | Supprimer hooks morts `useZapTmcFees`/`useZapTsp500Fees` (bug 100×) | 🟠 | ⏳ | `useTmcSwap.ts`, `useTsp500Swap.ts` |
| 7 | Factoriser la branche quote TSG↔TGG (`computeZapQuote`) | 🟠 | ⏳ | `useSwapQuote.ts` ~290→~120 |
| 8 | Rate-limit atomique (Lua) + garantie Redis en prod | 🟠 | ⏳ | `ratelimit.ts`, `redis.ts` |
| 9 | Rate-limit + anti-stampede + whitelist IDs sur routes APIs payantes | 🟠 | ⏳ | `cmc`, `cmc20/*`, `commodities/*` |
| 10 | Source unique pour les adresses de contrats | 🟠 | ⏳ | `contracts.ts` ⟷ `token.ts` |
| 11 | Skeleton/loader cohérents + états prix/quote indisponibles | 🟠 | ⏳ | `ExchangeSkeleton`, `Exchange`, `Swap` |
| 12 | Précision `parseUnits` + constante troy-ounce partagée | 🟡 | ⏳ | `useTsgSwap.ts`, `constants.ts` |
| 13 | Headers de sécurité / CSP / X-Frame-Options | 🟢 | ⏳ | `next.config.ts` ou `middleware.ts` |
| 14 | A11y (labels, aria) + i18n EN + micro-copy | 🟢 | ⏳ | `TokenInput`, `DistributeFromWallet`, etc. |
| 15 | Socle de tests (compute*WithdrawAmount, schémas Zod, ratelimit) | 🟠 | ⏳ | aucun test aujourd'hui |
| 16 | Nettoyage : `@wagmi/cli`, aggregators dupliqués, scories `snapshot.ts` | 🟢 | ⏳ | dette basse |

Légende : ✅ done · 🟡 partiel · ⏳ à faire
