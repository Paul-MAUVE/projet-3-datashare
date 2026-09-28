# Performance

## 1. Objectif

L'objectif de ce document est de présenter les mesures de performance réalisées sur DataShare, aussi bien côté backend que côté frontend, et de documenter les principaux points de vigilance et pistes d'optimisation.

Les mesures ont été réalisées dans l'environnement de développement local du projet. Elles permettent de disposer d'un point de référence pour le projet, mais ne constituent pas un benchmark de production.

---

## 2. Performance backend

### 2.1 Méthodologie

Les performances de plusieurs endpoints critiques du backend ont été mesurées avec **k6**.
Les résultats présentés correspondent à une campagne de mesure réalisée pendant le développement du projet. Les scénarios k6 utilisés pour cette campagne ne sont pas conservés dans le dépôt.

Les scénarios testés sont :

- `POST /api/auth/login`
- `GET /api/files`
- `POST /api/uploads`

Le scénario utilise :

- 5 VUs pour l'authentification pendant 10 secondes ;
- 10 VUs pour la récupération des fichiers pendant 10 secondes ;
- 5 VUs pour la création d'une session d'upload pendant 10 secondes.

Les scénarios sont exécutés séquentiellement afin d'isoler les mesures par endpoint.

Le test a été réalisé sur l'environnement local de développement.

### 2.2 Résultats

| Endpoint               | VUs | Requêtes | Moyenne  | Médiane  | p95       | Maximum   | Erreurs |
|---                     |---: |---:      |---:      |---:      |---:       |---:       |---:     |
| `POST /api/auth/login` | 5   | 543      | 92,14 ms | 89,88 ms | 118,85 ms | 156,97 ms | 0 %     |
| `GET /api/files`       | 10  | 34 461   | 2,82 ms  | 2,68 ms  | 4,27 ms   | 102,83 ms | 0 %     |
| `POST /api/uploads`    | 5   | 11 175   | 4,37 ms  | 4,16 ms  | 6,22 ms   | 12,05 ms  | 0 %     |

Le test complet a généré 46 180 requêtes HTTP avec un taux d'erreur de 0 %.

Les contrôles fonctionnels k6 ont également été validés à 100 %.

### 2.3 Analyse

Les trois endpoints présentent des temps de réponse faibles dans l'environnement local testé.

L'endpoint d'authentification est naturellement plus coûteux que les autres endpoints en raison de la vérification du mot de passe et de la génération du JWT. Son temps de réponse moyen est de 92,14 ms avec un p95 de 118,85 ms.

L'endpoint `GET /api/files` présente un temps de réponse particulièrement faible, avec une moyenne de 2,82 ms et un p95 de 4,27 ms.

L'endpoint `POST /api/uploads` mesure uniquement la création de la session d'upload et la génération de l'URL présignée. Le transfert réel du fichier vers le stockage S3 n'est pas inclus dans cette mesure.

Une valeur maximale ponctuelle de 102,83 ms est observée sur `GET /api/files`, alors que 95 % des requêtes restent sous 4,27 ms. Cette valeur constitue un outlier ponctuel et ne remet pas en cause la tendance générale observée sur ce test.

### 2.4 Limites

Les mesures backend ont été réalisées sur une machine locale et avec un nombre limité de VUs. Elles ne permettent donc pas d'extrapoler directement les performances dans un environnement de production ou avec une charge beaucoup plus importante.

Une campagne de test plus représentative pourrait être réalisée ultérieurement sur une infrastructure proche de l'environnement de production, avec des profils de charge progressifs.

---

## 3. Performance frontend

### 3.1 Budget de performance

Le projet Angular définit actuellement les budgets suivants pour le build de production :

| Ressource            | Warning | Error |
|---                   |---:     |---:   |
| Bundle initial       | 500 kB  | 1 MB  |
| Style d'un composant | 4 kB    | 8 kB  |

Ces budgets permettent de détecter une augmentation excessive de la taille du frontend lors des évolutions du projet.

### 3.2 Taille du build

Le build de production Angular produit :

| Élément        | Taille brute | Taille transférée estimée |
|---             |---:          |---:                       |
| Bundle initial | 339,08 kB    | 85,46 kB                  |
| Styles         | 370 B        | 370 B                     |
| Total initial  | 339,45 kB    | 85,83 kB                  |

