# Stellar Tranche 2 · Livrable 2.2 — Intégration du Stellar Disbursement Platform (SDP)

Branche : `feat/stellar-sdp`

> **État au 2026-10-05** : WS-3 à WS-6 et WS-8 implémentés (schéma, client,
> orchestration, synchro worker, console, UI investisseur, tests vitest) ;
> compose de déploiement dans `deploy/sdp/`, runbook dans `sdp.md`. Écarts
> avec le plan : l'ancienne route `POST /api/stellar/admin/cycles` est
> supprimée (pas d'alias, seule la console l'appelait) ; toutes les lignes du
> snapshot sont stockées dans `DistributionPayout` (canal `sdp` / `push` /
> `claim`), y compris pour les rounds sans SDP. Restent : WS-0 (spike), WS-1/2
> (déploiements), WS-7 (rounds réels).

Ce plan couvre la partie « Stellar Disbursement Platform » du livrable 2.2
(*Fiat Access & Distribution Layer*). Il branche le SDP sur le moteur de
distribution construit à l'étape 1 (`tranche-2-plan.md`), sans le remplacer.
MoneyGram et Alfred Pay ont leur propre suivi ; ils n'apparaissent ici que
pour le parcours de bout en bout (§6).

Critères du grant visés :

| Critère 2.2 | Couvert par |
|---|---|
| Stellar Disbursement Platform integrated and tested | WS-1 à WS-6 |
| Revenue distributions executed to multiple token holders | WS-7 (rounds testnet multi-holders) |
| End-to-end user journey validated: fiat deposit → asset purchase → **revenue distribution** → fiat withdrawal | WS-7, maillon « distribution » ; dépend de D5 |

Échéance du grant : 3 octobre 2026 — **dépassée** au moment de la rédaction
(5 octobre). À signaler à la SDF si ce n'est pas déjà fait.

Faits SDP ci-dessous vérifiés dans le code source du backend (branche
`develop`, image `7.0.0`). Ce qui n'a pas pu être vérifié est marqué
**[à vérifier]** et traité dans le spike de la Phase 0.

---

## 0. Point de départ

### Ce qui existe (étape 1, en production sur mainnet)

```
indexer (Coolify, 30 min) ──> StellarHolder (ensemble des adresses)
                                   │
console dashboard ── preview ──> computeSnapshot()      lib/stellar-admin.ts:62
                                   │  balances relues par simulation
                                   │  prorata, push = a une trustline USDC
                                   ▼
                     ── execute ─> executeCycle()       lib/stellar-admin.ts:202
                                   │  1. persiste plan + preuves (DistributionCycle/Entry)
                                   │  2. create_cycle  (dépôt du total complet, racine sur TOUS les holders)
                                   │  3. distribute_for par lots (push)
                                   ▼
                     indexer : events cycle_created / paid / swept → DB
                     claim (fee-bump sponsorisé) pour les exclus du push
```

- Le cycle pilote #0 a tourné sur mainnet le 2026-08-23 (1 USDC, TFW_001).
- Aucun distributor n'est déployé sur testnet (`NEXT_PUBLIC_STELLAR_TESTNET_DISTRIBUTOR_ID` vide).
- Le testnet paie en USDC `GCYG5OOZ…77QC` (`config/stellar.ts:29`), alors que
  MoneyGram et le SDP utilisent l'USDC Circle `GBBD47IF…LFLA5`. Voir D5.

### Ce que le SDP apporte, et ce qu'il n'apporte pas

Le SDP est une application Go open source de la SDF, **auto-hébergée**. On
alimente un compte de distribution en USDC, on lui donne une liste
« adresse + montant », il envoie **une transaction par destinataire** via ses
channel accounts.

| | Moteur actuel | SDP |
|---|---|---|
| Qui reçoit combien (indexer, snapshot, prorata) | ✅ | ❌ — reçoit une liste déjà calculée |
| Preuve vérifiable on-chain (racine Merkle) | ✅ | ❌ |
| Envoi groupé | ✅ `distribute_for` | ✅ son rôle |
| Échec isolé par destinataire | ❌ un transfert raté annule tout le lot Soroban | ✅ un paiement FAILED n'affecte pas les autres |
| Rattrapage pour les adresses sans trustline | ✅ claim | ❌ |
| Suivi, export, dashboard d'audit | console maison | ✅ dashboard SDP + exports CSV |

Le SDP remplace donc **uniquement l'étape 3 (push)**. Le calcul amont et le
claim restent à nous.

---

## 1. Décisions d'architecture

### D1 — Le SDP est le canal de push ; le distributor ne garde que le claim

Un « versement » (round) découpe le snapshot en deux sous-ensembles disjoints :

```
computeSnapshot()  (inchangé)
        │
        ├── lignes push=true  (trustline USDC ou adresse C…) ──> disbursement SDP
        │
        └── lignes push=false (pas de trustline)            ──> cycle distributor
                                                                 racine sur CES lignes seulement
                                                                 dépôt = leur somme
                                                                 aucun distribute_for
```

