# Stellar Tranche 3 — Mainnet Launch & Liquidity Layer + Production Platform & Ecosystem Metrics

Rédigé le 2026-11-28. Branches proposées : une par workstream (voir §3), toutes
fusionnées par PR sur `master`.

Ce plan couvre les deux livrables de la tranche 3 du grant Stellar :

- **3.1 — Mainnet Launch & Liquidity Layer** (34 800 $, échéance 10 novembre 2026)
- **3.2 — Production Platform & Ecosystem Metrics** (14 200 $, échéance 24 novembre 2026)

Les deux échéances sont **dépassées** à la date de rédaction. À signaler à la
SDF si ce n'est pas déjà fait.

En une phrase : il reste à construire le pont CCTP (USDC depuis Base), le
marché secondaire (un pool Soroswap et un pool Aquarius pour TFW_001), le
tableau de métriques public et la documentation technique publique. Le reste
des critères est déjà couvert ou sera prouvé par les tests réels de la
tranche 2.

---

## 0. Point de départ

### Acquis (en production sur mainnet)

| Élément | Référence |
|---|---|
| Token RWA `TFW_001` (SEP-41, allowlist, 7 décimales, 100 parts) | `CC2MTI3REEQUMDJYOLQHK4D6GPGSTGPZOWH3G75SECSOTOH7L7GGLG5O` |
| Contrat de vente v2 (prix 50 USDC, frais 5 %, `auto_allow`) | `CAFYUWC2U7GX4DNG6JRZLPYDNXDOLJNHP5RWVAMOTOA5QO75N4B56X45` |
| Distributor (claim par preuve de Merkle) | `CD5G6SFEJZOIADCGKFNZ3HPX3RCHHUVBQLJG3XRMGE3ENNTGWKEDSYJE` |
| Compte opérateur (admin du token, de la vente, du distributor ; sponsor de frais) | `GCBHFIQNNXYC6AVKCFAC3I6EN3E2ZDNBIQ6RUSZDS2IMYVRXAWZH3OYZ` |
| Compte de versement SDP | `GDKY6DB53WHFGGKBFPT6VDIGD7QTUPAOZFHONVPXTXXUVGFRLUV24WAQ` |
| USDC mainnet (Circle) | émetteur `GA5ZSEJY…KZVN`, SAC `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| Indexeur (worker Coolify), API publique, console opérateur, rounds SDP | tranche 2, `docs/stellar/tranche-2-plan.md` et `tranche-2-sdp-plan.md` |
| Rampes fiat : MoneyGram (SEP-10/24), Alfred (retrait MXN) | tranche 2 |
| Wallets : Stellar Wallets Kit + Privy ; côté EVM : Reown AppKit + wagmi (Polygon, Base, Ethereum) | `context/`, `config/index.tsx` |
| SDK | `@stellar/stellar-sdk` 17.4 (protocole 28), Node ≥ 22.12 |

État lu sur la chaîne le 2026-11-28 : 99,97 parts encore dans le contrat de
vente, un seul détenteur réel (0,03 part), 34,10 USDC et 15,6 XLM sur le compte
opérateur.

### Ce qui n'existe pas encore

Rien n'est codé pour CCTP, Soroswap, Aquarius ni pour le tableau de métriques :
leurs seules traces sont des logos dans `components/features/partners/partnersData.ts`.
La documentation existante est interne et en français (`docs/stellar/`), plus le
README et `docs/` du repo public `tokeshare-stellar-contracts`.

### Dépendance avec la tranche 2

Les tests réels et la vidéo de la tranche 2 ne sont pas encore faits (aucun
round SDP exécuté, aucun retrait Alfred, un seul détenteur). Trois critères de
la tranche 3 en dépendent directement : « real investors holding tokenized
assets », « first USDC revenue distribution executed », et les parcours fiat de
3.2. Ils ne demandent pas de code, mais ils conditionnent la preuve finale.

### Décisions du client (Léo, 2026-11-28)

1. **Marché secondaire : validé juridiquement.** Motif donné : « pas de
   on/off ramp ». Voir la réserve en §7.
2. **CCTP : Base et Polygon, Base en priorité.**
3. **Liquidité : 100 USDC et l'équivalent en parts.** Précisé ensuite par
   Adrien : **deux pools, 50 USDC chacun** (« 50 € » dans le message, compris
   comme 50 USDC), soit 1 part de TFW_001 par pool au prix de 50 USDC.

---

## 1. Faits vérifiés

Vérifiés le 2026-11-28 dans la documentation officielle et le code source des
protocoles. Ce qui n'a pas pu l'être est marqué **[à vérifier]** et traité dans
la phase 0 (WS-0).

### CCTP (Circle)

- CCTP V2 est actif sur le **mainnet Stellar** (domaine **27**) depuis mai 2026.
- Contrats Stellar mainnet :
  - `TokenMessengerMinter` `CAE2G5Z77UP7GYPYGFOWFGW7C7J6I4YP2AFGSADRKQY62SYUFLPNFTXL`
  - `MessageTransmitter` `CACMENFFJPJMSDAJQLX4R7K3SFZIW2LJSE3R2UMLGSWHFHS353FVXAZV`
  - `CctpForwarder` `CBZL2IH7F6BIDAA3WBNXYKIXSATJGMSW7K5P5MJ6STX5RXN47TZJDF5T`
- Contrats EVM mainnet, identiques sur Base (domaine **6**) et Polygon PoS
  (domaine **7**) : `TokenMessengerV2` `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d`,
  `MessageTransmitterV2` `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64`.
- **Vers Stellar, il faut passer par `CctpForwarder`** : sur le burn EVM,
  `mintRecipient` **et** `destinationCaller` valent l'adresse du forwarder
  (32 octets), et le vrai destinataire est encodé dans `hookData` sous forme de
  strkey (`G…`, `M…` ou `C…`). Si l'un des deux champs est faux, les fonds sont
  **définitivement perdus** (avertissement de Circle ; cas réel :
  circlefin/stellar-cctp#35, 20 USDC).
- Format de `hookData` : octets 0–23 à zéro, 24–27 version (`0`), 28–31
  longueur `L` du strkey, puis le strkey en UTF-8.
- Côté Stellar, on finalise avec `CctpForwarder.mint_and_forward(message,
  attestation)` : mint puis transfert au destinataire, atomiques. **L'appel est
  ouvert à tous** : n'importe quel compte peut le soumettre.
- Le « Forwarding Service » de Circle (relais automatique) **n'existe pas pour
  Stellar** : c'est à nous de soumettre `mint_and_forward`.
- Un compte `G…` destinataire doit avoir une **trustline USDC**, sinon l'appel
  échoue (il peut être rejoué après ouverture de la trustline).
- Précision : le montant d'un message CCTP est toujours en 6 décimales ; Stellar
  multiplie par 10 au mint (USDC à 7 décimales).
- Délais d'attestation : depuis **Base**, transfert standard ≈ 15 à 19 min,
  transfert rapide ≈ 8 s (payant). Depuis **Polygon**, standard ≈ 8 s (pas de
  transfert rapide). Les transferts standard USDC sont gratuits.
- Attestations : API Iris, `GET https://iris-api.circle.com/v2/messages/{domaineSource}?transactionHash=…`
  (sandbox : `iris-api-sandbox.circle.com`). Pour un message impliquant Stellar,
  les champs d'adresse décodés sont `null` : il faut parser le `message` brut.