Le build reste largement inférieur au budget initial configuré à 500 kB.

Un avertissement concerne cependant le fichier `my-space.css`, dont la taille est de 4,07 kB pour un seuil d'avertissement fixé à 4 kB. Le seuil d'erreur de 8 kB n'est pas atteint.

Une première optimisation a permis de supprimer des règles CSS dupliquées dans ce fichier.

### 3.3 Audit Lighthouse

L'application a été auditée avec Lighthouse sur le build Angular de production, servi localement.
Les résultats présentés correspondent à une campagne d'audit réalisée pendant le développement du projet. Le rapport Lighthouse généré lors de cette campagne n'est pas conservé dans le dépôt.

| Catégorie        | Score       |
|---               |---:         |
| Performance      | **100/100** |
| Accessibility    | **100/100** |
| Best Practices   | **100/100** |
| SEO              | **91/100**  |

Principales métriques mesurées :

| Métrique                       | Résultat  |
|---                             |---:       |
| First Contentful Paint (FCP)   | **0,5 s** |
| Largest Contentful Paint (LCP) | **0,7 s** |
| Total Blocking Time (TBT)      | **0 ms**  |
| Cumulative Layout Shift (CLS)  | **0**     |
| Speed Index                    | **0,5 s** |

### 3.4 Comparaison développement / production

Un premier audit réalisé sur le serveur de développement Angular (`ng serve`) avait produit les résultats suivants :

| Métrique    | Développement | Production |
|---          |---:           |---:        |
| Performance | 59            | **100**    |
| FCP         | 3,2 s         | **0,5 s**  |
| LCP         | 5,7 s         | **0,7 s**  |
| TBT         | 0 ms          | **0 ms**   |
| CLS         | 0             | **0**      |
| Speed Index | 3,2 s         | **0,5 s**  |

Cette comparaison montre l'impact important du build de production optimisé par Angular.

Les résultats Lighthouse retenus comme référence dans ce document sont ceux obtenus sur le build de production et non ceux du serveur de développement.

---

## 4. Analyse et optimisations

Plusieurs mesures ont été prises ou vérifiées afin de maintenir les performances du projet :

- utilisation du build Angular de production pour les mesures frontend ;
- définition de budgets Angular pour surveiller la taille du bundle ;
- suppression de règles CSS dupliquées dans `my-space.css` ;
- utilisation d'un stockage objet S3 pour les fichiers, afin de ne pas faire transiter les fichiers volumineux par le backend ;
- utilisation d'URLs présignées pour les uploads ;
- utilisation de tests k6 pour surveiller les temps de réponse des endpoints critiques ;
- utilisation de Lighthouse pour mesurer les performances et la qualité frontend.

Les résultats obtenus ne montrent actuellement pas de problème majeur de performance dans l'environnement local.

Le fichier `my-space.css` reste toutefois un point de vigilance en raison du dépassement de 72 octets du seuil d'avertissement.

Le score SEO de 91 peut également être analysé ultérieurement afin d'identifier les recommandations restantes. Ce point est toutefois secondaire pour une application principalement destinée à des utilisateurs authentifiés.

---

## 5. Suivi des métriques

Les métriques suivantes sont retenues comme indicateurs de référence :

### Backend

- temps de réponse moyen ;
- médiane ;
- p95 ;
- temps de réponse maximal ;
- taux d'erreur.

### Frontend

- taille du bundle initial ;
- taille transférée estimée ;
- FCP ;
- LCP ;
- TBT ;
- CLS ;
- Speed Index ;
- scores Lighthouse Performance, Accessibility, Best Practices et SEO.

Ces mesures pourront être reproduites après une évolution importante de l'application ou une modification de l'architecture afin de détecter une éventuelle régression.

---

## 6. Conclusion

Les tests réalisés montrent des performances satisfaisantes sur l'environnement local du projet.

Côté backend, les endpoints testés présentent un taux d'erreur de 0 % et des temps de réponse faibles, avec un p95 inférieur à 120 ms pour l'ensemble des endpoints mesurés.

Côté frontend, le build de production obtient un score Lighthouse de 100/100 en Performance, Accessibility et Best Practices. Le LCP mesuré est de 0,7 seconde et le CLS de 0.

Les résultats constituent une base de référence pour surveiller les éventuelles régressions lors des évolutions futures du projet.