**Pourquoi disjoints.** Aujourd'hui la racine couvre tous les holders et le
contrat détient tout le montant. Si le SDP payait en plus les mêmes personnes,
chacune garderait une preuve valide et pourrait réclamer une seconde fois. Le
garde-fou `claimed_total` n'empêcherait pas ce double paiement : il le ferait
porter sur les autres ayants droit du cycle.

Conséquences :
- un round sans ligne `push=false` ne crée **aucun** cycle on-chain ;
- un round sans ligne `push=true` ne crée **aucun** disbursement SDP (c'est
  le cas dégénéré « tout le monde réclame ») ;
- la poussière d'arrondi n'est plus déposée nulle part : elle reste sur le
  compte opérateur.

### D2 — Un modèle `DistributionRound` au-dessus des cycles

`DistributionCycle` est identifié par l'id du cycle **on-chain**
(`@@id([network, cycleId])`). Or un round peut ne pas avoir de cycle (D1). Il
faut donc une entité métier indépendante de la chaîne : le round, qui
représente « le versement d'octobre de TFW_001 ». Le cycle on-chain devient
un enfant optionnel.

Le détail du schéma est en WS-3.

### D3 — Mode « adresses connues », emails synthétiques déterministes

Contact type `EMAIL_AND_WALLET_ADDRESS` :
- le SDP marque le wallet du destinataire REGISTERED dès l'upload ;
- aucun message d'invitation n'est envoyé ;
- les paiements partent au démarrage du disbursement.

La colonne `email` reste obligatoire, unique par tenant, et le SDP refuse
qu'une même adresse soit liée à deux emails (409). Pour respecter ces deux
contraintes sans aucune donnée personnelle :

```
email = <adresse en minuscules>@holders.tokeshare.co
id    = <adresse>                     (identifiant externe, ≤ 64 caractères)
```

L'email est dérivé de l'adresse, donc le couple (email, adresse) est stable
d'un mois sur l'autre et le SDP réutilise le même receiver. On n'envoie
**jamais** l'email réel d'un utilisateur Privy au SDP : il n'en a pas besoin
et ça évite le cas « l'utilisateur change de wallet → mismatch 400 ».

Le domaine `holders.tokeshare.co` n'a besoin d'aucun enregistrement DNS : le
messager est en `DRY_RUN` (D6), aucun mail n'est envoyé.

### D4 — Compte de distribution SDP dédié, approvisionné par round

Le SDP détient la clé de son compte de distribution (`DISTRIBUTION_SEED`
chiffré en base). Ce **ne doit pas** être le compte opérateur `GCBHFIQ…OYZ`,
qui est aussi admin du distributor, sponsor de frais et admin des sales.

- Nouveau compte `G…SDP`, dédié, avec un solde gardé au minimum.
- À chaque round, la console envoie depuis le compte opérateur **le
  complément exact** : `max(0, total_push − solde_disponible_SDP)`. Un
  paiement classique, signé côté serveur avec la clé déjà présente
  (`STELLAR_DISTRIBUTOR_ADMIN_SECRET`).
- Type de compte tenant : `DISTRIBUTION_ACCOUNT.STELLAR.ENV` (le compte fourni
  par variables d'env est utilisé tel quel). `STELLAR.DB_VAULT` permettrait
  plusieurs wallets de distribution, ce dont on n'a pas besoin.

### D5 — Aligner le testnet sur l'USDC Circle (recommandé)

Le SDP sème l'USDC Circle `GBBD47IF…LFLA5` sur testnet, et MoneyGram testnet
utilise le même. Notre contrat sale TRES testnet est branché sur un autre
USDC (`GCYG5OOZ…`). Tant que ça reste ainsi :
- le parcours E2E du grant (dépôt MoneyGram → achat TRES → distribution →
  retrait) est cassé au premier maillon : l'USDC reçu de MoneyGram ne permet
  pas d'acheter TRES ;
- on ne sait pas si le SDP accepte un asset absent des assets du « User
  Managed Wallet » **[à vérifier]**.

**Recommandation :** basculer le profil testnet sur l'USDC Circle et
redéployer **la sale TRES testnet** avec le SAC Circle. Le token TRES
lui-même ne change pas, donc les holders testnet gardent leurs parts. C'est
du testnet : le coût est nul et ça débloque à la fois le SDP et l'E2E.

Alternative si on refuse : enregistrer `GCYG5OOZ…` dans le SDP
(`POST /assets`) et l'ajouter au User Managed Wallet. Ça ne règle pas l'E2E
MoneyGram.

### D6 — Aucun fournisseur de messages

`EMAIL_SENDER_TYPE=DRY_RUN` et `SMS_SENDER_TYPE=DRY_RUN` (valeurs par
défaut). Le mode adresses connues n'envoie de toute façon rien aux
destinataires. Les seuls emails du SDP concernent ses utilisateurs admin
(invitation, reset de mot de passe), et on les crée en CLI. Pas de Twilio, pas
de SES, pas de SendGrid.

### D7 — Un SDP par réseau, branché réseau par réseau

Les assets vivent sur deux réseaux : TFW_001 sur **mainnet**, TRES sur
**testnet**. Une instance SDP ne sert qu'un réseau (sa passphrase est
globale), donc le code est entièrement paramétré par réseau
(`SDP_TESTNET_*` / `SDP_MAINNET_*`) et chaque stack est un déploiement séparé
du même compose (`deploy/sdp/`).

