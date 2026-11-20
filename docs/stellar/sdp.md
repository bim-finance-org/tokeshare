# Stellar Disbursement Platform (SDP) — déploiement et exploitation

Le SDP est le canal de **push** des distributions de revenus. Le calcul (qui
reçoit combien) reste chez nous ; le distributor Soroban ne sert plus qu'au
**claim** des holders sans trustline USDC. Conception :
`tranche-2-sdp-plan.md`. Code : `lib/sdp.ts`, `lib/sdp-csv.ts`,
`lib/stellar-rounds.ts`.

## Principe

```
console ── preview ──> snapshot (indexer + balances relues)
        ── execute ──> round
                       ├─ holders avec trustline USDC → disbursement SDP (1 tx / holder)
                       └─ holders sans                → cycle distributor (claim)
worker  ── toutes les 60 s ──> statut des paiements SDP → DistributionPayout
```

- **Un SDP par réseau.** La passphrase réseau du SDP est globale : TRES
  (testnet) et TFW_001 (mainnet) ont chacun leur stack, construite à partir du
  même `deploy/sdp/docker-compose.yml`.
- **Un réseau sans SDP** (`SDP_<NET>_BASE_URL` vide) garde le comportement de
  l'étape 1 : un cycle distributor pour tout le monde, `distribute_for` en
  push. On peut donc brancher le SDP réseau par réseau.
- **Mode « adresses connues »** (`EMAIL_AND_WALLET_ADDRESS`) : aucune
  inscription, aucun message aux holders. L'email exigé par le SDP est
  synthétique (`<adresse>@holders.tokeshare.co`) : on n'envoie aucune donnée
  personnelle.

## 1. Déployer une stack SDP (une fois par réseau)

1. **Secrets** : `npm run sdp:secrets -- testnet --fund` (ou `mainnet`, sans
   `--fund`). Le script affiche les variables ; rien n'est écrit sur disque.
   Garder une copie dans le coffre de l'équipe — perdre
   `DISTRIBUTION_ACCOUNT_ENCRYPTION_PASSPHRASE` rend la clé de distribution
   illisible pour le SDP.
2. **Compte de distribution** (`DISTRIBUTION_PUBLIC_KEY`) : compte dédié,
   jamais le compte opérateur du distributor.
   - testnet : `--fund` le crédite via friendbot ;
   - mainnet : lui envoyer ~10 XLM (réserve de base, trustline USDC, 2 channel
     accounts sponsorisés, frais).
3. **Coolify** : nouvelle ressource *Docker Compose* depuis ce repo, fichier
   `deploy/sdp/docker-compose.yml`. Coller les variables de l'étape 1 + celles
   de `deploy/sdp/.env.example` (URLs, réseau).
4. **Domaines** : `sdp-api` → port 8000, `sdp-frontend` → port 80. Ne rien
   mapper d'autre (le port 8003 est l'API admin des tenants).
5. **Démarrage** : `sdp-api` applique les migrations et crée le tenant par
   défaut à chaque boot (idempotent) ; `sdp-tss` crée ses 2 channel accounts.
   Le provisioning du tenant pose la trustline USDC sur le compte de
   distribution.

## 2. Créer le compte de connexion au dashboard (une fois)

`tenants ensure-default` crée un owner sans mot de passe utilisable ; on ajoute
le vrai compte à la main, depuis le terminal Coolify :

```sh
# conteneur sdp-db : id du tenant par défaut
psql -U postgres -d sdp -tAc "SELECT id FROM tenants WHERE is_default"

# conteneur sdp-api : le mot de passe est lu sur stdin
echo '<mot de passe>' | ./stellar-disbursement-platform auth add-user \
  ops@tokeshare.co Ops Tokeshare --password --owner --roles owner --tenant-id <id>
```

**Connexion et MFA.** Sur mainnet, le SDP refuse de démarrer si la MFA est
désactivée (`MFA cannot be disabled in pubnet`) : `SDP_DISABLE_MFA=false`.
Aucun fournisseur d'email n'est branché (`EMAIL_SENDER_TYPE=DRY_RUN`), donc
le code envoyé à la connexion n'est pas expédié : il apparaît dans les logs
du conteneur `sdp-api`. Seuls les admins Coolify peuvent donc se connecter.

## 3. Clé API et asset (une fois)

Dans le dashboard SDP (`sdp-frontend`), connecté avec le compte ci-dessus :

1. **Assets** : vérifier que l'USDC du réseau est présent — même code et même
   issuer que `pay` dans `config/stellar.ts` — et noter son **id**.
2. **API keys** : créer une clé `tokeshare-console` avec **uniquement**
   `read:disbursements` et `write:disbursements`, restreinte à l'IP sortante
   du serveur Coolify. La clé (`SDP_…`) n'est affichée qu'une fois.

## 4. Brancher tokeshare

Sur **l'app Next et sur le worker indexer** (les deux parlent au SDP) :

```
SDP_<NET>_BASE_URL=https://sdp-api-<net>.tokeshare.co
SDP_<NET>_API_KEY=SDP_…
SDP_<NET>_DISTRIBUTION_ADDRESS=G…            (sortie de sdp:secrets)
SDP_<NET>_ASSET_ID=<id de l'USDC>            (étape 3)
SDP_<NET>_DASHBOARD_URL=https://sdp-<net>.tokeshare.co
```

Déployer le front applique la migration `20261120000000_distribution_rounds`
(`prisma migrate deploy`) : les cycles existants deviennent des rounds
`contract` déjà réglés.

## 5. Exploitation

**Un versement** : console dashboard → *Preview snapshot* → vérifier le
tableau (canal par holder, complément à envoyer au compte SDP) → *Distribute*.
Le serveur enchaîne, en enregistrant chaque étape avant la suivante :

1. complément exact USDC opérateur → compte SDP (memo = id du round) ;
2. cycle distributor pour les holders sans trustline ;
3. disbursement SDP (nom = actif · date · id du round), puis démarrage.

**Round « stopped »** : une étape a échoué (SDP injoignable, RPC lent, solde
insuffisant…). Le message est affiché ; *Resume round* reprend là où ça s'est
arrêté sans rien refaire de ce qui a déjà eu lieu.

**Round « attention »** : au moins un paiement SDP en échec (trustline retirée
entre le preview et l'envoi, compte supprimé…). *Move failed payments to claim*
crée un cycle distributor pour exactement ces lignes ; les holders les
réclament depuis leur portefeuille. L'USDC resté sur le compte SDP est déduit
du complément suivant.

> ⚠️ Ne **jamais** relancer depuis le dashboard SDP un paiement déjà basculé en
> claim : le holder serait payé deux fois. Le SDP n'a pas de transition
> FAILED → CANCELED, donc on ne peut pas l'empêcher côté SDP ; le worker
> détecte ce cas et la console l'affiche en rouge (« double payment »).

**Suivi** : le worker synchronise les rounds en cours toutes les
`SDP_SYNC_SECONDS` (60 s) ; `/health` du worker expose `sdpSync` (erreurs
comprises) sans jamais passer en 503 à cause du SDP.

## Mise à jour du SDP

Images épinglées en `7.0.0`. Avant de monter de version, lire le
[CHANGELOG](https://github.com/stellar/stellar-disbursement-platform-backend/blob/develop/CHANGELOG.md) :
les versions majeures ont déjà retiré des composants et renommé des champs de
l'API.
