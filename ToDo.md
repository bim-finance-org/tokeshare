# TODO

- [ ] **Créer un fichier centralisé pour toutes les addresses**
  - Ajouter les adresses de tous les tokens/chains utilisés (ex : TGG, PAXG, stablecoins, etc.)
  - Associer à chaque adresse le nombre de décimales correspondant
  - Exemple :
    ```ts
    export const TOKENS = {
      USDT: { address: '0x...', decimals: 6 },
      USDC: { address: '0x...', decimals: 6 },
      TGG: { address: '0x...', decimals: 18 },
      // ...
    };
    ```

- [ ] **Checker la balance lors du Swap et du Sell**
  - Vérifier que l’utilisateur possède assez de tokens **avant** d’envoyer la transaction
  - Si la balance est insuffisante, afficher une erreur claire à l’utilisateur

- [ ] **Mettre en place plusieurs RPC de secours**
  - Utiliser plusieurs endpoints RPC en fallback pour éviter les erreurs réseau uniques
  - En cas d’échec sur un RPC, retenter la requête sur un endpoint secondaire/tertiaire

- [ ] **Déplacer tout les toFixed dans les composant**
  - Gérer la longueur afficher dans les composants
  - Faire en sorte que les amounts soit des number ?

---