Un réseau sans SDP configuré garde le chemin de l'étape 1 (cycle distributor
+ `distribute_for`) : rien ne casse pendant la transition, et l'ordre de
branchement (mainnet d'abord pour TFW_001, ou testnet d'abord pour TRES) est
une décision d'exploitation, pas de code.

Sur testnet, la branche claim exige un distributor testnet
(`deploy-distributor.sh testnet`). Le déployer couvre au passage le critère
2.1 « deployed on Stellar testnet ».

### D8 — Suivi par polling, pas de webhook (v1)

Le SDP a des webhooks, mais :
- uniquement au niveau du disbursement : aucun event par paiement ;
- l'URL doit être publique en https (garde anti-SSRF), donc pas d'adresse
  interne Coolify ;
- le secret HMAC n'est exposé par aucune API et ne se lit qu'en base ;
- leur présence dans le tag 7.0.0 n'est pas confirmée **[à vérifier]**.

Le statut par paiement exige de toute façon un polling de
`GET /disbursements/{id}/receivers`. On poll donc depuis le worker existant
(WS-5), et le webhook reste une amélioration possible.

### D9 — Pas de « retry » SDP : les échecs basculent vers le claim

`PATCH /payments/retry` lit un JWT utilisateur que le middleware des clés API
ne fournit pas : avec une clé API, la route renverrait vraisemblablement 401
**[à vérifier]**. Plutôt que de stocker un mot de passe admin SDP côté
serveur, une ligne SDP en FAILED est **re-routée vers le claim** : un cycle
distributor complémentaire est créé pour les lignes en échec (WS-4, action
« Basculer en claim »).

C'est cohérent avec D1 : le claim reste l'unique filet de rattrapage.

Effet de bord connu : un disbursement qui contient un paiement FAILED ne passe
jamais COMPLETED côté SDP (il reste STARTED). Le statut de **notre** round ne
dépend donc jamais du statut du disbursement : il est calculé depuis les
lignes.

---

## 2. Référence SDP utile à l'implémentation

### Services

| Conteneur | Commande | Ports | Exposition |
|---|---|---|---|
| `postgres:14` | — | 5432 | interne |
| `sdp-api` | `serve` | 8000 API · 8002 metrics · 8003 admin/tenants | 8000 public (https) ; **8003 jamais public** |
| `sdp-tss` | `tss` | 9002 metrics | aucune entrée |
| `sdp-frontend` | nginx | 80 | public (dashboard) |

Pas de Kafka : depuis v4 les jobs tournent dans un scheduler interne
(`SCHEDULER_PAYMENT_JOB_SECONDS`, 30 s par défaut). RAM : la doc officielle
annonce 4 Go pour toute la stack ; à mesurer sur Coolify.

### Initialisation (une seule fois)

```bash
# migrations (avant serve)
stellar-disbursement-platform db admin migrate up
stellar-disbursement-platform db tss   migrate up
stellar-disbursement-platform db auth  migrate up --all
stellar-disbursement-platform db sdp   migrate up --all
stellar-disbursement-platform db setup-for-network --all

# tenant unique + owner
stellar-disbursement-platform tenants ensure-default \
  --default-tenant-owner-email ops@tokeshare.co \
  --default-tenant-owner-first-name Ops --default-tenant-owner-last-name Tokeshare \
  --default-tenant-distribution-account-type DISTRIBUTION_ACCOUNT.STELLAR.ENV \
  --disable-mfa=true --disable-recaptcha=true
# ensure-default crée l'owner sans mot de passe utilisable → on en ajoute un
echo '<mot de passe>' | stellar-disbursement-platform auth add-user ops@tokeshare.co Ops Tokeshare \
  --password --owner --roles owner --tenant-id <id>
# <id> : GET :8003/tenants  avec Authorization: Basic base64(ADMIN_ACCOUNT:ADMIN_API_KEY)

# channel accounts (fait au démarrage du TSS)
stellar-disbursement-platform channel-accounts ensure 2
```

Les channel accounts sont créés à 0 XLM et sponsorisés par le compte de
distribution (~1 XLM bloqué par channel **[à vérifier]**).

### Variables d'environnement

