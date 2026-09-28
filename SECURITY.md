# Security

## 1. Objectif

Ce document présente les contrôles de sécurité réalisés sur le backend du projet DataShare, ainsi que les vulnérabilités identifiées et les mesures prises.

Les contrôles portent principalement sur :

- les dépendances npm ;
- les vulnérabilités connues des dépendances ;
- les dépendances transitives ;
- la présence éventuelle de secrets dans les fichiers du projet ;
- l'analyse statique du code ;
- la recherche de vulnérabilités SQL ;
- l'analyse de sécurité de l'API HTTP.

---

## 2. Périmètre

Les contrôles présentés dans ce document portent sur le backend du projet DataShare et sur ses dépendances npm.

Les analyses ont été réalisées dans l'environnement de développement du projet.

---

## 3. Audit des dépendances npm

### Outil

L'audit des dépendances a été réalisé avec :

```bash
npm audit
```

Puis avec :

```bash
npm audit --omit=dev
```

Cette seconde commande permet de vérifier les vulnérabilités présentes dans l'arbre de dépendances utilisé pour la production.

### Résultat

L'audit complet a identifié :

- **9 vulnérabilités**
- 6 de sévérité High
- 1 de sévérité Moderate
- 2 de sévérité Low

Les principales vulnérabilités concernent les dépendances transitives suivantes :

- `deepmerge-ts`
- `mysql2`
- `tmp`
- `undici`

L'analyse de l'arbre des dépendances avec :

```bash
npm ls @nestjs/mau prisma mysql2 deepmerge-ts tmp undici
```

a permis d'identifier leur origine.

Les dépendances `tmp` et `undici` proviennent de la chaîne suivante :

```text
@nestjs/mau
└── inquirer
    └── external-editor
        └── tmp
```

et :

```text
@nestjs/mau
└── undici
```

`@nestjs/mau` est une dépendance de développement.

Les vulnérabilités `deepmerge-ts` et `mysql2` sont quant à elles transitives via Prisma :

```text
prisma@7.10.0
├── @prisma/config@7.10.0
│   └── deepmerge-ts@7.1.5
└── mysql2@3.15.3
```

### Audit de l'arbre de production

La commande :

```bash
npm audit --omit=dev
```

a identifié 4 vulnérabilités High liées à :

- `deepmerge-ts@7.1.5`
- `mysql2@3.15.3`

Ces packages sont des dépendances transitives de Prisma.

Le projet utilise PostgreSQL avec `@prisma/adapter-pg`. `mysql2` n'est donc pas utilisé directement par l'application pour accéder à la base de données.

---

## 4. Traitement des vulnérabilités npm

La commande automatique :

```bash
npm audit fix --force
```

n'a pas été exécutée.

L'audit indique qu'une correction automatique nécessiterait l'installation de :

```text
prisma@6.19.3
```

alors que le projet utilise actuellement :

```text
prisma@7.10.0
@prisma/client@7.10.0
```

Cette correction entraînerait donc un changement majeur de version de Prisma et potentiellement des incompatibilités avec le projet.

Une rétrogradation majeure n'a pas été appliquée uniquement pour faire disparaître les alertes de sécurité.

La version stable actuellement utilisée du client Prisma reste `7.10.0`. La version `8.0.0-rc.17` disponible via npm étant une release candidate, elle n'a pas été adoptée comme solution de correction.

Les vulnérabilités transitives sont donc **identifiées et suivies**, sans modification forcée de l'arbre des dépendances.

Une mise à jour de Prisma devra être réévaluée lorsqu'une version stable compatible permettra de corriger ces vulnérabilités.

---

## 5. Analyse avec Trivy

### Installation

Trivy a été installé et utilisé en version :

```text
0.74.0
```

### Scan des vulnérabilités

Le projet a été analysé avec :

```bash
trivy fs .
```

Trivy a été utilisé pour analyser les dépendances détectables dans le projet et rechercher les vulnérabilités connues.

### Résultat

Trivy a identifié :

| Package        | Version | Sévérité | Version corrigée |
|---             |---:     |---       |---:              |
| `deepmerge-ts` | 7.1.5   | High     | 8.0.0            |
| `mysql2`       | 3.15.3  | High     | 3.22.0           |
| `mysql2`       | 3.15.3  | Medium   | 3.23.1           |

Le scan n'a identifié :

