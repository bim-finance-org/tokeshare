# Stellar Tranche 2 · Étape 1 — Revenue Distribution Engine + Data Infrastructure

Branche proposée : `feat/stellar-tranche2-distribution`

Ce plan couvre la première étape de la tranche 2 : un moteur de distribution de
revenus USDC sur Soroban (mécanisme de claim), plus la couche de données qui
l'alimente (indexation d'events, reconstruction d'état, API).

---

## 0. Point de départ

Acquis de la tranche 1 :

- **Contrat sale** `soroban/contracts/sale/` — vente à prix fixe + buyback,
  déployé par asset. Consommé via `lib/stellar-assets.ts`.
- **Token RWA SEP-41** — repo séparé (voir `rwa-token-repo-brief.md`), un
  contrat par bien, avec allowlist/pause/freeze/cap.
- **Registry** `config/stellar-assets.ts` — 2 assets : `tres` (testnet),
  `tfw001` (mainnet). Source de vérité hardcodée, **pas de base de données**.
- **Signature** — `StellarContext.signTransaction(xdr)` unifie Wallets Kit et
  Privy. Tout nouveau flux passe par cette même interface.
- **Infra dispo** — Prisma/Postgres (schéma quasi vide), Redis, `requireAuth()`.

### Où vit quoi

Les contrats Soroban vivent **tous** dans `../tokeshare-stellar-contracts`
(`git@github.com:bim-finance-org/tokeshare-stellar-contracts.git`) :
`contracts/rwa_token/` et `contracts/sale/` (v2 : buyback + fee + allowlist),
avec leurs scripts de déploiement et leur doc. C'est le repo public du grant, et
c'est là qu'ira le distributor.

⚠️ Le dossier `soroban/` dans tokeshare est une **copie v1 périmée** du contrat
sale (10 fonctions au lieu de 20). Piège pour la suite : à supprimer.

### Le changement de nature de la tranche 2

La tranche 1 était volontairement sans état (décision D2 de la tranche 1). La
tranche 2 inverse ce choix : la persistance devient le livrable.
`config/stellar-assets.ts` reste la source de vérité du *registry* ; la DB ne
stocke que de l'état **dérivé de la chaîne**, plus un journal des actions
opérateur (voir D7). Jamais de config.

---

## 1. Décisions d'architecture

### D1 — Claim par preuve de Merkle, snapshot calculé off-chain

Un token SEP-41 ne tient aucun registre de ses holders : aucun contrat ne peut
itérer dessus. La distribution est donc en **pull** (le grant l'impose :
« scalable claim mechanism »).

Le contrat doit néanmoins vérifier qu'un claim est légitime sans faire confiance
à notre serveur. Chaîne complète :

```
events transfer/mint/burn du token
  └─> indexer : ensemble des adresses ayant touché le token (incrémental)
        └─> lecture des balances au ledger de snapshot (simulation, fait foi)
              └─> [(adresse, montant)] → arbre de Merkle → racine 32 octets
                    └─> create_cycle(..., root) on-chain + dépôt USDC
                          └─> claim(cycle_id, amount, proof) vérifié on-chain
```

L'indexer donne **l'ensemble des adresses** ; la simulation donne **les balances
qui font foi**. On ne se sert jamais des balances reconstruites par rejeu pour
distribuer — un event manqué fausserait la comptabilité. Le rejeu sert de
recoupement et d'historique.

Coût on-chain : 32 octets par cycle, quel que soit le nombre de holders. Preuve
de `log2(n)` hashes (~6 pour 50 holders).

### D2 — Un contrat distributor global multi-asset

Un seul contrat gère tous les biens, indexé par `(token, cycle_id)`. Un
déploiement, un point d'indexation, ajouter un bien ne demande aucun déploiement.

### D3 — Le distributor vit dans le repo RWA token (public)

Le repo RWA token est déjà le repo public de la tranche 1 : il accueille le
contrat distributor, ses tests Rust, ses scripts de déploiement et la doc. C'est
lui qui coche « Public repository with source code and documentation ».

tokeshare garde : les events ajoutés au contrat sale, le worker d'indexation,
les modèles Prisma, les routes API et l'UI.

### D4 — Worker d'indexation dédié, hors Next.js

Process long-running séparé qui poll le RPC Soroban toutes les ~5 s. Le cron
Vercel plafonne à 1 minute et coupe sur les longs rattrapages ; « near real-time »
est un critère explicite du grant.