### Soroswap

- Mainnet : factory `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`,
  router `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`.
- AMM à produit constant, frais de 0,30 %. `MINIMUM_LIQUIDITY = 1000` unités de
  parts LP verrouillées au premier dépôt (négligeable ici).
- Lu dans le code du router : `add_liquidity` crée la paire si elle n'existe pas,
  et tous les transferts vont **directement de l'utilisateur vers la paire**
  (`transfer(to, pair, …)`). Le router ne détient jamais les tokens.
- L'**agrégateur v3** (`CARVQXFP…DDC4`, celui de l'API `api.soroswap.finance`)
  fonctionne autrement : il **prend les tokens en dépôt** (`transfer(user,
  aggregator, amount_in)`) et prélève sa commission (10 points de base) **sur le
  token d'entrée**, versée à sa trésorerie `CCIGFRCE…VASK`.

### Aquarius

- Mainnet : router AMM `CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK`,
  API `https://amm-api.aqua.network/api/external/v2` (`/find-path/`,
  `/find-path-strict-receive/`, `/pools/`).
- Créer un pool coûte **300 000 AQUA** (`AQUA:GBNZILST…AQUA`), payés au moment de
  `router.init_standard_pool(user, tokens, fee_fraction)`. Au cours du
  2026-11-28 (0,000207 $), cela fait **environ 62 $**. Le montant exact se lit
  sur le router (`get_standard_pool_payment_amount`).