- aucune vulnérabilité Critical ;
- aucune vulnérabilité Low.

Les vulnérabilités identifiées sont transitives et proviennent de l'arbre Prisma.

Les versions corrigées identifiées par Trivy ne sont pas installées directement afin d'éviter de modifier manuellement des dépendances transitives gérées par Prisma.

---

## 6. Recherche de secrets

Un scan spécifique des secrets a été réalisé avec :

```bash
trivy fs --scanners secret .
```

### Résultat

```text
0 secret détecté
```

Aucun secret connu n'a été détecté par Trivy dans les fichiers analysés.

Les informations sensibles utilisées par l'application sont stockées dans les variables d'environnement et ne doivent pas être versionnées dans le dépôt.

### Analyse complémentaire avec GitLeaks

Une analyse de l'historique Git a également été réalisée avec :

```bash
gitleaks detect --source . --redact
```

Le scan a analysé 40 commits et a signalé une détection.

La détection concerne le fichier `backend/README.md`, dans le commit `59522f9e1f54909b7adae23635698f64afca083f`.

La valeur détectée correspond au paramètre `token` d'un badge CircleCI généré par NestJS :

```text
https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
```

Cette valeur ne correspond pas à un secret applicatif DataShare et aucun credential DataShare n'a été identifié.

La détection est donc considérée comme un **faux positif** dans le contexte du projet.

---

## 7. Analyse statique avec Semgrep

### Outil

L'analyse statique du backend a été réalisée avec :

```bash
semgrep scan --config=auto
```

Semgrep a analysé 60 fichiers suivis par Git et a appliqué 247 règles.

### Résultat

Une détection a été remontée dans :

```text
src/files/files.service.ts
```

La règle concernée est :

```text
javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
```

Elle concerne le logging suivant :

```typescript
console.error(
  `Erreur lors de la suppression du fichier ${file.id} :`,
  error.message,
);
```

Cette détection a été analysée dans son contexte.

`file.id` provient d'une requête Prisma effectuée par une tâche planifiée côté serveur et n'est pas directement fourni par l'utilisateur dans cette opération. Le message est également écrit dans les logs serveur et n'est pas renvoyé dans la réponse HTTP.

La détection est donc considérée comme **contextuelle et non exploitable dans le périmètre actuel**.

Aucune modification du code n'a été effectuée uniquement pour supprimer cette alerte.

---

## 8. Test d'injection SQL avec SQLMap

### Outil

SQLMap a été utilisé en version :

```text
1.10.4#stable
```

Le test a porté sur le paramètre `email` de l'endpoint :

```text
POST /api/auth/login
```

La requête utilisée pour le test était une requête JSON contenant un email et un mot de passe invalides.

### Résultat

Le test a exploré notamment les techniques :

- Boolean-based blind ;
- Error-based ;
- Time-based ;
- UNION-based ;
- Parameter replacement.

SQLMap a conclu que le paramètre JSON `email` ne semblait pas injectable.

Aucune injection SQL n'a été détectée sur cet endpoint lors du test local.

Ce résultat est cohérent avec l'utilisation de Prisma pour l'accès aux données, sans construction manuelle de requêtes SQL à partir de l'entrée utilisateur.

---

## 9. Analyse HTTP avec OWASP ZAP

### Outil

Une analyse dynamique de l'API a été réalisée avec OWASP ZAP sous forme de baseline scan.

La cible était :

```text
http://host.docker.internal:3000/api
```

L'analyse a été réalisée depuis le conteneur Docker ZAP.

### Résultat initial

Avant l'ajout de Helmet, le scan a obtenu :

- **59 PASS**
- **8 WARN**
- **0 FAIL**

Les principales alertes concernaient des en-têtes HTTP de sécurité absents :

- Anti-clickjacking Header ;
- `X-Content-Type-Options` ;
- `X-Powered-By` ;
- Content Security Policy ;
- Permissions Policy ;
- Cross-Origin-Embedder-Policy.

### Mesure corrective

Le middleware `helmet` a été ajouté au démarrage de l'application :

```typescript
app.use(helmet());
```

Cette mesure permet d'ajouter automatiquement plusieurs en-têtes HTTP de sécurité.

### Second scan

Après l'ajout de Helmet, le scan a obtenu :

- **63 PASS**
- **4 WARN**
- **0 FAIL**

Les alertes suivantes ont notamment été corrigées :

