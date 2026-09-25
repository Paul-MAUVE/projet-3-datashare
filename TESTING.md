# Plan de tests — DataShare

## 1. Objectif

Ce document décrit la stratégie de tests mise en place pour l'application DataShare.

L'objectif est de vérifier les fonctionnalités critiques de l'application, notamment :

- l'authentification des utilisateurs ;
- la création et la gestion des comptes ;
- l'upload des fichiers ;
- la génération des liens de téléchargement ;
- le téléchargement des fichiers ;
- la gestion de l'espace utilisateur ;
- la suppression des fichiers.

Les tests permettent également de détecter les régressions lors des évolutions du projet.

## 2. Stratégie de tests

La stratégie repose sur plusieurs niveaux de tests :

| Niveau              | Outil            | Objectif                                                  |
|---                  |---               |---                                                        |
| Tests backend       | Vitest           | Vérifier les contrôleurs, services et composants backend  |
| Tests frontend      | Vitest + Angular | Vérifier les composants, services, guards et interceptors |
| Tests E2E           | Cypress          | Vérifier les parcours utilisateur complets                |

Les tests unitaires et de composants permettent de vérifier les comportements de manière isolée, tandis que les tests E2E valident les principaux parcours utilisateur de bout en bout.

La couverture de code est mesurée avec le provider V8 de Vitest.

## 3. Tests backend

Les tests backend sont réalisés avec **Vitest**.

Ils couvrent principalement les contrôleurs, services et composants d'infrastructure liés aux fonctionnalités critiques de l'application :

| Domaine          | Fichier de test               | Fonctionnalités vérifiées                 |
|---               |---                            |---                                        |
| Application      | `app.controller.spec.ts`      | Réponse de base de l'application          |
| Authentification | `auth.controller.spec.ts`     | Gestion des endpoints d'authentification  |
| Authentification | `auth.service.spec.ts`        | Logique d'authentification                |
| Téléchargement   | `download.controller.spec.ts` | Gestion des téléchargements               |
| Fichiers         | `files.controller.spec.ts`    | Gestion des fichiers                      |
| Fichiers         | `files.service.spec.ts`       | Logique métier des fichiers               |
| Base de données  | `prisma.service.spec.ts`      | Service Prisma                            |
| Stockage         | `storage.service.spec.ts`     | Interaction avec le stockage              |
| Upload           | `upload.controller.spec.ts`   | Gestion des endpoints d'upload            |
| Upload           | `upload.service.spec.ts`      | Logique métier de l'upload                |
| Utilisateurs     | `password.service.spec.ts`    | Gestion et vérification des mots de passe |
| Utilisateurs     | `user.service.spec.ts`        | Gestion des utilisateurs                  |

### Tests d’intégration

Trois tests d’intégration backend vérifient le fonctionnement du service d’upload avec une véritable base PostgreSQL de test (`datashare_test`).

Le `StorageService` est mocké afin de concentrer ces tests sur l’intégration entre la logique métier et la persistance PostgreSQL.

| Test                            | Vérification                                                  | Résultat  |
|---                              |---                                                            |---        |
| Création d’une session d’upload | Création réelle d’une `UploadSession` dans PostgreSQL         | Validé    |
| Finalisation d’un upload        | Création réelle du `File` et suppression de l’`UploadSession` | Validé    |
| Taille de fichier incorrecte    | Rejet de l’upload et conservation de la session               | Validé    |

Commande d’exécution :

```bash
npm run test:integration
```

## Résultats

**56 tests** backend sont exécutés avec succès.

La couverture obtenue est :

| Indicateur | Couverture  |
|---         |---:         |
| Statements | **96,72 %** |
| Branches   | **76,47 %** |
| Functions  | **97,43 %** |
| Lines      | **96,61 %** |

Le code Prisma généré (`src/generated/**`) ainsi que les DTO (`src/**/*.dto.ts`) sont exclus du calcul de couverture, car ils ne correspondent pas à de la logique métier développée spécifiquement pour l'application.

La couverture reste donc centrée sur le code applicatif réellement maintenu.

### Exécution

Depuis le dossier `backend` :

```bash
npm test
npm run test:cov
```

## 4. Tests frontend

Les tests frontend sont réalisés avec **Vitest** et l'environnement de test Angular.

Ils couvrent les principaux composants et services de l'application :