- Pool « volatile » (produit constant), frais au choix : 0,1 %, 0,3 % ou 1 %.
- Dépôt : `token.transfer(user, pool, …)`, direct vers le pool.
- Échange par le router (`swap`, `swap_chained`) : `token_in.transfer(user,
  router, in_amount)`. **Le router détient le token d'entrée** le temps de
  l'échange.
- Tokens non supportés : frais au transfert, déflationnistes. TFW_001 n'est ni
  l'un ni l'autre.
- SDK officiel `@aquariusdefi/sdk` : Node ≥ 22.12 et `@stellar/stellar-sdk` 17.4+,
  ce qui correspond à notre configuration.

### Token TFW_001 et contrat de vente

- Le token vérifie l'allowlist sur l'expéditeur **et** le destinataire de chaque
  transfert (erreur `#113 UserNotAllowed`), plus blocklist (`#114`), gel et pause.
- Le contrat de vente autorise automatiquement l'acheteur au premier achat
  (`auto_allow = true`).
- L'admin peut retirer des parts du stock de la vente : `sale.withdraw_tres(to, amount)`.
- Le snapshot de distribution exclut déjà le contrat de vente, le compte
  opérateur et les adresses de `STELLAR_SNAPSHOT_EXCLUDE` (`lib/stellar-admin.ts`).

### [à vérifier] en phase 0

- Sens exact des transferts de sortie chez Aquarius (pool → utilisateur ou
  pool → router → utilisateur).
- Destination de la part « protocole » des frais d'un pool Aquarius quand elle
  est libellée en TFW_001 (adresse non autorisée → la collecte échouerait-elle
  sans gêner les échanges ?).
- `router_pair_for` de Soroswap : renvoie-t-il l'adresse déterministe d'une paire
  pas encore créée ?
- Événements émis par la paire Soroswap et le pool Aquarius (noms, topics,
  présence de l'adresse de l'utilisateur), pour l'indexeur.
- Le compte opérateur est-il lui-même sur l'allowlist de TFW_001 (`allowed`) ?
- Le « Standard Transfer fee switch » de Circle est-il actif sur Base (frais
  minimum imposé même en standard) ? Se lit avec l'API des frais.
- Compatibilité de la signature Privy avec les invocations des routers.

---

## 2. Décisions d'architecture

### D1 — CCTP : Base d'abord, transfert standard, toujours via `CctpForwarder`

Le burn se fait sur Base avec `TokenMessengerV2.depositForBurnWithHook`, en
transfert **standard** (`minFinalityThreshold = 2000`, gratuit, sans expiration
du message). Le transfert rapide (≈ 8 s, payant, message qui expire) est une
option ultérieure derrière un drapeau, pas le parcours par défaut. Polygon
réutilise le même code : seuls changent le domaine, l'identifiant de chaîne et
l'adresse USDC.

### D2 — Les arguments du burn sont construits à un seul endroit, testé

Une seule fonction pure construit `mintRecipient`, `destinationCaller` et
`hookData` à partir du destinataire Stellar. L'adresse du forwarder est une
constante par réseau, jamais une saisie. Tests unitaires avec des vecteurs
fixes (octets attendus), dont le cas d'erreur de l'issue #35. L'interface ne
laisse pas modifier ces champs.

### D3 — Finalisation côté Stellar par notre serveur, frais pris en charge

`mint_and_forward` étant ouvert à tous, notre serveur le soumet avec le compte
sponsor de frais : l'investisseur n'a besoin d'aucun XLM. Le serveur ne fait
jamais confiance au message envoyé par le navigateur : à partir du hash du burn,
il récupère lui-même message et attestation chez Iris, puis vérifie avant de
soumettre que le domaine de destination est 27, que `mintRecipient` et
`destinationCaller` sont bien le forwarder, et que le burn vient d'une de nos
chaînes. Limite de débit sur la route pour protéger le XLM du sponsor.

### D4 — Vérifications avant le burn

L'interface refuse de lancer le burn tant que le compte Stellar destinataire
n'existe pas ou n'a pas de trustline USDC (ouverture sponsorisée déjà en place
pour le claim). Montant minimum (1 USDC) et affichage du délai attendu.

### D5 — Chaque transfert CCTP est persisté et reprenable