`sdp-api` :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | Postgres SDP (pas la nôtre) |
| `BASE_URL` / `SDP_UI_BASE_URL` | `https://sdp-api.tokeshare.co` / `https://sdp.tokeshare.co` |
| `NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `HORIZON_URL` / `RPC_URL` | Horizon + RPC testnet (RPC nécessaire pour payer des adresses `C…`) |
| `SINGLE_TENANT_MODE` | `true` |
| `DISTRIBUTION_PUBLIC_KEY` / `DISTRIBUTION_SEED` | compte dédié D4 |
| `DISTRIBUTION_ACCOUNT_ENCRYPTION_PASSPHRASE` / `CHANNEL_ACCOUNT_ENCRYPTION_PASSPHRASE` | **seeds `S…`** générés, pas des mots de passe |
| `SEP10_SIGNING_PUBLIC_KEY` / `SEP10_SIGNING_PRIVATE_KEY` | keypair dédié, non financé |
| `EC256_PRIVATE_KEY` | `openssl ecparam -name prime256v1 -genkey -noout` |
| `SEP24_JWT_SECRET` | aléatoire |
| `EMAIL_SENDER_TYPE` / `SMS_SENDER_TYPE` | `DRY_RUN` |
| `DISABLE_MFA` / `DISABLE_RECAPTCHA` | `true` (à reconsidérer pour mainnet) |
| `ADMIN_ACCOUNT` / `ADMIN_API_KEY` | accès au port 8003 |
| `CORS_ALLOWED_ORIGINS` | `https://sdp.tokeshare.co` |
| `TENANT_XLM_BOOTSTRAP_AMOUNT` | 5 |

`sdp-tss` : `DATABASE_URL`, `NETWORK_PASSPHRASE`, `HORIZON_URL`, `RPC_URL`,
`NUM_CHANNEL_ACCOUNTS=2`, `MAX_BASE_FEE`, `DISTRIBUTION_PUBLIC_KEY/SEED`,
les deux passphrases.

### Clé API (pilotage depuis Next.js)

1. `POST /login {email, password, recaptcha_token:""}` → `{token}`.
2. `POST /api-keys` avec `{name:"tokeshare-console", permissions:[...], allowed_ips:[<IP sortante Coolify>]}`.
3. On obtient `SDP_<id>.<secret>`, à envoyer dans `Authorization: Bearer SDP_…`.

Permissions minimales : `read:disbursements`, `write:disbursements`,
`read:receivers`, `read:payments`, `write:payments` (annulation),
`read:wallets` (lecture des assets). Rien en `:all`.

### Cycle de vie d'un disbursement

```
POST  /disbursements             (multipart : data=<JSON>, file=<.csv>)  → DRAFT puis READY
PATCH /disbursements/{id}/status {"status":"STARTED"}                     → 409 si solde insuffisant
GET   /disbursements/{id}                                                 → stats
GET   /disbursements/{id}/receivers                                       → statut + tx par ligne
PATCH /payments/{id}/status      {"status":"CANCELED"}                     → seule transition manuelle permise
```

JSON `data` :

```json
{
  "name": "tfw001 · round 2026-10 · <roundId>",
  "asset_id": "<id USDC via GET /assets>",
  "registration_contact_type": "EMAIL_AND_WALLET_ADDRESS"
}
```

En mode wallet, `wallet_id` est ignoré : le SDP prend le « User Managed
Wallet », semé sur testnet. Le champ `verification_field` est sans objet
**[à vérifier : vide accepté ?]**.

CSV (en-têtes exacts, sensibles à la casse) :

```csv
id,email,walletAddress,amount,paymentID
GDEK…BEWA,gdek…bewa@holders.tokeshare.co,GDEK…BEWA,1.0000000,r_ckxyz:GDEK…BEWA
```

Points à respecter :
- `amount` : décimal > 0, au plus 7 décimales, donc `stroopsToUnits` ;
- une adresse au plus une fois par fichier (pas de doublon de contact) ;
- 10 000 lignes maximum ;
- `paymentID` : 64 caractères maximum, non unique côté SDP. C'est notre clé
  de rapprochement, d'où `<roundId>:<adresse>`. Un cuid fait 25 caractères,
  plus 1 pour le séparateur et 56 pour l'adresse, soit 82 : **trop long**.
  On utilise donc `<roundId>:<8 derniers caractères de l'adresse>` et on
  rapproche en réalité via `id` + `walletAddress`, qui sont uniques par
  round ;
- `walletAddressMemo` est optionnel et refusé pour les adresses `C…`. On ne
  s'en sert pas en v1.

Statuts de paiement : `DRAFT → READY → PENDING → SUCCESS | FAILED`, plus
`PAUSED` et `CANCELED`. Un `op_no_trust` ou un `op_no_destination` donne
FAILED sur **cette** ligne seulement.

Limite de débit : 40 requêtes par 20 s, par IP et par endpoint. Le polling
WS-5 reste très en dessous.

---

## 3. Workstreams

### WS-0 · Spike local (Phase 0, ~1 j)

But : valider les points **[à vérifier]** avant d'écrire du code.

`git clone stellar/stellar-disbursement-platform-backend && make setup`
(assistant interactif : il génère les comptes, lance Docker et donne les
identifiants), puis, à la main via `curl` :

1. Créer une clé API, puis un disbursement `EMAIL_AND_WALLET_ADDRESS` en un
   seul appel multipart, avec 3 lignes :
   - un compte G avec trustline USDC ;
   - un compte G **sans** trustline ;
   - une adresse `C…` (un contrat quelconque).

   Attendu : SUCCESS, FAILED isolé, SUCCESS via un transfert SAC.