### D5 — Frais de claim sponsorisés par fee-bump

Un investisseur onboardé par Privy n'a aucun XLM. Le holder signe sa transaction
de claim, le serveur l'enveloppe dans une **fee-bump transaction** et paie les
frais. Mécanisme Stellar natif, et le claim reste une action du holder — le
critère « holders able to claim through the application » est bien satisfait.

### D5bis — Le push est le mode nominal, le claim est le rattrapage

Décision utilisateur du 2026-08-16. L'opérateur ne veut pas dépendre de la bonne
volonté des détenteurs : une fois par mois, il clique et tout le monde est payé.

Fonctionnement retenu :

1. La console lit les balances, affiche la répartition, l'opérateur valide.
2. `create_cycle` dépose l'USDC et publie la racine.
3. `distribute_for` parcourt la liste et verse à chacun — découpé en plusieurs
   transactions si le nombre de destinataires dépasse les limites de ressources
   d'une transaction Soroban (seuil à mesurer en Phase 0).

Le claim ne subsiste que comme **rattrapage des exclus du lot** :

- Recevoir de l'USDC exige une trustline USDC, ouvrable seulement par le
  propriétaire du compte.
- Sur Soroban, un transfert qui échoue fait échouer toute la transaction — une
  seule adresse sans trustline bloquerait le paiement de tous les autres.
- Donc la console **pré-vérifie les trustlines** (`hasPaymentTrustline`, déjà en
  place) et exclut du lot les adresses non éligibles. Celles-ci voient leur
  montant en « à réclamer » et le claim leur ouvre la trustline avant de payer.

Conséquence sur le `sweep` : il ne concerne plus que ces quelques lignes, pas un
volume significatif de non-réclamé.

### D6 — Mainnet uniquement

Décision utilisateur du 2026-08-16, confirmée après objection. Aucun déploiement
testnet : le distributor est déployé directement sur mainnet et les cycles réels
y sont exécutés.

> ⚠️ Tracé pour mémoire : le critère du grant est littéralement « Revenue
> distribution engine deployed on **Stellar testnet** ». Ce critère ne sera donc
> pas satisfait tel qu'écrit. Conséquences opérationnelles : contrat immuable
> manipulant de l'USDC réel, racine de Merkle irréversible une fois publiée,
> aucune répétition générale. La suite de tests Rust et la simulation locale
> d'un cycle complet deviennent le **seul** filet de sécurité — d'où leur
> priorité relevée dans WS-A.

### D7 — Aucun event ajouté au contrat sale

Le contrat sale n'émet aucun event, et le redéployer signifierait migrer
l'inventaire d'un contrat mainnet détenant des fonds réels. On s'en passe :
l'indexeur lit les events **natifs** du token RWA (`transfer` / `mint` / `burn`,
émis par les extensions OpenZeppelin `stellar-tokens`) et ceux du **SAC USDC**.

Un achat produit déjà deux events dans une même transaction :

```
token TFW_001 : transfer(contrat de vente → acheteur, N parts)
USDC          : transfer(acheteur → trésor, M USDC)
```

On en déduit qui, combien, quand, à quel prix effectif, et la nature de
l'opération (expéditeur = contrat de vente ⇒ achat ; destinataire = contrat de
vente ⇒ revente).

Ce qu'on n'obtient pas ainsi, et comment on le couvre :

| Angle mort | Mitigation |
|---|---|
| Journal des `set_price` / `set_fee_bps` / `set_treasury` (aucun mouvement de token ⇒ aucune trace on-chain) | La console opérateur journalise ces actions en base au moment où elle les déclenche (WS-E) |
| Décomposition brut / frais d'une revente (les frais restent dans le contrat, pas de transfert séparé) | Recalcul depuis le `fee_bps` journalisé à la date de l'opération |
| Appariement parts ↔ USDC déduit de l'appartenance à la même transaction | Vrai tant qu'une transaction = une opération. À réexaminer si on introduit un jour du batching |

---

## 2. Workstreams

### WS-0 · Préparation — **prérequis**

- Supprimer le dossier `soroban/` de tokeshare (copie v1 périmée du contrat
  sale). Le repo `tokeshare-stellar-contracts` fait autorité.