Modèle Prisma `CctpTransfer` (chaîne source, hash du burn, montant,
destinataire, statut `burned → attested → minted | failed`, hash Stellar).
Le navigateur peut être fermé pendant les 15 à 19 minutes d'attente : le worker
reprend les transferts en cours et les finalise.

### D6 — Marché secondaire : appels directs aux routers, pas l'agrégateur Soroswap

L'agrégateur Soroswap prélève sa commission dans le token d'entrée. Pour une
vente de TFW_001, il faudrait donc autoriser sa trésorerie à détenir des parts :
inacceptable pour un actif à allowlist. On appelle donc directement :

- le **router Soroswap** (`swap_exact_tokens_for_tokens`, `add_liquidity`) ;
- le **router Aquarius** (`swap` / `swap_chained`, `deposit`), avec son API
  `find-path` pour le routage.

Le « meilleur prix » entre les deux pools est calculé chez nous (D9).

### D7 — Allowlist : trois contrats autorisés, pas un de plus

Sont ajoutés à l'allowlist de TFW_001 : la **paire Soroswap**, le **pool
Aquarius** et le **router Aquarius** (qui détient le token d'entrée pendant un
échange). Le router Soroswap n'en a pas besoin. Ces adresses sont décrites dans
un registre `venues` de `config/stellar-assets.ts`, source de vérité unique pour
l'allowlist, l'indexeur, les snapshots et l'interface. Conséquence voulue : seul
un investisseur autorisé peut recevoir des parts d'un pool, quel que soit
l'outil utilisé.

### D8 — Les pools sont exclus des distributions de revenus

**À livrer avant la création des pools.** Un pool détient des parts ; sans
exclusion, le prochain round lui verserait des USDC (qu'un tiers pourrait
ensuite récupérer sur la paire Soroswap via `skim`). Les adresses du registre
`venues` rejoignent le contrat de vente et l'opérateur dans l'ensemble exclu du
snapshot. Les parts placées en pool ne touchent donc pas de revenus pendant
qu'elles y sont ; c'est assumé et documenté.

### D9 — Routage : devis sur les deux pools, exécution sur le meilleur

Pour un échange TFW_001 ↔ USDC, le serveur demande un devis aux deux (simulation
`router_get_amounts_out` chez Soroswap ; `find-path` chez Aquarius) et propose le
meilleur, avec le prix, l'impact et les frais affichés. `find-path` permet aussi
un échange multi-sauts via Aquarius (par exemple XLM → USDC → TFW_001).

### D10 — Qui peut échanger

Une adresse autorisée par un achat sur le contrat de vente peut échanger
librement. Les autres sont autorisées à la main depuis la console opérateur
(nouveau bouton « Allow address », journalisé). L'auto-autorisation en
libre-service au premier échange est une question ouverte (§7), pas le
comportement par défaut.

### D11 — Liquidité initiale et prix

Deux pools, chacun avec **50 USDC + 1 part de TFW_001**, soit un prix initial de
50 USDC, identique au contrat de vente. Les 2 parts sont retirées du stock de la
vente par l'admin (`withdraw_tres`), sans achat. Frais : 0,30 % sur Soroswap
(fixe) et 0,30 % sur Aquarius. Les parts LP restent sur le compte opérateur.
Avec une liquidité aussi faible, un échange de 0,1 part déplace déjà le prix
d'environ 20 % : ces pools servent de preuve de fonctionnement, pas de marché
profond. Le contrat de vente (achat à 50 USDC + 5 %) borne le prix par le haut.

### D12 — Frais des échanges pris en charge pour les utilisateurs Privy

Le relais fee-bump existant n'accepte aujourd'hui que deux formes de transaction
(claim, trustline USDC). On y ajoute, de façon tout aussi stricte, les appels
aux deux routers sur nos deux pools. Tout autre appel reste refusé.

### D13 — Indexation : les pools sont des « lieux d'échange » comme la vente

`StellarTrade` gagne une colonne `venue` (`sale`, `soroswap`, `aquarius`). Les
échanges sont dérivés des événements des pools si ceux-ci portent l'adresse de
l'utilisateur, sinon des transferts TFW_001 dont un pool est une extrémité,
appariés au transfert USDC de la même transaction (mécanisme déjà utilisé pour
la vente). Les adresses du registre `venues` sont marquées dans `StellarHolder`
et ne comptent pas comme investisseurs.

### D14 — Métriques : définitions publiques et historique journalier

- **TVL** = valeur des parts détenues par les investisseurs (solde × dernier
  prix) + liquidité des deux pools (USDC + parts valorisées). La valorisation
  totale de l'actif tokenisé est affichée à part.