- Missing Anti-clickjacking Header ;
- X-Content-Type-Options Header Missing ;
- Server Leaks Information via X-Powered-By ;
- CSP Header Not Set.

### Alertes restantes

Quatre catégories d'avertissements restent présentes :

- `10049` — Storable and Cacheable Content ;
- `10055` — CSP: Failure to Define Directive with No Fallback ;
- `10063` — Permissions Policy Header Not Set ;
- `90004` — Cross-Origin-Embedder-Policy Header Missing or Invalid.

Ces alertes ont été analysées dans le contexte d'une API REST.

Certaines concernent des ressources inexistantes ou des réponses ne contenant pas de données sensibles. Les politiques CSP, Permissions Policy et COEP ont également été évaluées en fonction du rôle du backend et ne sont pas ajoutées artificiellement uniquement pour supprimer les avertissements du scanner.

Aucune vulnérabilité critique ou fail n'a été détectée par le scan ZAP.

Le résultat du scan est donc conservé avec les avertissements documentés plutôt que de modifier la configuration HTTP uniquement afin d'obtenir un résultat sans warning.

---

## 10. Mesures de sécurité complémentaires

Le projet applique également plusieurs mesures de sécurité au niveau applicatif :

- authentification basée sur JWT ;
- mots de passe stockés sous forme de hash ;
- validation des données entrantes avec `class-validator` ;
- contrôle d'accès aux ressources utilisateur ;
- utilisation de clés de stockage S3 générées côté backend ;
- utilisation de liens de téléchargement temporaires ;
- variables sensibles stockées dans l'environnement plutôt que dans le code source ;
- séparation entre la base de données de développement et la base PostgreSQL utilisée pour les tests d'intégration ;
- utilisation de Helmet pour renforcer les en-têtes HTTP de sécurité.

Les tests automatisés couvrent également les principaux parcours d'authentification et de gestion des fichiers.

---

## 11. Limites de l'analyse

Les résultats présentés correspondent aux bases de vulnérabilités et aux versions des outils disponibles au moment des contrôles.

Ces analyses permettent d'identifier des vulnérabilités connues dans les dépendances, certains secrets potentiellement présents dans les fichiers, des problèmes détectables par analyse statique et certaines vulnérabilités de l'API.

Elles ne constituent cependant pas une garantie d'absence de vulnérabilité dans l'application.

Les scans ont été réalisés dans l'environnement de développement local et ne remplacent pas un audit de sécurité complet réalisé sur une infrastructure de production.

Une nouvelle analyse devra être réalisée lors des mises à jour importantes des dépendances ou avant une mise en production.

---

## 12. Synthèse

**Date du dernier contrôle : 25 septembre 2026**

Les contrôles de sécurité réalisés sont :

| Contrôle                       | Outil                  | Résultat                     |
|---                             |---                     |---                           |
| Audit des dépendances          | `npm audit`            | 9 vulnérabilités identifiées |
| Audit de l'arbre de production | `npm audit --omit=dev` | 4 High identifiées           |
| Scan des dépendances           | Trivy 0.74.0           | 2 High + 1 Medium            |
| Recherche de secrets           | Trivy 0.74.0           | Aucun secret détecté         |
| Recherche de secrets dans Git  | GitLeaks               | 1 faux positif identifié     |
| Analyse statique               | Semgrep 1.178.0        | 1 détection contextuelle     |
| Test d'injection SQL           | SQLMap 1.10.4          | Aucune injection détectée    |
| Analyse dynamique HTTP         | OWASP ZAP              | 0 Fail, 4 Warn après Helmet  |

Les vulnérabilités npm restantes sont principalement liées à des dépendances transitives de Prisma.

Aucune correction forcée impliquant une rétrogradation majeure de Prisma n'a été appliquée.

Les résultats GitLeaks et Semgrep ont été analysés dans leur contexte et ne correspondent pas à une vulnérabilité applicative exploitable identifiée dans le périmètre actuel.

Le test SQLMap n'a détecté aucune injection SQL sur le paramètre testé.

L'analyse OWASP ZAP n'a détecté aucun `FAIL`. L'ajout de Helmet a permis de réduire le nombre d'avertissements de 8 à 4.

Les résultats restants sont documentés et feront l'objet d'une nouvelle vérification lors des prochaines évolutions du projet et des dépendances.