- Amorcer à la main l'ensemble des adresses détentrices des deux assets, la
  rétention du RPC (~24 h) rendant impossible tout backfill des events depuis le
  déploiement des tokens (2026-07-28). Source : Stellar Expert + acheteurs
  connus. Les montants venant de la simulation, cet amorçage n'affecte que la
  complétude de la liste, pas la justesse des distributions.
- Vérifier que le repo `tokeshare-stellar-contracts` est bien public (livrable
  du grant).

### WS-A · Contrat distributor (`tokeshare-stellar-contracts`)

Interface visée :

```rust
__constructor(admin: Address, pay_sac: Address)          // USDC SAC

// opérateur
create_cycle(token: Address, total: i128, snapshot_ledger: u32,
             root: BytesN<32>, expires_at: u64) -> u32   // tire l'USDC de l'opérateur
sweep(cycle_id: u32, to: Address)                        // récupère le non-réclamé après expiry
distribute_for(cycle_id: u32, entries: Vec<Entry>)       // push pour les inactifs

// holder
claim(cycle_id: u32, holder: Address, amount: i128,
      proof: Vec<BytesN<32>>) -> i128

// vues
cycle(cycle_id) -> Cycle
is_claimed(cycle_id, holder) -> bool
claimed_total(cycle_id) -> i128
```

Points de conception :

- **Feuille** = `sha256(cycle_id ‖ holder ‖ amount)`. Inclure `cycle_id` empêche
  de rejouer la preuve d'un cycle sur un autre.
- **Nœuds internes** : hash de la paire triée, pour éviter de transporter les
  bits de direction dans la preuve.
- **Garde-fou de solvabilité** : le contrat ne connaît que la racine, il ne peut
  pas vérifier que la somme des feuilles égale `total`. On suit `claimed_total`
  et on rejette tout claim qui ferait dépasser `total`. Une racine mal calculée
  ne peut donc pas vider le contrat au-delà du dépôt du cycle.
- **Double-claim** : marquage `(cycle_id, holder)` en storage persistant.
- **Expiration** : au-delà de `expires_at`, `sweep` renvoie le reliquat au
  trésor. Fenêtre à fixer (12 mois ?).
- **Poussière d'arrondi** : la division au prorata laisse un résidu ; il reste
  dans le contrat et part au `sweep`.
- **Exclusions du snapshot** : l'inventaire invendu détenu par le contrat sale,
  et le trésor — sinon Tokeshare se distribue son propre argent.
- **TTL** : bumper l'instance et les entrées de cycle comme le fait déjà la sale.
- **Events** : `cycle_created`, `claimed`, `swept`.

**Tests Rust — filet de sécurité unique (voir D6).** Cycle nominal, preuve
invalide, preuve d'un autre cycle rejouée, double-claim, claim au-delà du total
déposé, claim après expiration, sweep avant/après expiration, `distribute_for`,
arrondis et poussière, cycle à un seul holder, cycle à zéro holder. Plus une
simulation locale d'un cycle complet sur une répartition réaliste, comparée au
calcul off-chain, **avant tout déploiement mainnet**.

### WS-B · (supprimé — voir D7)

Aucune modification du contrat sale, aucun redéploiement. L'indexation repose
sur les events natifs du token RWA et du SAC USDC.

### WS-C · Worker d'indexation + schéma Prisma (tokeshare)

Worker autonome (`workers/stellar-indexer/`), déployable indépendamment du front.

**Cadence : toutes les 30 minutes.** Le coût CPU est nul quelle que soit la
fréquence (un appel HTTP, le worker dort entre deux) ; la contrainte réelle est
la rétention de ~24 h du RPC. À 30 min, il faudrait plus de 24 h d'indisponibilité
continue pour perdre des events. Enjeu : une adresse manquée n'entre jamais dans
le carnet, donc **cette personne n'est jamais payée, silencieusement** — aucune
erreur ne le signalerait.

Boucle : pour chaque contrat surveillé — **tokens RWA, SAC USDC, distributor**
(pas les sales, voir D7) — `getEvents` sur une plage de ledgers depuis le
curseur → normalisation → écriture idempotente → avancée du curseur. Reprise
après crash par le curseur.

