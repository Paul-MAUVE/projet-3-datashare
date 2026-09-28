# DataShare

DataShare est une application web permettant de transférer et partager temporairement des fichiers de manière sécurisée.

Le projet a été réalisé dans le cadre du parcours **Expert DevOps**.

## 1. Architecture

L'application repose sur une architecture séparant le frontend, le backend, la base de données et le stockage des fichiers.

```text
┌─────────────────────┐
│      Angular        │
│      Frontend       │
└──────────┬──────────┘
           │ HTTP / JSON
           ▼
┌─────────────────────┐
│       NestJS        │
│       Backend       │
└───────┬─────┬───────┘
        │     │
        │     └──────────────────┐
        ▼                        ▼
┌───────────────┐        ┌────────────────┐
│  PostgreSQL   │        │    AWS S3      │
│   + Prisma    │        │ stockage files │
└───────────────┘        └────────────────┘
```

### Technologies principales

| Composant         | Technologie       |
|---                |---                |
| Frontend          | Angular 22        |
| Backend           | NestJS 12         |
| Langage           | TypeScript        |
| Base de données   | PostgreSQL        |
| ORM               | Prisma            |
| Stockage fichiers | AWS S3            |
| Authentification  | JWT               |
| Tests backend     | Vitest            |
| Tests frontend    | Vitest            |
| Tests E2E         | Cypress           |
| Performance       | k6                |
| Sécurité          | npm audit / Trivy |

---

## 2. Fonctionnalités

Le MVP comprend notamment :

- création de compte ;
- authentification ;
- upload de fichiers ;
- génération d'URLs présignées pour le stockage ;
- téléchargement de fichiers via lien ;
- historique des fichiers ;
- suppression de fichiers ;
- contrôle des accès aux ressources ;
- gestion de l'expiration des fichiers.

Les fichiers sont stockés dans le stockage objet et ne transitent pas directement par le backend lors de leur transfert.

---

## 3. Prérequis

Les outils suivants doivent être installés :

- Node.js ;
- npm ;
- PostgreSQL ;
- Git ;
- Angular CLI ;
- NestJS CLI.

Les versions utilisées dans le projet peuvent être vérifiées dans les fichiers `package.json` et `package-lock.json`.

---

## 4. Récupération du projet

Cloner le dépôt puis accéder au projet :

```bash
git clone <https://github.com/Paul-MAUVE/projet-3-datashare>
cd projet3
```

Le projet est organisé en deux applications principales :

```text
projet3/
├── backend/
├── frontend/
├── MAINTENANCE.md
├── PERF.md
├── SECURITY.md
└── TESTING.md
```

---

## 5. Configuration du backend

Accéder au backend :

```bash
cd backend
```

Installer les dépendances :

```bash
npm install
```

Créer le fichier `.env` à partir des variables nécessaires au projet.

Les informations sensibles telles que les mots de passe, clés JWT et identifiants AWS ne doivent jamais être versionnées.

### Base de données

La connexion PostgreSQL est configurée via `DATABASE_URL`.

Après configuration de la base :

```bash
npx prisma migrate dev
```

Les migrations existantes peuvent être appliquées avec :

```bash
npx prisma migrate deploy
```

---

## 6. Démarrer le backend

Depuis `backend/` :

```bash
npm run start:dev
```

Le backend démarre en mode développement avec rechargement automatique.

Pour construire puis démarrer l'application en mode production :

```bash
npm run build
npm run start:prod
```

---

## 7. Configuration du frontend

Depuis le répertoire du projet :

```bash
cd frontend
npm install
```

---

## 8. Démarrer le frontend

```bash
npm start
```

L'application Angular est alors disponible sur :

```text
http://localhost:4200
```

---

## 9. Build de production

Depuis `frontend/` :

```bash
npm run build
```

Le build est généré dans :

```text
frontend/dist/
```

Le build de production applique les optimisations Angular et permet notamment de vérifier les budgets de performance définis dans `angular.json`.

---

## 10. Tests

### Backend

Tests unitaires :

```bash
cd backend
npm run test
```

Couverture :

```bash
npm run test:cov
```

Tests d'intégration :

```bash
npm run test:integration
```

Tests E2E backend :

```bash
npm run test:e2e
```

Lint :

```bash
npm run lint
```

### Frontend

Tests :

```bash
cd frontend
npm test
```

### Cypress

Les scénarios E2E frontend sont exécutés avec Cypress.

Ils couvrent notamment les principaux parcours utilisateur du MVP.

---

## 11. Performance

Les performances backend sont testées avec k6.

Les mesures portent notamment sur :

- l'authentification ;
- la récupération des fichiers ;
- la création d'une session d'upload.

Le frontend est analysé avec Lighthouse sur le build de production.

Les résultats détaillés sont disponibles dans :

```text
PERF.md
```

---

## 12. Sécurité

Les dépendances sont régulièrement analysées avec :

```bash
npm audit
```

et :

```bash
trivy fs .
```

Une recherche de secrets peut également être effectuée avec Trivy.

Les résultats des audits et les mesures de sécurité sont documentés dans :

```text
SECURITY.md
```

---

## 13. Maintenance

Les procédures de maintenance, de diagnostic, de mise à jour et de gestion des régressions sont décrites dans :

```text
MAINTENANCE.md
```

---

## 14. Documentation du projet

| Document         | Contenu                                   |
|---               |---                                        |
| `README.md`      | Présentation, installation et utilisation |
| `TESTING.md`     | Stratégie et résultats des tests          |
| `SECURITY.md`    | Audit et mesures de sécurité              |
| `PERF.md`        | Performances backend et frontend          |
| `MAINTENANCE.md` | Procédures de maintenance                 |

---

## 15. Workflow de développement

Une modification suit généralement le cycle suivant :

```text
Modification du code
        ↓
Tests unitaires
        ↓
Tests d'intégration si nécessaire
        ↓
Tests E2E si nécessaire
        ↓
Lint / Build
        ↓
Vérification sécurité
        ↓
Vérification performance si nécessaire
        ↓
Commit Git
```

Les commits doivent décrire clairement la modification réalisée.

---

## 16. État du projet

DataShare dispose actuellement :

- d'une authentification JWT ;
- d'une gestion des utilisateurs ;
- d'un upload via URL présignée ;
- d'un stockage objet S3 ;
- d'une persistance PostgreSQL avec Prisma ;
- d'une gestion des fichiers ;
- de tests unitaires ;
- de tests d'intégration ;
- de tests E2E ;
- d'une analyse de couverture ;
- d'audits de sécurité ;
- de tests de performance backend ;
- d'un audit Lighthouse frontend ;
- d'une documentation de maintenance.

Les limitations et pistes d'amélioration sont documentées dans les fichiers de documentation associés.