| Domaine            | Fichier de test            | Fonctionnalités vérifiées                                     |
|---                 |---                         |---                                                            |
| Application        | `app.spec.ts`              | Initialisation de l'application                               |
| Sécurité           | `auth-guard.spec.ts`       | Contrôle de l'accès aux routes protégées                      |
| Sécurité           | `auth-interceptor.spec.ts` | Ajout et gestion du token d'authentification                  |
| Téléchargement     | `download.spec.ts`         | Affichage des informations, expiration et gestion des erreurs |
| Accueil            | `home.spec.ts`             | Affichage de la page d'accueil                                |
| Authentification   | `login.spec.ts`            | Connexion utilisateur                                         |
| Espace utilisateur | `my-space.spec.ts`         | Consultation et gestion des fichiers                          |
| Inscription        | `register.spec.ts`         | Création d'un compte                                          |
| Upload             | `upload.spec.ts`           | Sélection, validation et upload d'un fichier                  |
| Services           | `auth.spec.ts`             | Gestion de l'authentification                                 |
| Services           | `files.spec.ts`            | Gestion des fichiers                                          |
| Services           | `uploads.spec.ts`          | Gestion des uploads                                           |

### Résultats

**59 tests** frontend sont exécutés avec succès.

La couverture obtenue est :

| Indicateur | Couverture  |
|---         |---:         |
| Statements | **85,47 %** |
| Branches   | **91,24 %** |
| Functions  | **83,09 %** |
| Lines      | **82,65 %** |

Les templates HTML (`src/**/*.html`) sont exclus du calcul de couverture afin de mesurer plus précisément la couverture du code TypeScript applicatif.

Les templates restent néanmoins exercés indirectement par les tests de composants et directement dans les parcours E2E Cypress.

### Exécution

Depuis le dossier `frontend` :

```bash
npm test
npx ng test --coverage --coverage-reporters=text
```

## 5. Tests E2E

Les tests End-to-End sont réalisés avec **Cypress**.

Ils permettent de vérifier les principaux parcours utilisateur dans un environnement proche des conditions réelles d'utilisation.

Les scénarios E2E couvrent les fonctionnalités suivantes :

| # | Scénario                                         | Fonctionnalité vérifiée                                                   |
|---|---                                               |---                                                                        |
| 1 | Accès à la page d'accueil                        | Chargement de l'application                                               |
| 2 | Création d'un compte puis connexion              | Inscription et authentification                                           |
| 3 | Accès à une route protégée sans authentification | Protection des routes                                                     |
| 4 | Upload d'un fichier                              | Création d'un upload et envoi du fichier                                  |
| 5 | Accès à la page de téléchargement                | Accès à la page de téléchargement et présence du bouton de téléchargement |
| 6 | Suppression d'un fichier                         | Suppression depuis l'espace utilisateur                                   |

Les tests utilisent un fichier de test dédié situé dans :

`frontend/cypress/fixtures/test-upload.txt`

### Résultats

Les **6 scénarios E2E passent avec succès**.

Ils permettent notamment de valider le parcours fonctionnel suivant :

**Création de compte → Connexion → Upload → Accès au téléchargement → Suppression**

### Exécution

Depuis le dossier `frontend` :

```bash
npx cypress run --e2e --browser electron

```

## 6. Synthèse et seuil de couverture

Le projet dépasse le seuil de **70 % de couverture de code** demandé dans les critères du projet.

| Partie   | Tests | Statements | Branches | Functions | Lines   |
|---       |---:   |---:        |---:      |---:       |---:     |
| Backend  | 56    | 96,72 %    | 76,47 %  | 97,43 %   | 96,61 % |
| Frontend | 59    | 85,47 %    | 91,24 %  | 83,09 %   | 82,65 % |

Les tests couvrent les principales fonctionnalités critiques de DataShare :

- authentification et gestion des utilisateurs ;
- protection des routes ;
- upload des fichiers ;
- gestion des fichiers ;
- génération et accès aux liens de téléchargement ;
- suppression des fichiers ;
- gestion des erreurs et cas limites.

Les tests E2E complètent les tests unitaires et de composants en validant les principaux parcours utilisateur de bout en bout.

### Conclusion

La stratégie de tests permet de vérifier les fonctionnalités critiques de l'application et de limiter les régressions lors des évolutions du projet.

Le seuil de couverture de **70 %** est respecté sur le backend comme sur le frontend.