# Maintenance

## 1. Objectif

Ce document décrit les principales procédures de maintenance du projet DataShare.

Il présente les opérations courantes permettant de maintenir l'application, de diagnostiquer un problème, de mettre à jour les dépendances et de vérifier qu'une évolution n'introduit pas de régression.

Les procédures concernent principalement le backend NestJS, le frontend Angular et la base de données PostgreSQL.

---

## 2. Pré-requis

Les outils nécessaires au développement et à la maintenance du projet sont notamment :

- Node.js ;
- npm ;
- NestJS CLI ;
- Angular CLI ;
- PostgreSQL ;
- Prisma ;
- Git.

Les versions utilisées dans le projet sont documentées dans les fichiers `package.json` et `package-lock.json`.

Les variables d'environnement nécessaires au backend doivent être configurées dans le fichier `.env`.

Les secrets et mots de passe ne doivent jamais être versionnés dans Git.

---

## 3. Installation et démarrage

### Backend

Depuis le répertoire `backend` :

```bash
npm install
npm run start:dev
```

Le mode `start:dev` permet de démarrer l'application avec rechargement automatique lors des modifications.

Pour exécuter le backend en mode production :

```bash
npm run build
npm run start:prod
```

### Frontend

Depuis le répertoire `frontend` :

```bash
npm install
npm start
```

L'application Angular est alors disponible sur le serveur de développement local.

Pour générer le build de production :

```bash
npm run build
```

Les fichiers générés sont placés dans le répertoire `dist/`.

---

## 4. Gestion de la base de données

Les modifications du schéma de données sont gérées avec Prisma.

Avant d'appliquer une modification du modèle de données, une migration Prisma doit être créée et vérifiée.

En environnement de développement :

```bash
npx prisma migrate dev
```

Pour appliquer les migrations existantes dans un environnement où les migrations doivent uniquement être déployées :

```bash
npx prisma migrate deploy
```

Après une modification du schéma, les tests backend doivent être exécutés afin de vérifier que les fonctionnalités utilisant la base de données restent opérationnelles.

Les migrations doivent être versionnées avec le projet afin de permettre de reproduire l'état attendu de la base de données.

---

## 5. Mise à jour des dépendances

Les dépendances npm doivent être maintenues régulièrement afin de bénéficier des corrections de bugs et de sécurité.

Avant une mise à jour importante :

```bash
npm outdated
```

Un audit de sécurité peut être réalisé avec :

```bash
npm audit
```

Après une mise à jour :

```bash
npm install
npm run test
npm run test:cov
npm run lint
npm run build
```

Pour le backend, les tests d'intégration et E2E doivent également être exécutés lorsque la modification peut affecter les interactions avec la base de données ou les parcours fonctionnels :

```bash
npm run test:integration
npm run test:e2e
```

Les mises à jour majeures doivent être réalisées de manière progressive afin d'identifier facilement une éventuelle régression.

---

## 6. Vérification avant livraison

Avant de livrer une modification significative, les vérifications suivantes sont réalisées.

### Backend

```bash
npm run lint
npm run test
npm run test:cov
npm run test:integration
npm run test:e2e
npm run build
```

### Frontend

```bash
npm test
npm run build
```

Une vérification Lighthouse peut également être réalisée sur le build de production afin de surveiller les performances frontend et l'accessibilité.

Les tests de sécurité documentés dans `SECURITY.md` peuvent être relancés lorsque les dépendances ou les composants sensibles sont modifiés.

---

## 7. Diagnostic d'un problème

Lorsqu'un problème est signalé, le diagnostic suit une approche progressive :

1. reproduire le problème ;
2. identifier la fonctionnalité concernée ;
3. consulter les logs de l'application ;
4. vérifier les données utilisées par la fonctionnalité ;
5. vérifier les appels vers les services externes, notamment le stockage S3 ;
6. vérifier les interactions avec PostgreSQL ;
7. identifier la cause du problème ;
8. appliquer une correction ciblée ;
9. exécuter les tests associés ;
10. vérifier qu'aucune régression n'a été introduite.

Pour un problème backend, les commandes suivantes peuvent notamment être utilisées :

