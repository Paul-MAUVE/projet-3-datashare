# Security

## 1. Objectif

Ce document présente les contrôles de sécurité réalisés sur le backend du projet DataShare, ainsi que les vulnérabilités identifiées et les mesures prises.

Les contrôles portent principalement sur :

- les dépendances npm ;
- les vulnérabilités connues des dépendances ;
- les dépendances transitives ;
- la présence éventuelle de secrets dans les fichiers du projet.

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

Trivy analyse par défaut les dépendances nécessaires à l'application et exclut les dépendances de développement et de test.

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

---

## 7. Mesures de sécurité complémentaires

Le projet applique également plusieurs mesures de sécurité au niveau applicatif :

- authentification basée sur JWT ;
- mots de passe stockés sous forme de hash ;
- validation des données entrantes avec `class-validator` ;
- contrôle d'accès aux ressources utilisateur ;
- utilisation de clés de stockage S3 générées côté backend ;
- utilisation de liens de téléchargement temporaires ;
- variables sensibles stockées dans l'environnement plutôt que dans le code source ;
- séparation entre la base de données de développement et la base PostgreSQL utilisée pour les tests d'intégration.

Les tests automatisés couvrent également les principaux parcours d'authentification et de gestion des fichiers.

---

## 8. Limites de l'analyse

Les résultats présentés correspondent aux bases de vulnérabilités disponibles au moment des contrôles.

Ces analyses permettent d'identifier des vulnérabilités connues dans les dépendances et certains secrets potentiellement présents dans les fichiers analysés, mais elles ne constituent pas une garantie d'absence de vulnérabilité dans l'application.

Une nouvelle analyse devra être réalisée lors des mises à jour importantes des dépendances ou avant une mise en production.

---

## 9. Synthèse

**Date du dernier contrôle : 25 septembre 2026**

Les contrôles de sécurité réalisés sont :

| Contrôle                       | Outil                  | Résultat                     |
|---                             |---                     |---                           |
| Audit des dépendances          | `npm audit`            | 9 vulnérabilités identifiées |
| Audit de l'arbre de production | `npm audit --omit=dev` | 4 High identifiées           |
| Scan des dépendances           | Trivy 0.74.0           | 2 High + 1 Medium            |
| Recherche de secrets           | Trivy 0.74.0           | Aucun secret détecté         |

Les vulnérabilités restantes sont principalement liées à des dépendances transitives de Prisma.

Aucune correction forcée impliquant une rétrogradation majeure de Prisma n'a été appliquée. Les vulnérabilités sont documentées et feront l'objet d'une nouvelle vérification lors de la disponibilité d'une version stable de Prisma permettant leur correction sans introduire de rupture incompatible avec le projet.