2. `verification_field` absent ou vide : accepté ?
3. Un asset absent du User Managed Wallet (`GCYG5OOZ…`) : refusé ou accepté ?
   Ce point tranche l'alternative de D5.
4. `PATCH /payments/retry` avec une clé API : 401 confirmé ? (D9)
5. Deuxième disbursement aux mêmes adresses : le receiver est-il bien
   réutilisé, sans 409 ?
6. Webhooks présents dans 7.0.0 ? Juste pour information (D8).
7. Mesurer la RAM réelle de la stack au repos et pendant un disbursement.

Livrable : une section « Résultats du spike » ajoutée à ce document. Les
décisions D5, D8 et D9 sont confirmées ou corrigées.

### WS-1 · Déploiement SDP testnet sur Coolify (~1–2 j)

1. **Comptes** (testnet, friendbot) :
   - `G…SDP` : compte de distribution, financé en XLM. La trustline USDC
     Circle est posée par le provisioning du tenant.
   - `G…SEP10` : signature SEP-10, non financé.
2. **Secrets** générés une fois et rangés dans le coffre de l'équipe :
   - les deux passphrases (des seeds `S…`) ;
   - `EC256_PRIVATE_KEY` ;
   - `SEP24_JWT_SECRET` ;
   - `ADMIN_API_KEY`.
3. **Compose Coolify** `sdp-testnet` : `postgres:14`, `sdp-api`, `sdp-tss`,
   `sdp-frontend` et un service `sdp-init` one-shot (migrations,
   `tenants ensure-default`, `add-user`), avec `depends_on` dans l'ordre.
   Partir de `dev/docker-compose-sdp.yml` et `dev/docker-compose-tss.yml` du
   repo SDP. Retirer le demo-wallet. Épingler l'image `7.0.0`, jamais
   `latest`.
4. **Domaines** :
   - `sdp-api.tokeshare.co` → `sdp-api:8000` ;
   - `sdp.tokeshare.co` → `sdp-frontend:80`.

   Le port 8003 n'est mappé sur aucun domaine.
5. **USDC Circle testnet** sur `G…SDP` via le faucet Circle (pour les
   premiers tests ; ensuite, approvisionnement par la console, D4).
6. **Clé API** créée (§2), `allowed_ips` réglé sur l'IP sortante de l'app
   Next Coolify.
7. **Variables côté tokeshare** (Coolify app Next + `.env.example`) :

   ```
   SDP_TESTNET_BASE_URL=https://sdp-api.tokeshare.co
   SDP_TESTNET_API_KEY=SDP_…
   SDP_TESTNET_DISTRIBUTION_ADDRESS=G…SDP
   SDP_TESTNET_DASHBOARD_URL=https://sdp.tokeshare.co
   ```

   Même jeu en `SDP_MAINNET_*` pour la stack mainnet (D7). Un réseau sans
   `SDP_*_BASE_URL` retombe sur le comportement actuel (push par
   `distribute_for`).

Vérification : connexion au dashboard, `GET /assets` renvoie l'USDC Circle,
et un disbursement d'une ligne lancé à la main passe SUCCESS.

### WS-2 · Prérequis testnet (~1 j, en parallèle de WS-1)