```bash
npm run start:dev
```

et :

```bash
npm run test
```

Pour un problème lié à la base de données, les migrations Prisma et l'état des données doivent être vérifiés avant toute modification manuelle.

---

## 8. Gestion des logs et métriques

Les logs backend permettent d'identifier les erreurs et de suivre le comportement de l'application.

Lorsqu'un problème de performance est suspecté, les métriques suivantes peuvent être analysées :

- temps de réponse ;
- taux d'erreur ;
- temps de réponse p95 ;
- taille des fichiers ;
- taille du bundle frontend ;
- métriques Lighthouse.

Les tests de performance k6 documentés dans `PERF.md` permettent de reproduire les mesures sur les endpoints critiques.

Les tests réalisés sur l'environnement local constituent une référence de comparaison et ne remplacent pas des mesures réalisées sur une infrastructure de production.

---

## 9. Maintenance de la sécurité

Les dépendances doivent être régulièrement analysées avec les outils de sécurité utilisés dans le projet.

Les contrôles réalisés sont notamment :

```bash
npm audit
```

et :

```bash
trivy fs .
```

Une recherche de secrets peut également être réalisée avec Trivy.

Les résultats détaillés des analyses sont documentés dans `SECURITY.md`.

Les secrets applicatifs doivent rester dans les variables d'environnement et ne doivent pas être ajoutés au dépôt Git.

Toute modification concernant l'authentification, les autorisations, les mots de passe, les tokens ou les accès au stockage S3 doit être accompagnée de tests adaptés.

---

## 10. Gestion des régressions

Lorsqu'une correction est apportée à un comportement existant, un test doit être ajouté ou adapté lorsque cela est pertinent.

Les tests unitaires permettent de vérifier la logique métier isolée.

Les tests d'intégration permettent notamment de vérifier l'interaction avec PostgreSQL.

Les tests E2E permettent de vérifier les parcours fonctionnels principaux de l'application.

La couverture de code est contrôlée avec :

```bash
npm run test:cov
```

Une modification ne doit pas être considérée comme terminée si elle fait échouer un test existant sans justification documentée.

---

## 11. Gestion des versions et rollback

Les modifications sont versionnées avec Git.

Chaque modification significative doit être associée à un commit explicite permettant d'identifier son objectif.

En cas de régression, le commit responsable peut être identifié dans l'historique Git puis corrigé ou reverté.

Avant une modification importante du schéma de base de données ou d'une dépendance majeure, une vérification de compatibilité doit être réalisée afin d'éviter de rendre l'application ou les données incompatibles avec la version précédente.

Les migrations Prisma doivent être traitées avec attention car une modification du schéma peut avoir un impact sur les données existantes.

---

## 12. Maintenance préventive

Les opérations suivantes sont recommandées régulièrement :

- vérifier les mises à jour de dépendances ;
- réaliser un audit de sécurité ;
- vérifier les tests et la couverture ;
- vérifier les performances des endpoints critiques ;
- vérifier le build frontend ;
- contrôler les budgets Angular ;
- analyser les éventuelles régressions Lighthouse ;
- vérifier les migrations Prisma ;
- nettoyer les dépendances devenues inutiles.

Une nouvelle campagne de tests de performance et de sécurité doit notamment être réalisée après une modification importante de l'architecture ou des dépendances.

---

## 13. Documentation associée

Les procédures de maintenance doivent être utilisées conjointement avec les documents suivants :

- `README.md` : présentation et installation du projet ;
- `TESTING.md` : stratégie et résultats des tests ;
- `SECURITY.md` : audits et mesures de sécurité ;
- `PERF.md` : mesures et suivi des performances.

Ces documents doivent être mis à jour lorsque l'architecture ou les procédures du projet évoluent.

---

## 14. Synthèse

La maintenance de DataShare repose sur quatre principes :

1. **Reproduire et diagnostiquer avant de corriger** ;
2. **Tester toute modification significative** ;
3. **Surveiller les performances et la sécurité** ;
4. **Versionner les modifications afin de pouvoir revenir à un état fonctionnel**.

Cette approche permet de limiter les régressions et de conserver un projet maintenable après sa livraison.