- **Détenteurs** = adresses avec un solde > 0, hors vente, opérateur et `venues`.
- **Transactions** = achats et rachats primaires, échanges secondaires,
  versements et claims, transferts CCTP, opérations de rampe.
- **Volume** = USDC échangés (primaire et secondaire), distribués, bridgés.

Un relevé journalier (`StellarMetricDaily`), écrit par le worker, donne
l'historique des courbes. Les définitions sont publiées sur la page.

### D15 — Documentation publique en anglais, dans le repo public

La documentation technique est publiée dans `tokeshare-stellar-contracts/docs/`
(repo public du grant) et liée depuis le site. Les plans internes de
`docs/stellar/` restent en français et ne sont pas le livrable.

### D16 — Mainnet uniquement, sauf une répétition CCTP sur testnet

Conformément au choix fait en tranche 2. Exception : un burn CCTP mal formé est
irréversible, donc le script de transfert est d'abord joué de Base Sepolia vers
le testnet Stellar, puis sur mainnet avec 1 USDC.

---

## 3. Workstreams

### WS-0 · Vérifications préalables — **prérequis**

Branche : aucune (scripts jetables, résultats consignés dans ce fichier).

1. Lever chaque point **[à vérifier]** de §1 par lecture du code ou simulation
   mainnet en lecture seule.
2. Lire sur le router Aquarius le montant et le token du paiement de création.
3. Lire `allowed(opérateur)` sur TFW_001 ; lire `quote` et `quote_sell` de la
   vente pour chiffrer les bornes de prix.
4. Vérifier qu'une invocation des routers se signe avec Privy et avec Wallets Kit.
5. Créer un compte développeur Circle si une clé est requise pour Iris en
   production (l'API publique n'en demandait pas à la date de rédaction).

Critère de sortie : §1 ne contient plus de **[à vérifier]**, ou la décision
concernée est révisée.

### WS-A · Pont CCTP (Base → Stellar)

Branche : `feat/stellar-cctp`.

- `config/cctp.ts` : domaines, adresses des contrats par réseau, chaînes EVM
  activées (`NEXT_PUBLIC_CCTP_CHAINS`, défaut `base`).
- `lib/cctp/encode.ts` : `stellarContractToBytes32`, `buildForwarderHookData`,
  `prepareDepositForBurn` (D2) et le décodage d'un message brut. Tests unitaires
  à vecteurs fixes.
- `lib/cctp/iris.ts` : client Iris (message, attestation, statut), avec reprise.
- `lib/cctp/relay.ts` : contrôles de D3, puis `mint_and_forward` signé par le
  sponsor ; détection « déjà finalisé » (nonce utilisé) pour l'idempotence.
- Prisma : modèle `CctpTransfer` + migration (D5).
- Routes : `POST /api/stellar/cctp/transfers` (enregistre un burn),
  `GET /api/stellar/cctp/transfers?address=…` (suivi),
  `POST /api/stellar/cctp/transfers/[id]/relay` (relance manuelle).
- Worker : boucle qui fait avancer les transferts `burned` et `attested`.
- Interface : `hooks/useCctpBridge.ts` (approve + burn avec wagmi) et
  `components/features/stellar/CctpBridgePanel.tsx`, affiché sur la page d'un
  actif et dans le tableau de bord. États : connexion du wallet EVM, contrôle de
  la trustline, approbation, burn, attente de l'attestation avec délai estimé,
  USDC reçus.
- `scripts/cctp.ts` : transfert en ligne de commande (répétition testnet, puis
  pilote mainnet).
- Polygon : ajout de la configuration une fois Base validé.

Critères d'acceptation : répétition testnet réussie ; 1 USDC puis un montant
réel transférés de Base vers un compte Stellar mainnet ; un transfert interrompu
(navigateur fermé) est finalisé par le worker ; un destinataire sans trustline
est refusé avant le burn.

### WS-B · Préparation du token au marché secondaire

Branche : `feat/stellar-venues`. **À fusionner et déployer avant WS-C.**

- `config/stellar-assets.ts` : registre `venues` par actif (type, adresse du
  pool, adresse du router si elle doit être autorisée).
- `lib/stellar-admin.ts` : le snapshot exclut les `venues` (D8), avec test.
- Console : bouton « Allow address » et liste des adresses autorisées à la main
  (D10) ; route admin correspondante, signée par l'opérateur.
