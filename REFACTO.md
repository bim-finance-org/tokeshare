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

## 🟢 Hygiène

- **Aucun header de sécurité / CSP / `X-Frame-Options`** (dashboard admin embeddable en iframe →
  clickjacking). Pas de `headers()` dans `next.config.ts` ni `middleware.ts`.
- **Modèle Prisma `Emails`** (`prisma/schema.prisma:11-13`) : email (PII) en clé primaire, pas de
  `createdAt`/consentement/désinscription. (Bon point : réponse toujours `success` sur doublon → pas
  d'énumération.)
- **`snapshot` POST** (`app/api/snapshot/route.ts`) : bien auth-gated, mais scan Base coûteux
  (`maxDuration=300`) sans rate-limit ni verrou « un à la fois ».
- ~~`BASE_TRUSTED_AGGREGATORS` == `TRUSTED_AGGREGATORS` (valeurs identiques, l'un non utilisé).~~
  ✅ `BASE_TRUSTED_AGGREGATORS` (0 usage) supprimé ; `TRUSTED_AGGREGATORS` = `AGGREGATORS` (source unique).
- `isTggFirst` (`Swap.tsx`) pilote désormais tous les tokens → renommer `isTokenFirst`.
- ~~`SwapQuoteParams` déclaré deux fois (`Swap.tsx:26` + `useSwapQuote.ts:22`).~~ ✅ Centralisé dans
  `hooks/swapQuote/types.ts`, importé partout.
- ~~`lib/snapshot.ts` : en-tête erroné, `ERC20_ABI` inline, RPC hardcodé, adresses dupliquées.~~
  ✅ En-tête corrigé ; réutilise `ERC20_ABI` partagé, `PUBLIC_CLIENTS[Base]` (fallback + multicall)
  et `ADDRESSES.Base.TFT_001`.
- 4 casts `as Abi` résiduels (`useContracts.ts:35,57`, `useZapSwap.ts:142,147`) → `@wagmi/cli`.
  **Reste** : mise en place d'outillage (dev-dep + codegen), à traiter séparément.

### Accessibilité / i18n / micro-copy

- `components/shared/CryptoBalance.tsx:25` : « Balance: 0 » quand déconnecté (trompeur) → « — ».
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
| 6   | Supprimer hooks morts `useZapTmcFees`/`useZapTsp500Fees` (bug 100×)      | 🟠       | ✅     | Supprimés + import `useReadContract` orphelin ; ratios conservés (utilisés par le refacto quote)                                                                                                                                                                           |
| 7   | Factoriser la branche quote TSG↔TGG (`computeZapQuote`)                  | 🟠       | ✅     | Pattern stratégie (`hooks/swapQuote/`), `useSwapQuote` 290→83, comportement préservé + dedup `SwapQuoteParams`                                                                                                                                                             |
| 8   | Rate-limit atomique (Lua) + éviction mémoire par expiration              | 🟠       | ✅     | Lua eval atomique + `evictOne` (`ratelimit.ts`) ; garantie Redis prod = hors-scope (infra)                                                                                                                                                                                 |
| 9   | Rate-limit + anti-stampede + whitelist IDs sur routes APIs payantes      | 🟠       | ✅     | `rateLimit` 60/min + `singleFlight` sur 8 routes ; whitelist/normalisation IDs `/api/cmc` ; fuite `details` retirée                                                                                                                                                        |
| 10  | Source unique pour les adresses de contrats                              | 🟠       | ✅     | `contracts/addresses.ts` = registre unique (par chaîne) ; `contracts.ts` + `TOKENS` dérivent ; vérifié value-preserving vs git HEAD ; corrige le mislabel TFT (Polygon→Base)                                                                                               |
| 11  | Skeleton/loader cohérents + états prix/quote indisponibles               | 🟠       | ⏳     | `ExchangeSkeleton`, `Exchange`, `Swap`                                                                                                                                                                                                                                     |
| 12  | Précision `parseUnits` + constante troy-ounce partagée                   | 🟡       | ✅     | `goldLikeWithdrawAmount` partagé (division directe par `ONCE_DIVISION`, précision corrigée) ; scaled 1e9 supprimé                                                                                                                                                          |
| 13  | Headers de sécurité / CSP / X-Frame-Options                              | 🟢       | 🟡     | Headers ajoutés (`next.config.ts`) ; CSP resource complet (allowlist wallet/RPC) reste à faire                                                                                                                                                                             |
| 14  | A11y (labels, aria) + i18n EN + micro-copy                               | 🟢       | ⏳     | `TokenInput`, `DistributeFromWallet`, etc.                                                                                                                                                                                                                                 |
| 15  | Socle de tests (compute\*WithdrawAmount, schémas Zod, ratelimit)         | 🟠       | ⏳     | aucun test aujourd'hui                                                                                                                                                                                                                                                     |
| 16  | Nettoyage : `@wagmi/cli`, aggregators dupliqués, scories `snapshot.ts`   | 🟢       | 🟡     | Aggregators dédupliqués + `snapshot.ts` nettoyé + `isTggFirst`→`isTokenFirst` + Prisma Emails + snapshot lock ; **reste** `@wagmi/cli`                                                                                                                                      |

Légende : ✅ done · 🟡 partiel · ⏳ à faire