**Hébergement : Coolify.** Seconde application, sans domaine ni port public,
`restart: always`, pointant sur la Postgres existante (`DATABASE_URL`) — un seul
schéma Prisma partagé avec l'API Next.js. Le worker expose un endpoint de santé
interne renvoyant son retard en ledgers, pour que Coolify le redémarre s'il se
fige : un worker bloqué une nuit dépasse la rétention du RPC et creuse un trou
définitif.

Modèles Prisma :

| Modèle | Rôle | Clé d'unicité |
|---|---|---|
| `StellarIndexCursor` | dernier ledger indexé | `(network, contractId)` |
| `StellarEvent` | events bruts normalisés | `(txHash, eventIndex)` |
| `StellarHolder` | ensemble des adresses + dernière balance connue | `(assetSlug, address)` |
| `StellarTrade` | achats / reventes, pour le portefeuille | `(txHash, eventIndex)` |
| `DistributionCycle` | cycles créés on-chain | `(cycleId)` |
| `DistributionEntry` | ligne du snapshot + preuve Merkle + état du claim | `(cycleId, address)` |

Contraintes à gérer :

- **Rétention du RPC ~24 h.** Le worker ne doit jamais accuser plus de ~20 h de
  retard, sinon trou irrécupérable. Métrique de lag exposée sur l'endpoint de
  santé + alerte.
- **Pas de backfill possible depuis le RPC** — amorçage manuel des adresses,
  traité en WS-0.
- Idempotence stricte : un rejeu de plage ne doit rien dupliquer.

### WS-D · API (tokeshare)

Lecture :

- `GET /api/stellar/portfolio/[address]` — holdings, valorisation, revenus perçus
- `GET /api/stellar/portfolio/[address]/distributions` — à réclamer (avec preuve) + historique
- `GET /api/stellar/assets/[slug]/distributions` — historique des cycles du bien
- `GET /api/stellar/assets/[slug]/holders` — répartition du capital
- `GET /api/stellar/assets/[slug]/activity` — flux d'events

Écriture :

- `POST /api/stellar/claim/build` — construit et prépare le XDR de claim
- `POST /api/stellar/claim/submit` — enveloppe en fee-bump, signe côté serveur, soumet
- `POST /api/stellar/admin/cycles` — création d'un cycle, protégé par `requireAuth()`

Cache Redis sur les routes de lecture, invalidé par le worker.

### WS-E · Console opérateur (tokeshare)

Séquence de création d'un cycle, en un clic depuis le dashboard admin :
choix du bien et du montant → snapshot (lecture des balances des adresses
connues) → **pré-vérification des trustlines USDC**, exclusion des inéligibles →
aperçu de la répartition avant validation → construction de l'arbre →
`create_cycle` + dépôt USDC → `distribute_for` en lots → persistance du cycle,
des preuves et des lignes exclues.

L'aperçu avant validation est indispensable : une racine erronée est
irrattrapable une fois publiée — a fortiori sans répétition testnet (D6).

La console porte aussi le **journal des actions opérateur** (D7) : tout
`set_price`, `set_buyback_price`, `set_fee_bps`, `set_treasury` déclenché depuis
l'admin est enregistré en base avec son ledger et son hash de transaction. C'est
ce qui reconstitue l'historique des prix et des frais, invisible on-chain.

### WS-F · UI investisseur (tokeshare)

- Bloc « Revenus » sur `app/stellar/[asset]/page.tsx` : cycles passés,
  rendement réalisé, prochaine distribution.
- Historique des distributions par investisseur. Cas nominal : le versement est
  déjà arrivé, l'investisseur n'a rien à faire — il le constate.
- Section « À réclamer » : n'apparaît que pour les exclus du lot (D5bis).
  Enchaîne ouverture de trustline puis claim, signé via
  `StellarContext.signTransaction` — donc identique pour Wallets Kit et Privy.
  Réutilise `buildPaymentTrustlineXdr`, comme le flux d'achat.

### WS-G · Sponsorisation des frais (tokeshare)

Compte sponsor financé en XLM, clé côté serveur. `POST /api/stellar/claim/submit`
n'accepte que des transactions dont l'unique opération est un `claim` sur le
distributor connu — sinon on offre un relai de transactions arbitraires.
Rate-limit par adresse (`lib/ratelimit.ts` existe déjà). Alerte sur solde bas.

### WS-H · Exécution mainnet + documentation

- **Premier cycle en montant réduit** sur un seul bien, avec un holder maîtrisé,
  avant tout cycle grandeur nature. C'est le substitut du testnet (D6).