- Relais fee-bump : formes de transaction supplémentaires (D12), avec tests.
- Repo contrats : `scripts/allowlist.sh` documenté pour les contrats de pool.

Critères d'acceptation : un Preview de round avec une adresse de pool factice
dans le registre montre cette adresse dans « Excluded ».

### WS-C · Création des deux pools (opérations mainnet)

Pas de branche : exécution d'un runbook, puis mise à jour du registre `venues`.

Préparation du compte opérateur : 100 USDC supplémentaires ; trustline AQUA et
300 000 AQUA (plus une marge) ; XLM pour les frais ; `sale.withdraw_tres` de
2 parts vers l'opérateur (qui doit être autorisé sur le token).

Soroswap, dans cet ordre :
1. `factory.create_pair(TFW_001, USDC)` → adresse de la paire.
2. `token.allow_user(paire)`.
3. `router.add_liquidity` : 1 part + 50 USDC.
4. Devis et un échange de test de faible montant dans chaque sens.

Aquarius, dans cet ordre :
1. `router.init_standard_pool(opérateur, [tokens triés], 0,30 %)` → adresse du
   pool (paiement de 300 000 AQUA).
2. `token.allow_user(pool)` et `token.allow_user(router Aquarius)`.
3. `router.deposit` : 1 part + 50 USDC.
4. `find-path` renvoie le pool ; un échange de test dans chaque sens.

Puis : adresses consignées dans `config/stellar-assets.ts`, dans
`STELLAR_SNAPSHOT_EXCLUDE` en attendant le déploiement, et dans la documentation.

Critères d'acceptation : les deux pools visibles sur stellar.expert avec leurs
réserves ; un échange réussi par pool ; un échange vers une adresse non
autorisée échoue avec `#113`.

### WS-D · Interface du marché secondaire

Branche : `feat/stellar-secondary-market`.

- `lib/stellar-swap/soroswap.ts` et `aquarius.ts` : devis et construction des
  transactions (évaluer `@aquariusdefi/sdk` ; sinon appels directs).
- `lib/stellar-swap/quote.ts` : meilleur devis entre les deux (D9), tests.
- Routes : `POST /api/stellar/swap/quote`, `POST /api/stellar/swap/build`.
- `hooks/useStellarSwap.ts`, `components/features/stellar/StellarTradePanel.tsx`
  sur la page de l'actif : onglets acheter et vendre, lieu retenu, prix, impact,
  frais, tolérance de glissement, message clair si l'adresse n'est pas autorisée.
- Affichage des réserves des deux pools et du prix de marché à côté du prix de
  vente primaire.

Critères d'acceptation : achat et vente réussis avec Wallets Kit et avec Privy,
sur chacun des deux pools ; le lieu proposé est bien le moins cher ; lint, types
et tests passent.

### WS-E · Indexation des échanges et des pools

Branche : `feat/stellar-indexer-venues`.

- Prisma : `StellarTrade.venue`, table `StellarPoolState` (réserves par pool),
  migration avec valeur `sale` pour l'existant.
- Worker : filtres d'événements étendus aux pools ; dérivation des échanges
  secondaires (D13) ; relevé des réserves ; marquage des `venues` dans les
  détenteurs.
- API : `/api/stellar/assets/[slug]/activity` expose le lieu d'échange ;
  `/api/stellar/assets/[slug]/pools` expose réserves et prix.

Critères d'acceptation : un échange de test apparaît dans `activity` avec le
bon lieu et le bon montant USDC en moins de deux minutes.

### WS-F · Tableau de métriques public

Branche : `feat/stellar-metrics`.

- `lib/stellar-metrics.ts` : calculs de D14 à partir de la base ; tests.
- Prisma : `StellarMetricDaily` ; tâche journalière dans le worker.
- `GET /api/stellar/metrics` (public, mis en cache, limité en débit).
- Page publique `app/stellar/metrics/page.tsx` : quatre chiffres clés (TVL,
  détenteurs, transactions, volume), courbes dans le temps, détail par actif et
  par lieu d'échange, adresses des contrats avec liens stellar.expert,
  définitions des métriques. Lien dans la navigation et le pied de page.
- Optionnel : adaptateur DefiLlama pour la TVL.

Critères d'acceptation : la page est accessible sans connexion, chaque chiffre
se recoupe avec la chaîne, et elle reste lisible avec peu de données.

### WS-G · Documentation technique publique