1. **D5** : passer `TESTNET.pay` sur l'USDC Circle dans `config/stellar.ts`.
   - Issuer : `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.
   - SAC : `stellar contract id asset --asset USDC:GBBD47…LFLA5 --network testnet`.
   - Redéployer la sale TRES testnet avec ce SAC, depuis le repo contracts.
   - Déplacer l'inventaire TRES de l'ancienne sale vers la nouvelle.
   - Mettre à jour `saleId` dans `config/stellar-assets.ts`.
2. **D7** : déployer le distributor testnet avec
   `scripts/deploy-distributor.sh testnet`, puis remplir
   `NEXT_PUBLIC_STELLAR_TESTNET_DISTRIBUTOR_ID`.
3. **Holders testnet de démonstration** : au moins 4 adresses détentrices de
   TRES, pour exercer chaque branche :

   | Holder | Trustline USDC | Canal attendu |
   |---|---|---|
   | A — Wallets Kit (Freighter) | oui | SDP |
   | B — Privy (email) | oui | SDP |
   | C — compte G | **non** | claim |
   | D — compte G, trustline retirée **après** le preview | oui puis non | SDP FAILED → bascule en claim |

   `npm run indexer:seed -- tres <adresses>` si l'indexer ne les a pas encore
   vues.

### WS-3 · Schéma Prisma (~0,5 j)

Nouveaux modèles et modifications :

```prisma
/// One revenue payout of one asset ("October for TFW_001"), independent of
/// the chain. Splits its snapshot between an SDP disbursement (push) and an
/// optional distributor cycle (claim path).
model DistributionRound {
  id                 String   @id @default(cuid())
  network            String
  assetSlug          String
  tokenId            String
  /// Total announced to holders, in stroops (push + claim lines; dust excluded).
  total              BigInt
  snapshotLedger     Int
  /// Merkle root over the FULL snapshot — audit trail only, never on-chain.
  snapshotRoot       String
  /// planned | funding | submitted | settled | attention (derived from lines, cached here)
  status             String   @default("planned")
  fundingTx          String?
  sdpDisbursementId  String?
  /// Distributor cycles serving this round's claim path (initial + re-routes).
  cycles             DistributionCycle[]
  payouts            DistributionPayout[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([network, assetSlug])
}

/// One SDP push line. Status mirrors the SDP payment.
model DistributionPayout {
  roundId       String
  address       String
  shares        BigInt
  amount        BigInt
  /// draft | ready | pending | success | failed | canceled | rerouted
  status        String    @default("draft")
  sdpPaymentId  String?
  stellarTx     String?
  paidAt        DateTime?
  error         String?
  /// Set when a failed line was moved to a claim cycle (D9).
  reroutedCycleId Int?

  round DistributionRound @relation(fields: [roundId], references: [id])

  @@id([roundId, address])
  @@index([address])
}
```

`DistributionCycle` reçoit `roundId String?` (+ relation). Il reste nullable
pour le cycle pilote #0, que la migration rattache à un round rétroactif :
`snapshotRoot` = `root` du cycle, aucun payout. `DistributionEntry` ne change
pas : il ne porte plus que des lignes claim.

Migration : `prisma/migrations/2026XXXX_distribution_rounds/`. Le backfill du
cycle #0 se fait en SQL dans la même migration. À appliquer sur la base
Coolify au déploiement du front (`prisma migrate deploy`), comme pour
l'étape 1.

`snapshotRoot` réutilise `buildDistribution` (`lib/stellar-merkle.ts`) sur la
liste complète. Il ne sert qu'à l'audit : le jour où quelqu'un conteste un
montant, on prouve que la ligne faisait partie du snapshot publié dans l'API.

### WS-4 · Orchestration serveur (~2–3 j)

**`lib/sdp.ts` — client HTTP minimal** (jamais importé côté client) :

```ts
getSdpConfig(network)                        // null si SDP non configuré pour ce réseau
resolveUsdcAssetId(network)                  // GET /assets, match code+issuer de getNetworkProfile().pay, mémoïsé
createDisbursement(network, { name, csv })   // POST /disbursements multipart, renvoie { id, status }
startDisbursement(network, id)               // PATCH status STARTED ; 409 → SdpInsufficientBalanceError
getDisbursementReceivers(network, id)        // GET …/receivers, paginé, normalisé en { address, status, txHash, error }
cancelPayment(network, paymentId)
```

Erreurs typées (`SdpError`, `SdpInsufficientBalanceError`, `SdpConflictError`),
dans l'esprit de `lib/stellar-errors.ts`. Timeout de 15 s, aucun retry
automatique sur les POST (pas d'idempotency key côté SDP).

**`lib/sdp-csv.ts` — construction du CSV**, pure et testée :
- email synthétique (D3) ;
- montants via `stroopsToUnits` ;
- refus des doublons ;
- échappement des champs.

**`lib/stellar-admin.ts`** — `executeCycle` est remplacé par une machine à
états reprenable :

```ts
planRound(asset, totalStroops, expiresDays)   // snapshot → split → persiste round + payouts + plan claim
advanceRound(roundId)                         // fait avancer d'UN cran, idempotent, rejouable
rerouteFailed(roundId)                        // FAILED → nouveau cycle claim
```

Étapes d'`advanceRound`. Chaque étape lit l'état persisté, agit, puis
persiste avant de passer à la suivante :

| État | Action | Garde d'idempotence |
|---|---|---|
| `planned` | rien (sert de point de reprise) | — |
| → `funding` | paiement classique opérateur → `G…SDP` du complément `max(0, push − solde)` | `fundingTx` déjà rempli ⇒ on saute |
| claim (si lignes `push=false`) | `create_cycle` avec la racine des lignes claim et un dépôt égal à leur somme | un cycle avec ce `roundId` existe ⇒ on saute |
| → `submitted` | `createDisbursement`, puis `startDisbursement` | `sdpDisbursementId` rempli ⇒ seulement (re)start si encore READY |
| `submitted` → `settled` / `attention` | fait par la synchro WS-5 | — |

Points d'attention :
- **Persister avant d'appeler** (même règle qu'à l'étape 1) : le
  `sdpDisbursementId` s'écrit juste après le POST, avant le PATCH. Un crash
  entre les deux laisse un disbursement READY que la reprise démarre ; il
  n'en recrée pas un second.
- **Ordre funding → claim → SDP.** Le SDP vient en dernier parce que c'est la
  seule étape irréversible côté destinataires et qu'elle exige le solde.
- **Mode de repli** : si `getSdpConfig(network)` est null, `advanceRound`
  exécute l'ancien chemin `create_cycle` + `distribute_for` pour les lignes
  push. Mainnet continue de fonctionner tant que le SDP mainnet n'existe pas.
- `rerouteFailed` : il prend les payouts en `failed`, construit un cycle
  claim complémentaire (même `roundId`, nouvelle racine, dépôt égal à leur
  somme), passe les payouts en `rerouted` et crée les `DistributionEntry`
  correspondantes. L'USDC de ces lignes est resté sur `G…SDP` ; il sera
  déduit du prochain approvisionnement (D4).
- **Snapshot figé** : `planRound` écrit les lignes, et `advanceRound` ne
  relit jamais les balances. Entre le preview et l'exécution, la règle
  actuelle s'applique : l'exécution refait le snapshot et l'opérateur a vu le
  preview juste avant.

**Routes API** (toutes sous `requireAuth()`) :
- `POST /api/stellar/admin/cycles/preview` : inchangée, plus une colonne
  « canal » (SDP / claim) dans la réponse.
- `POST /api/stellar/admin/rounds` : `planRound`, puis `advanceRound` en
  boucle jusqu'à `submitted`. Remplace `POST /api/stellar/admin/cycles`.
  L'ancienne route reste un alias pendant une version.
- `POST /api/stellar/admin/rounds/[id]/advance` : reprise manuelle après
  une erreur.
- `POST /api/stellar/admin/rounds/[id]/reroute` : bascule des FAILED en
  claim.

### WS-5 · Synchronisation (~1 j)

Dans le worker `workers/stellar-indexer/`, une boucle `sdp-sync` est ajoutée
à côté de l'indexation :
- **cadence** : 60 s tant qu'au moins un round est en `submitted`, sinon
  rien ;
- pour chaque round `submitted` : `getDisbursementReceivers`, puis mise à
  jour des `DistributionPayout` (`status`, `stellarTx`, `paidAt`, `error`) ;
- **statut du round**, recalculé à partir des lignes :
  - `settled` si toutes les lignes sont `success`, `rerouted` ou `canceled` ;
  - `attention` dès qu'une ligne est `failed` ;
  - `submitted` sinon ;
- un round `attention` remonte en tête de la console ; le worker ne fait
  rien de plus (pas de reroute automatique : décision opérateur) ;
- la santé du worker (`/health`) expose aussi l'âge du plus vieux round
  `submitted`.

Recoupement on-chain (optionnel, v2) : depuis le protocole 23, les paiements
classiques émettent des events SAC `transfer`. Un filtre
`[transfer, addr(G…SDP), *, *]` dans `buildFilters` permettrait de confirmer
chaque SUCCESS indépendamment de l'API SDP. Hors périmètre v1.

### WS-6 · Lecture et UI (~2 j)

**Côté données** (`lib/stellar-distributions.ts`) :
- `getAssetDistributions(slug)` liste des **rounds** (total, date, nombre de
  bénéficiaires, part SDP / claim, liens tx), et non plus des cycles bruts ;
- `getPortfolioDistributions(address)` fait l'union de deux sources :
  - `DistributionPayout` : statut `paid` / `pending` / `failed` ;
  - `DistributionEntry` : statut `claimable` / `paid` (logique actuelle).

  Elle garde le même format de sortie, avec un champ `channel: 'sdp' | 'claim'`
  en plus. Une ligne `rerouted` n'apparaît pas : c'est sa ligne claim qui
  s'affiche ;
- `entryStatus` gagne un état `failed` (« versement en échec, bascule en
  cours »).

**Console opérateur** (`components/features/dashboard/StellarDistributions.tsx`) :
- **preview** : deux groupes, « Versés par le SDP (n · total) » et « À
  réclamer (n · total) », plus le complément d'approvisionnement calculé ;
- **exécution** : une frise d'avancement (approvisionnement → cycle claim →
  disbursement SDP), chaque étape avec son lien de tx ou vers le dashboard
  SDP ;
- **liste des rounds** : statut, compteurs SUCCESS / PENDING / FAILED, et les
  boutons « Reprendre » (`advance`) et « Basculer les échecs en claim »
  (`reroute`).

**UI investisseur** : peu de changements. Le panneau revenus du dashboard
user et l'historique de la page asset consomment les mêmes routes. Il faut
seulement afficher le libellé `failed` et, sur une ligne payée via le SDP, le
lien vers la tx.

### WS-7 · Exécution testnet et preuves pour le grant (~1–2 j)

1. **Round 1, nominal**, sur TRES avec les holders A, B et C :
   - attendu : A et B payés par le SDP, C en claim ;
   - C ouvre sa trustline et réclame (fee-bump) ;
   - on vérifie A, B et C sur Stellar Expert.
2. **Round 2, échec et rattrapage** : on retire la trustline de D entre le
   preview et l'exécution.
   - Attendu : D passe FAILED, le round passe `attention`.
   - « Basculer en claim », puis D rouvre sa trustline et réclame.
3. **Round 3, holders qui changent** : on transfère des TRES de A vers une
   nouvelle adresse E, puis on vérifie que le snapshot suit et que E est
   payée par le SDP.
4. **E2E du grant**, enchaîné sur un même compte. Il dépend de D5 et du
   statut MoneyGram/Alfred :
   - dépôt MoneyGram (USDC Circle testnet) ;
   - achat de TRES ;
   - round SDP ;
   - retrait MoneyGram (cash-out) ou retrait simulé Alfred.

   À filmer pour la SDF.
5. **Preuves à archiver** dans le dossier du grant :
   - ids de disbursement ;
   - export CSV des paiements depuis le dashboard SDP ;
   - liens Stellar Expert ;
   - captures de la console ;
   - vidéo E2E.

### WS-8 · Tests et documentation (~1 j)

Tests vitest :
- `lib/sdp-csv.test.ts` : en-têtes exacts, emails synthétiques, 7 décimales,
  refus des doublons, échappement ;
- `lib/stellar-round.test.ts`, avec le SDP et Prisma mockés :
  - split disjoint (aucune adresse dans les deux canaux) ;
  - somme push + claim + poussière = total ;
  - calcul du complément d'approvisionnement ;
  - reprise d'`advanceRound` après un crash à chaque étape, sans double
    disbursement ni double funding ;
  - `rerouteFailed` ;
- `lib/sdp.test.ts` : mapping des statuts SDP → payout, et le 409 converti
  en `SdpInsufficientBalanceError`.

Documentation :
- `docs/stellar/sdp.md` : architecture du split, déploiement Coolify, procédure
  d'init, rotation de la clé API, récupération du compte de distribution ;
- `OPERATIONS.md` du repo contracts, section « Distributions » : le runbook
  passe de « create_cycle + distribute_for » à « round : approvisionnement →
  claim → SDP », avec la conduite à tenir sur `attention` ;
- `README.md` du repo contracts : un paragraphe qui situe le SDP par rapport
  au distributor, pour le reviewer du grant.

---

## 4. Séquencement

```
Phase 0  WS-0 spike local                                  ~1 j
Phase 1  WS-1 SDP Coolify  ║  WS-2 prérequis testnet        ~1–2 j
         WS-3 schéma                                        ~0,5 j
Phase 2  WS-4 orchestration  →  WS-5 synchro                ~3–4 j
Phase 3  WS-6 lecture + console + UI                         ~2 j
Phase 4  WS-7 rounds testnet + E2E  ║  WS-8 tests + docs     ~2 j
                                                     total  ~10–12 j
```

Dépendances :
- WS-0 conditionne D5, D8 et D9, donc la forme de WS-2 et WS-4 ;
- WS-1 et WS-2 bloquent WS-7 ;
- WS-3 bloque WS-4 ;
- WS-4 bloque WS-5 et WS-6.

---

## 5. Risques et questions ouvertes

- **Échéance dépassée** (3 octobre). À annoncer à la SDF, avec une date
  réaliste issue du séquencement ci-dessus.
- **Ressources Coolify** : 4 Go annoncés pour la stack SDP. Si le serveur
  actuel est juste, il faudra une machine dédiée ou une mise à niveau. Mesuré
  en WS-0.
- **Garde de la clé du compte de distribution** : le SDP la détient chiffrée
  en base. Elle est mitigée par un solde maintenu au minimum (D4) et un
  compte dédié. Pour un éventuel mainnet, réactiver la MFA du dashboard et
  restreindre son accès (IP / basic auth Coolify).
- **Double paiement par chevauchement** : il est impossible par construction
  (D1, ensembles disjoints, testé en WS-8). Seul risque restant : un
  disbursement créé deux fois par une reprise mal gardée. D'où l'écriture de
  `sdpDisbursementId` avant le PATCH, et le nom du disbursement qui contient
  le `roundId`, ce qui permet de détecter un doublon dans le dashboard SDP.
- **Changement d'adresse d'un holder** : avec D3, une nouvelle adresse donne
  un nouveau receiver. Aucun cas de « mismatch » possible.
- **Montée de version du SDP** : le changelog montre des ruptures entre
  versions majeures (Kafka retiré, renommages de champs). Épingler `7.0.0` et
  relire le changelog avant toute mise à jour.
- **E2E** : dépend de MoneyGram (validé en sandbox non-custodial le
  2026-09-16) et d'Alfred (clés sandbox non reçues au 2026-10-05). Le maillon
  SDP n'en dépend pas, mais la vidéo E2E si.
- **Mainnet (D7)** : la stack mainnet sert TFW_001, qui distribue déjà des
  revenus réels via le distributor. Le coût marginal est faible (même
  compose, nouveau compte de distribution).

---

## 6. Traçabilité des critères

| Critère | Où | Preuve |
|---|---|---|
| SDP integrated and tested | WS-1, WS-4, WS-5, WS-8 | Instance Coolify, code `lib/sdp*.ts`, tests vitest |
| Revenue distributions executed to multiple token holders | WS-7 rounds 1–3 | Ids de disbursement, export CSV, liens Stellar Expert |
| E2E fiat → asset → distribution → fiat | WS-7 §4 | Vidéo + tx de chaque étape |
| *(bonus 2.1)* Distribution engine deployed on testnet | WS-2 §2 | Id du distributor testnet + cycle claim du round 1 |