- Puis au moins **3 cycles de distribution** sur les 2 assets, avec des holders
  différents entre les cycles (pour prouver que le snapshot suit les mouvements).
- Claims exécutés depuis les deux parcours d'onboarding (Wallets Kit + Privy).
- README du distributor : modèle Merkle, format des feuilles, interface,
  procédure opérateur, liens Stellar Expert des cycles exécutés.
- Doc de l'indexer : architecture, garanties, limites de rétention.

---

## 3. Séquencement

**Phase 0** — WS-0 (préparation) + spike Merkle en Rust : coût CPU de
`env.crypto().sha256()` sur une preuve de profondeur 8-10, format exact des
`BytesN<32>`, et parité bit-à-bit entre l'implémentation Rust et le calcul TS
côté serveur. Cette parité est critique : une divergence d'encodage produirait
des preuves systématiquement rejetées, ou pire, une racine calculée sur des
données mal sérialisées. Mesurer aussi le **nombre maximal de versements par
transaction** dans `distribute_for` (limites de ressources Soroban), qui fixe la
taille des lots de la console.

**Phase 1** — WS-A (distributor + tests) et WS-C (worker + schéma) en parallèle :
indépendants tant que l'interface du distributor est figée.

**Phase 2** — WS-D (API), une fois le worker alimenté.

**Phase 3** — WS-E (console opérateur) puis WS-F (UI investisseur) ; WS-G en
parallèle de WS-F.

**Phase 4** — WS-H : cycle pilote puis cycles réels sur mainnet, doc, publication.

Dépendances : WS-A bloque WS-E/WS-F. WS-C bloque WS-D.

---

## 4. Traçabilité des critères du grant

| Critère | Workstream | État |
|---|---|---|
| Revenue distribution engine deployed on Stellar testnet | WS-A | ⚠️ **non couvert** — déploiement mainnet uniquement (D6) |
| Multiple USDC distribution cycles executed successfully | WS-E, WS-H | couvert (sur mainnet) |
| Token holders able to claim distributions through the application | WS-F, WS-G | couvert |
| Public repository with source code and documentation | WS-A, WS-H | couvert (`tokeshare-stellar-contracts`) |
| Event indexer processing on-chain activity in near real-time | WS-C | couvert (events natifs du token + SAC USDC) |
| API operational and serving portfolio and distribution data | WS-D | couvert |

---

## 5. Risques et questions ouvertes

- **Aucune répétition testnet (D6)** — risque structurant, assumé par
  l'utilisateur après objection explicite. Compensé par : suite de tests Rust
  exhaustive, parité Rust/TS du calcul de racine vérifiée en Phase 0, aperçu
  obligatoire avant validation, garde-fou `claimed_total`, et cycle pilote en
  montant réduit (WS-H). Le critère « deployed on Stellar testnet » du grant
  n'est pas satisfait tel qu'écrit.
- **Pas de backfill d'events** — l'historique antérieur au démarrage du worker
  est irrécupérable via le RPC. Amorçage manuel des adresses (WS-0).
- **Downtime du worker > 24 h** = trou définitif dans l'historique. Supervision
  requise, pas optionnelle (endpoint de santé + redémarrage Coolify).
- **Racine de Merkle erronée** — irréversible une fois publiée. D'où l'aperçu
  obligatoire avant validation (WS-E) et le garde-fou `claimed_total` (WS-A).
- **Sponsor de frais** — surface d'abus si la validation de l'opération sponsorisée
  est laxiste. Restreindre à l'opération `claim` sur le contrat connu.
- **Angles morts de D7** — journal des prix/frais dépendant de la console : une
  action admin passée en CLI hors console échappe au journal. Discipline
  opératoire à documenter dans `OPERATIONS.md` du repo contracts.
- **Réglementaire** — la distribution de revenus à des porteurs est un sujet
  distinct de la vente (rappel : buy/sell a été retiré côté EVM pour cause de
  réglementation UE). Le déploiement étant mainnet d'emblée, ce point devient
  bloquant : à confirmer avant le premier cycle.
- **Signature Privy sur une invocation Soroban** — validée à l'achat en
  tranche 1, à reconfirmer sur le claim (transaction enveloppée en fee-bump :
  vérifier que la signature du holder reste valide sur l'inner tx).