Branche : `docs/platform` dans `tokeshare-stellar-contracts`, plus un lien côté
site.

En anglais : vue d'architecture ; contrats et adresses mainnet ; intégrations
(CCTP, Soroswap, Aquarius, SDP, MoneyGram, Alfred, Privy, Wallets Kit) ;
référence de l'API publique ; modèle de conformité (allowlist, lieux
d'échange) ; définitions des métriques ; exploitation. Mise à jour du README.

Critères d'acceptation : un lecteur extérieur retrouve chaque contrat sur
stellar.expert et peut appeler chaque route publique à partir de la doc.

### WS-H · Publication des adresses et vérification des contrats

- Adresses publiées dans le README, la documentation et la page de métriques.
- Demande d'ajout au répertoire de Stellar Expert (noms lisibles des contrats).
- Tentative de vérification du code source : compilation par le workflow GitHub
  de Stellar Expert et comparaison des hashes avec ceux déployés. Si les hashes
  ne correspondent pas (compilation d'origine non reproductible), on documente
  les hashes et la procédure de build sans redéployer.

### WS-I · Exécution réelle et preuve

1. Tests réels de la tranche 2 (détenteurs, rounds SDP, MoneyGram, Alfred).
2. Parcours crypto : USDC de Base → Stellar par CCTP → achat → échange sur un
   pool → versement reçu.
3. Parcours fiat : Privy + MoneyGram → achat → versement → retrait Alfred.
4. Checklist de tournage de la tranche 3, sur le modèle de celle de la tranche 2.

---

## 4. Séquencement

```
WS-0 ──┬─> WS-A (CCTP) ───────────────────────────────┐
       ├─> WS-B (venues, exclusion) ─> WS-C (pools) ─┬─> WS-D (interface)
       │                                             └─> WS-E (indexeur) ─┐
       ├─> WS-F (métriques, première version sans pools) ─────────────────┴─> WS-F (finale)
       └─> WS-G (documentation) ──> WS-H ──> WS-I
```

| Workstream | Charge estimée | Dépend de |
|---|---|---|
| WS-0 Vérifications | 1 à 2 jours | — |
| WS-A CCTP | 4 à 5 jours | WS-0 |
| WS-B Préparation du token | 1 à 2 jours | WS-0 |
| WS-C Création des pools | 1 jour | WS-B déployé, fonds et AQUA disponibles |
| WS-D Interface secondaire | 4 à 5 jours | WS-C |
| WS-E Indexation | 2 jours | WS-C |
| WS-F Métriques | 2 à 3 jours | première version indépendante, finale après WS-E |
| WS-G Documentation | 2 à 3 jours | au fil de l'eau, finale après WS-D |
| WS-H Adresses et vérification | 1 jour | WS-C |
| WS-I Exécution et preuve | 1 à 2 jours, plus les délais des participants | tout |

Total : environ **20 à 26 jours** de travail. WS-A, WS-F et WS-G peuvent avancer
en parallèle des pools.

Contrainte d'ordonnancement : ne pas créer les pools au milieu du tournage de la
tranche 2, et jamais avant le déploiement de WS-B.

---

## 5. Fonds nécessaires

| Poste | Montant | Compte |
|---|---|---|
| Liquidité des pools | 100 USDC | opérateur |
| Parts mises en pool | 2 TFW_001 (retirées du stock de la vente) | opérateur |
| Création du pool Aquarius | 300 000 AQUA, ≈ 62 $ au 2026-11-28 | opérateur |
| Frais et réserves Stellar | ≈ 10 XLM de marge | opérateur |
| Tests CCTP | 1 USDC, puis un montant réel, plus un peu d'ETH sur Base pour le gaz | wallet EVM de test |
| Versements de revenus | déjà sur le compte (34,10 USDC) | opérateur |

---

## 6. Traçabilité des critères du grant

### Livrable 3.1

| Critère | Workstream | État au 2026-11-28 |
|---|---|---|
| CCTP transfer successfully executed from at least one EVM chain | WS-A | à faire |
| Soroswap liquidity pool created and operational | WS-B, WS-C, WS-D | à faire |
| Aquarius routing integrated and functional | WS-C, WS-D | à faire |
| All contracts deployed on Stellar mainnet | — | fait |
| At least one real-world asset tokenized on Stellar | — | fait (TFW_001) |
| Real investors holding tokenized assets | WS-I | un seul détenteur ; dépend des participants |
| First USDC revenue distribution executed | WS-I | pilote d'août ; rounds réels à exécuter |
| Contract addresses published on Stellar Expert | WS-H | visibles ; publication et vérification à faire |

### Livrable 3.2

| Critère | Workstream | État au 2026-11-28 |
|---|---|---|
| Production platform live on tokeshare.co | — | fait |
| Fiat onboarding flow operational (Privy + MoneyGram) | WS-I | codé ; preuve réelle à faire |
| Crypto-native onboarding flow operational (Wallets Kit + CCTP) | WS-A | Wallets Kit fait ; CCTP à faire |
| Secondary market trading operational (Soroswap + Aquarius) | WS-C, WS-D | à faire |
| Revenue distributions operational through SDP | WS-I | branché ; aucun round réel |
| Fiat withdrawals operational through alfredpay | WS-I | codé ; aucun retrait réel |
| Public metrics dashboard (TVL, holders, transactions, volume) | WS-E, WS-F | à faire |
| Technical documentation published | WS-G | à faire |

---

## 7. Risques et questions ouvertes

- **Perte de fonds sur un burn CCTP mal formé.** Irréversible. Réponses : D2
  (construction unique et testée), D4, répétition testnet et pilote à 1 USDC (D16).
- **Fondement juridique du marché secondaire.** La validation de Léo repose sur
  « pas de on/off ramp », alors que la plateforme en a (MoneyGram, Alfred), et la
  question porte sur l'échange entre investisseurs de parts d'un actif réel. À
  faire confirmer par écrit avant l'ouverture au public. L'allowlist (D7, D10)
  limite les échanges aux investisseurs autorisés.
- **Qui autorise un nouvel acheteur secondaire (D10).** Faut-il une
  auto-autorisation au premier échange, comme le fait la vente primaire ? Choix
  de conformité à faire par le client.
- **Liquidité symbolique (D11).** Prix très sensibles ; à dire clairement dans
  l'interface. Arbitrage possible avec la vente primaire, borné par ses frais.
- **Router Aquarius autorisé sur le token.** Il ne peut redistribuer des parts
  qu'à des adresses autorisées, mais c'est un contrat tiers évolutif : à
  surveiller, et à retirer de l'allowlist en cas d'incident (les échanges
  Aquarius s'arrêtent alors, sans risque pour les fonds des investisseurs).
- **Pause ou gel du token.** Une pause arrête aussi les deux pools.
- **Coût de création Aquarius.** Indexé sur le cours de l'AQUA ; à relire le jour J.
- **Clé opérateur.** Un seul signataire, présent sur le serveur, contrôle le
  token, la vente, le distributor et la liquidité des pools. Pour une plateforme
  « de production », prévoir un multisig ou une séparation des rôles.
- **Réconciliation des métriques.** Chaque chiffre publié doit pouvoir être
  recalculé depuis la chaîne ; les définitions (D14) sont publiées avec la page.
- **Vérification du code source (WS-H).** Dépend de la reproductibilité de la
  compilation d'origine ; pas de redéploiement pour l'obtenir.
- **Polygon.** Demandé en second ; même code que Base, à activer après validation.
- **Dépendance à la tranche 2.** Sans détenteurs réels ni rounds exécutés,
  trois critères de 3.1 et trois de 3.2 restent sans preuve.

---

## 8. Sources

- Circle, CCTP on Stellar : https://developers.circle.com/cctp/references/stellar
- Circle, contrats CCTP Stellar : https://developers.circle.com/cctp/references/stellar-contracts
- Circle, chaînes et domaines : https://developers.circle.com/cctp/concepts/supported-chains-and-domains
- Circle, adresses des contrats EVM : https://developers.circle.com/cctp/references/contract-addresses
- Circle, délais d'attestation : https://developers.circle.com/cctp/concepts/finality-and-block-confirmations
- Soroswap, contrats mainnet et code du router : https://github.com/soroswap/core
- Soroswap, agrégateur v3 : https://docs.soroswap.finance/aggregator/technical-reference/contracts/aggregator-v3
- Aquarius, adresses : https://docs.aqua.network/developers/reference/addresses-and-networks
- Aquarius, arbres d'autorisation : https://docs.aqua.network/developers/reference/contract-authorization
- Aquarius, création d'un pool : https://docs.aqua.network/user-guides/pools/creating-a-pool
- Aquarius, API : https://docs.aqua.network/developers/reference/backend-api
