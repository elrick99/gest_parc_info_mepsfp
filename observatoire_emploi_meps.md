# Observatoire National de l'Emploi — MEPS Côte d'Ivoire
## Documentation Technique & Cahier des Charges du Dashboard d'Aide à la Décision

> **Version :** 1.0  
> **Ministère :** Ministère de l'Emploi et de la Protection Sociale (MEPS)  
> **Direction pilote :** Direction Générale de l'Emploi (DGE) — Observatoire de l'Emploi et des Métiers  
> **Destinataires :** Développeurs Full-Stack, Architectes SI, Chefs de projet DSI  
> **Statut :** Cahier des charges fonctionnel et technique  

---

## Table des matières

1. [Contexte & objectifs](#1-contexte--objectifs)
2. [Architecture générale du système](#2-architecture-générale-du-système)
3. [Modules du dashboard et contenu attendu](#3-modules-du-dashboard-et-contenu-attendu)
4. [Sources de données & APIs](#4-sources-de-données--apis)
5. [Modèle de données — Structure des entités](#5-modèle-de-données--structure-des-entités)
6. [Spécifications techniques des APIs internes](#6-spécifications-techniques-des-apis-internes)
7. [Stack technologique recommandée](#7-stack-technologique-recommandée)
8. [Sécurité, authentification & droits d'accès](#8-sécurité-authentification--droits-daccès)
9. [Indicateurs clés (KPIs) — Définitions & formules](#9-indicateurs-clés-kpis--définitions--formules)
10. [Processus ETL & Pipeline de données](#10-processus-etl--pipeline-de-données)
11. [Roadmap de développement](#11-roadmap-de-développement)
12. [Annexes — Références & normes](#12-annexes--références--normes)

---

## 1. Contexte & Objectifs

### 1.1 Contexte institutionnel

Le Ministère de l'Emploi et de la Protection Sociale (MEPS) est chargé, conformément au décret n°2022-604 du 03 août 2022, de la mise en œuvre et du suivi de la politique du Gouvernement en matière d'Emploi et de Protection sociale. La Direction Générale de l'Emploi (DGE) comprend notamment :

- **La Direction des Stratégies et Programmes d'Emploi**
- **La Direction du Suivi et de l'Évaluation de la Politique de l'Emploi**
- **La Direction de l'Observatoire de l'Emploi et des Métiers**

Cette dernière direction est responsable de la collecte, du traitement et de la diffusion des statistiques sur le marché du travail ivoirien. Le dashboard est l'outil central de visualisation et d'aide à la décision pour cette direction.

### 1.2 Problème à résoudre

Actuellement, les données sur l'emploi en Côte d'Ivoire sont :

- **Fragmentées** entre plusieurs institutions (DGE, INS, CNPS, CGRAE, CNAM, ONEF, PFS-CI)
- **Non centralisées** : chaque structure gère sa propre base de données sans interopérabilité
- **Peu accessibles** : pas d'interface unifiée pour les décideurs politiques
- **Mal actualisées** : les publications statistiques ont souvent 12 à 18 mois de retard
- **Non visualisées** : les données existent sous forme de fichiers Excel et PDF non exploitables dynamiquement

### 1.3 Objectifs du dashboard

| Objectif | Description | Bénéficiaire |
|---|---|---|
| Centralisation | Agréger toutes les données marché du travail en un point | DSI / DGE |
| Aide à la décision | Fournir des indicateurs actionnables aux décideurs | Ministre / DG |
| Suivi des programmes | Monitorer les programmes d'insertion en temps quasi-réel | Directeurs DGE |
| Transparence | Publier une version publique des données clés (Open Data) | Citoyens / Partenaires |
| Alerte précoce | Détecter automatiquement les anomalies sur le marché du travail | Analyste DGE |

### 1.4 Utilisateurs cibles

```
Niveau 1 — Décideurs (lecture seule, vue synthétique)
  ├── Ministre de l'Emploi
  ├── Directeur Général de l'Emploi (DGE)
  ├── Directeur Général du Travail (DGT)
  └── Directeur Général de la Protection Sociale (DGPS)

Niveau 2 — Analystes (lecture + filtres + export)
  ├── Analystes de l'Observatoire de l'Emploi et des Métiers
  ├── Chargés d'études DGE / DGT / DGPS
  └── Agents des Directions régionales

Niveau 3 — Administrateurs (lecture + écriture + configuration)
  ├── DSI MEPS
  └── Data Engineers

Niveau 4 — Public (lecture seule, données agrégées anonymisées)
  ├── Chercheurs / Universités
  ├── Partenaires (BIT, Banque Mondiale, BAD, AFD)
  └── Citoyens
```

---

## 2. Architecture Générale du Système

### 2.1 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SOURCES DE DONNÉES                           │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  INS (Stats) │  CNPS        │  CGRAE       │  DGE (registre emploi) │
│  CNAM (CMU)  │  ONEF        │  PFS-CI      │  MUGEF-CI / AIRMS      │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬─────────────┘
       │              │              │                   │
       ▼              ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     COUCHE ETL / INTÉGRATION                        │
│  Apache Airflow + Python (pandas) · Fréquence : quotidienne/mensuelle│
│  Validation · Nettoyage · Normalisation · Chargement entrepôt       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ENTREPÔT DE DONNÉES (Data Warehouse)            │
│  PostgreSQL 16 (schéma étoile) + TimescaleDB (séries temporelles)  │
│  Redis (cache KPIs temps réel) · MinIO (fichiers bruts)            │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API BACKEND (Laravel 11)                        │
│  REST API + JSON · Auth OAuth2/JWT · Rate limiting · Versioning     │
│  Endpoints : /api/v1/emploi · /api/v1/chomage · /api/v1/secteurs    │
└────────────────┬────────────────────────────────┬───────────────────┘
                 │                                │
        ▼                                ▼
┌──────────────────────┐     ┌──────────────────────────────┐
│  DASHBOARD INTERNE   │     │  API PUBLIQUE (Open Data)     │
│  Next.js 14 + Charts │     │  Données anonymisées agrégées │
│  Accès : agents MEPS │     │  Accès : public / partenaires │
└──────────────────────┘     └──────────────────────────────┘
```

### 2.2 Environnements

| Environnement | URL | Usage |
|---|---|---|
| Développement | `dev.observatoire.emploi.gouv.ci` | Dev & tests développeurs |
| Staging | `staging.observatoire.emploi.gouv.ci` | Recette MEPS/DSI |
| Production | `observatoire.emploi.gouv.ci` | Usage réel |
| API publique | `api.emploi.gouv.ci/v1` | Partenaires & Open Data |

---

## 3. Modules du Dashboard et Contenu Attendu

### 3.1 Module — Vue Générale (Tableau de bord exécutif)

**Audience principale :** Ministre, Directeurs Généraux  
**Fréquence de mise à jour :** Hebdomadaire (données consolidées)

#### Contenu requis

**KPIs principaux (4 métriques en tête de page) :**

| KPI | Définition | Source | Fréquence |
|---|---|---|---|
| Population active totale | Personnes en âge de travailler (15–64 ans) actives | INS | Annuelle |
| Taux de chômage global | % demandeurs d'emploi / population active | INS + DGE | Trimestrielle |
| Emplois formels créés | Nouveaux contrats déclarés CNPS sur la période | CNPS | Mensuelle |
| Taux de chômage jeunes (15–35 ans) | % chômeurs / pop. active 15–35 ans | INS + DGE | Trimestrielle |

**Graphiques :**
- Courbe d'évolution du taux de chômage sur 5 ans (global / femmes / jeunes)
- Donut de répartition de l'emploi par secteur d'activité
- Graphique en barres : flux mensuel offres reçues vs demandeurs inscrits
- Barres de progression des objectifs PND 2021–2025

**Alertes automatiques :**
- Alerte si taux de chômage d'une région dépasse un seuil configurable (défaut : +2 pts en 3 mois)
- Alerte si le ratio offres/demandes descend sous 0,30 dans un secteur
- Alerte si le nombre de dossiers CMU en attente dépasse un seuil

---

### 3.2 Module — Analyse du Chômage

**Audience principale :** Analystes DGE, Direction du Suivi  
**Fréquence :** Mensuelle (données CNPS/DGE) + Trimestrielle (INS)

#### Contenu requis

**KPIs :**
- Taux de chômage global, chômage longue durée (>12 mois), chômage des diplômés (Bac+2 et plus), chômage des femmes vs hommes

**Visualisations :**

```
1. Histogramme groupé : taux de chômage par tranche d'âge (15-24 / 25-34 / 35-44 / 45-54 / 55+) 
   décomposé par genre (hommes vs femmes)

2. Camembert : répartition des demandeurs par durée de chômage
   (< 3 mois / 3-6 mois / 6-12 mois / 1-2 ans / > 2 ans)

3. Tableau dynamique : profils des demandeurs d'emploi
   Colonnes : profil, niveau d'études, effectif, % femmes, durée moyenne, tension marché
   Filtres : région, secteur, niveau d'études, genre, tranche d'âge
```

**Filtres disponibles :**
- Période (mois / trimestre / année)
- Région / District
- Genre (tous / hommes / femmes)
- Niveau d'études (sans / BEPC / BAC / Bac+2 / Licence / Master+)
- Tranche d'âge

**Export :**
- CSV / Excel (données brutes filtrées)
- PDF (rapport formaté avec graphiques)

---

### 3.3 Module — Secteurs & Métiers porteurs

**Audience principale :** Direction des Stratégies et Programmes d'Emploi, ONEF  
**Fréquence :** Trimestrielle

#### Contenu requis

**Visualisations :**

```
1. Barres horizontales : nombre d'emplois par secteur (Agriculture, Commerce, 
   Services, BTP, Industrie, Numérique, Énergie, Santé, Administration)

2. Barres horizontales : croissance de l'emploi par secteur sur 2 ans (%)

3. Barres horizontales : salaire médian par secteur (FCFA/mois)

4. Tableau : Métiers en tension (besoins non couverts)
   Colonnes : secteur, métier, postes vacants, taux de couverture, salaire médian, tendance
```

**Indicateurs métiers en tension :**

Pour chaque métier identifié en tension, collecter :

| Champ | Source | Description |
|---|---|---|
| `code_rome_ci` | DGE (à créer) | Code métier adapté du ROME français au contexte CI |
| `intitule_metier` | DGE / ONEF | Intitulé normalisé |
| `secteur_nomen` | INS (nomenclature CI) | Secteur selon nomenclature ivoirienne |
| `nb_offres_ouvertes` | DGE Bourse emploi | Nombre d'offres actives |
| `nb_candidatures` | DGE Bourse emploi | Nombre de candidatures reçues |
| `taux_couverture` | Calculé | `(nb_candidatures / nb_offres_ouvertes) * 100` |
| `salaire_median_fcfa` | CNPS + enquêtes DGE | Médiane des salaires déclarés |
| `tendance_12m` | DGE | Hausse / Stable / Baisse sur 12 mois |
| `region_principale` | DGE | Région où la tension est la plus forte |

---

### 3.4 Module — Répartition Régionale

**Audience principale :** Directeurs régionaux, Cabinet du Ministre  
**Fréquence :** Trimestrielle

#### Contenu requis

**Carte choroplèthe de la Côte d'Ivoire :**
- Découpée par district (14 régions / 2 districts autonomes)
- Couleur encodant le taux de chômage (gradient vert → orange → rouge)
- Bulles proportionnelles à la concentration d'emploi formel
- Clic sur une région → panneau latéral avec KPIs régionaux détaillés

**Données géographiques nécessaires :**

```json
// Format attendu par région
{
  "region_id": "LAG",
  "region_nom": "Lagunes",
  "district": "District Autonome d'Abidjan",
  "chef_lieu": "Abidjan",
  "population_active": 3800000,
  "emploi_formel_pct": 47.2,
  "taux_chomage": 10.2,
  "secteur_dominant": "Services / Commerce",
  "nb_demandeurs_inscrits": 187400,
  "nb_offres_actives": 12800,
  "programmes_actifs": ["C2D", "SIVP"],
  "geojson_feature_id": "CI-AB"  // Identifiant dans le fichier GeoJSON CI
}
```

**Fichier GeoJSON requis :**
- Frontières administratives Côte d'Ivoire niveau région
- Source : [données.gouv.ci](https://www.data.gouv.ci) ou BNETD
- Format : GeoJSON WGS84 (EPSG:4326)
- Champ de jointure : `ADM1_PCODE` (code région ISO)

**Tableau récapitulatif régional :**

| Colonne | Source |
|---|---|
| District / Région | Découpage administratif CI |
| Population active | INS (RGPH 2021 extrapolé) |
| % emploi formel | CNPS / INS |
| Taux de chômage | INS / DGE |
| Secteur dominant | CNPS / INS |
| Priorité DGE | Calculé selon seuils de criticité |

---

### 3.5 Module — Programmes d'Insertion & d'Emploi

**Audience principale :** Direction des Stratégies et Programmes, Cabinet  
**Fréquence :** Mensuelle

#### Programmes à monitorer

| Programme | Acronyme | Structure gestionnaire | Population cible |
|---|---|---|---|
| Projet Emploi Jeunes (C2D) | C2D-EJ | DGE / AFD | Jeunes 18–35 ans |
| Stage d'Initiation à la Vie Professionnelle | SIVP | DGE / ONEF | Jeunes diplômés |
| Fonds pour l'Insertion des Personnes en Situation de Handicap | FIPPSH | DGPS | Personnes handicapées |
| Programme femmes rurales | PFR | DGE / DGPS | Femmes rurales |
| Compendium des Compétences des Séniors | CCS | DGE | Personnes 40–65 ans |
| Régime Social des Travailleurs Indépendants | RSTI | CNPS | Travailleurs informels |

#### Données à collecter par programme

```
Pour chaque programme :
├── Nombre de bénéficiaires inscrits (cumulatif)
├── Nombre de bénéficiaires actifs (en cours)
├── Nombre de sorties (fin de programme)
├── Taux d'insertion à 6 mois (suivi post-sortie)
├── Taux d'insertion à 12 mois
├── Répartition par genre des bénéficiaires (% femmes)
├── Répartition par région
├── Budget consommé vs alloué
├── Évolution mensuelle des inscriptions
└── Entreprises partenaires actives
```

---

### 3.6 Module — Protection Sociale (DGPS)

**Audience principale :** DGPS, CNAM, Cabinet  
**Fréquence :** Mensuelle

#### Régimes à suivre

**CMU — Couverture Maladie Universelle (CNAM)**

| Indicateur | Définition |
|---|---|
| Assurés CMU actifs | Personnes avec carte CMU valide |
| Nouveaux enrôlements (mois) | Inscriptions dans le mois |
| Taux de couverture national | Assurés / Population cible |
| Cotisations collectées (FCFA) | Montant recouvré dans la période |
| Taux de recouvrement | Cotisations collectées / Cotisations dues |
| Prestations servies | Nombre de consultations remboursées |
| Répartition par statut | Salarié / Indépendant RSTI / Indigent / Fonctionnaire |

**CNPS — Caisse Nationale de Prévoyance Sociale**

| Indicateur | Définition |
|---|---|
| Cotisants actifs | Travailleurs avec déclaration CNPS active |
| Employeurs affiliés | Entreprises déclarantes |
| Cotisations collectées | Montant total période |
| Prestations versées | AT/MP, maternité, allocations familiales |
| Taux de conformité employeurs | Employeurs à jour / employeurs affiliés |

**CGRAE — Caisse Générale de Retraite des Agents de l'État**

| Indicateur | Définition |
|---|---|
| Cotisants actifs (fonctionnaires) | Agents en activité cotisant |
| Retraités CGRAE | Pensionnaires actifs |
| Ratio cotisants/retraités | Indicateur de soutenabilité du régime |
| Pension moyenne mensuelle (FCFA) | Médiane des pensions versées |

---

## 4. Sources de Données & APIs

### 4.1 Sources internes MEPS (à développer / à consolider)

#### 4.1.1 Registre national des demandeurs d'emploi (DGE)

**Situation actuelle :** Base de données existante mais non exposée en API  
**Travail requis :** Créer une API REST Laravel + documenter le schéma  

**Données disponibles :**

```json
// Endpoint à créer : GET /api/v1/demandeurs
{
  "id_demandeur": "string (UUID)",
  "date_inscription": "date",
  "region_code": "string",
  "genre": "M | F",
  "date_naissance": "date",
  "niveau_etudes": "SANS | BEPC | BAC | BTS | LICENCE | MASTER | DOCTORAT",
  "domaine_formation": "string",
  "experience_annees": "integer",
  "statut": "CHERCHEUR | EN_FORMATION | PLACE | ABANDON",
  "duree_chomage_jours": "integer",
  "programme_suivi": "string | null",
  "date_sortie": "date | null"
}
```

#### 4.1.2 Bourse nationale de l'emploi (DGE / ONEF)

**Situation actuelle :** Portail ONEF (onef.ci) avec données partielles  
**API disponible :** À confirmer avec ONEF — prévoir scraping si API absente  

**Données attendues :**

```json
// Endpoint à créer : GET /api/v1/offres
{
  "id_offre": "string",
  "date_publication": "date",
  "date_expiration": "date",
  "employeur_id": "string",
  "secteur_nomen": "string",
  "metier_code": "string",
  "region_code": "string",
  "type_contrat": "CDI | CDD | STAGE | SIVP | INTERIM",
  "niveau_requis": "string",
  "experience_requise_annees": "integer",
  "salaire_min_fcfa": "integer | null",
  "salaire_max_fcfa": "integer | null",
  "nb_candidatures_reçues": "integer",
  "statut": "OUVERTE | POURVUE | EXPIREE | ANNULEE"
}
```

#### 4.1.3 Suivi des programmes DGE (SYGESCO existant)

**Situation actuelle :** Application SYGESCO sur `sygesco.drhmeps.net`  
**Travail requis :** Exposer des endpoints de lecture pour le dashboard  

---

### 4.2 Sources externes — Partenaires institutionnels

#### 4.2.1 INS — Institut National de la Statistique

**Contact :** [www.ins.ci](http://www.ins.ci)  
**Données disponibles :**
- Enquête nationale sur la situation de l'emploi et le travail des enfants (ENSETE)
- Recensement Général de la Population et de l'Habitat (RGPH 2021)
- Comptes nationaux (PIB, emploi formel)
- Enquête sur le niveau de vie des ménages (ENV)

**Méthode d'accès :**

```
Actuellement : Fichiers Excel/PDF publiés sur le site INS
À terme : Protocole d'échange de données signé MEPS-INS
Format : Excel → ETL → PostgreSQL (fréquence annuelle / trimestrielle)
```

**Structure des données INS (à importer) :**

| Fichier INS | Fréquence | Variables clés |
|---|---|---|
| ENSETE annuelle | Annuelle | Taux chômage, emploi par secteur, sous-emploi |
| Bulletin trimestriel emploi | Trimestrielle | Variation emploi, ILC (Indice Leading Chômage) |
| Annuaire statistique | Annuelle | Tous indicateurs macro-économiques |

#### 4.2.2 CNPS — Caisse Nationale de Prévoyance Sociale

**Site :** [www.cnps.ci](https://www.cnps.ci)  
**Données disponibles :**
- Nombre de cotisants actifs (mensuel)
- Nombre d'employeurs affiliés
- Montant des cotisations collectées
- Prestations versées (AT/MP, allocations familiales, maternité)
- Données de conformité employeurs

**Méthode d'accès souhaitée :**

```
Court terme : Export mensuel CSV transmis par CNPS au MEPS (protocole MOU)
Moyen terme : API CNPS avec authentification inter-institutionnelle (OAuth2 M2M)

Endpoint cible :
GET https://api.cnps.ci/v1/statistiques/mensuelles?mois=2024-12
Authorization: Bearer {token_inter_institutionnel}
```

#### 4.2.3 CGRAE — Caisse Générale de Retraite des Agents de l'État

**Site :** [www.cgrae.ci](https://www.cgrae.ci)  
**Données disponibles :**
- Nombre de fonctionnaires cotisants
- Nombre de retraités et pensions versées
- Régime complémentaire par capitalisation

**Méthode d'accès :**

```
Protocole d'échange signé MEPS-CGRAE
Format : Fichiers CSV chiffrés via SFTP (mensuel)
Fréquence : J+5 de chaque mois (données du mois précédent)
```

#### 4.2.4 CNAM — Institut de Prévoyance Sociale (Couverture Maladie Universelle)

**Site :** [www.ipscnam.ci](https://www.ipscnam.ci)  
**Données disponibles :**
- Nombre d'assurés CMU par statut (salarié / indépendant / indigent / fonctionnaire)
- Nouveaux enrôlements mensuels par région
- Cotisations collectées et prestations servies
- Taux de couverture par district

**Méthode d'accès :**

```
CNAM dispose d'un SI interne (SIGI-CMU)
Convention de partage de données MEPS-CNAM à formaliser
Format attendu : API REST ou export CSV mensuel chiffré
Granularité : Données régionales (pas individuelles - respect RGPD local)
```

#### 4.2.5 ONEF — Observatoire National de l'Emploi et de la Formation

**Site :** [www.onef.ci](https://onef.ci)  
**Rôle :** Structure sous-tutelle du MEPS — producteur de données sur l'emploi  
**Données disponibles :**
- Offres d'emploi de la Bourse nationale de l'emploi
- Profils des demandeurs enregistrés
- Résultats des mises en relation offres/demandes
- Statistiques par secteur et métier

**Méthode d'accès :**

```
ONEF est sous tutelle MEPS → accès direct aux bases de données
Intégration via schéma partagé PostgreSQL ou API interne
Priorité haute : c'est la source la plus riche pour les données emploi
```

#### 4.2.6 AIRMS — Agence Ivoirienne de Régulation du Marché du Travail Spécialisé

**Site :** [www.airms-ci.com](https://www.airms-ci.com)  
**Données disponibles :**
- Agréments des entreprises de travail temporaire
- Statistiques des travailleurs temporaires / intérimaires

---

### 4.3 Sources externes — Données internationales de référence

#### 4.3.1 BIT/OIT — Bureau International du Travail

**API disponible :** ILOSTAT REST API (publique, gratuite)  
**URL :** `https://ilostat.ilo.org/resources/ilostat-api/`

**Endpoints utiles :**

```bash
# Taux de chômage Côte d'Ivoire par genre
GET https://ilostat.ilo.org/resources/ilostat-api/rest/data/DF_UR/CIV..SEX_T+SEX_M+SEX_F.A/?format=jsondata

# Emploi par secteur
GET https://ilostat.ilo.org/resources/ilostat-api/rest/data/DF_EMP_TEMP_SEX_ECO_NB/CIV...A/?format=jsondata

# Paramètres importants
# CIV = Code ISO Côte d'Ivoire
# SEX_T = Total, SEX_M = Hommes, SEX_F = Femmes
# A = Annuel, Q = Trimestriel
```

**Exemple de réponse ILOSTAT :**

```json
{
  "header": { "id": "DF_UR", "prepared": "2024-01-15" },
  "dataSets": [{
    "series": {
      "0:0:0:0": {
        "observations": {
          "0": [9.4, 0, null],
          "1": [8.9, 0, null]
        }
      }
    }
  }]
}
```

#### 4.3.2 Banque Mondiale — Open Data API

**URL :** `https://api.worldbank.org/v2/`  
**Gratuit, pas d'authentification requise**

```bash
# Taux de chômage CI (indicateur SL.UEM.TOTL.ZS)
GET https://api.worldbank.org/v2/country/CI/indicator/SL.UEM.TOTL.ZS?format=json&mrv=10

# Population active CI
GET https://api.worldbank.org/v2/country/CI/indicator/SL.TLF.TOTL.IN?format=json&mrv=10

# Part emploi agriculture
GET https://api.worldbank.org/v2/country/CI/indicator/SL.AGR.EMPL.ZS?format=json&mrv=10

# Chômage des jeunes (15-24)
GET https://api.worldbank.org/v2/country/CI/indicator/SL.UEM.1524.ZS?format=json&mrv=10

# Chômage des femmes
GET https://api.worldbank.org/v2/country/CI/indicator/SL.UEM.TOTL.FE.ZS?format=json&mrv=10
```

**Exemple de réponse Banque Mondiale :**

```json
[
  {"page": 1, "pages": 1, "per_page": 50, "total": 10},
  [
    {
      "indicator": {"id": "SL.UEM.TOTL.ZS", "value": "Unemployment, total (% of total labor force)"},
      "country": {"id": "CI", "value": "Cote d'Ivoire"},
      "countryiso3code": "CIV",
      "date": "2023",
      "value": 9.4,
      "unit": "",
      "obs_status": "",
      "decimal": 1
    }
  ]
]
```

**Indicateurs Banque Mondiale pertinents pour CI :**

| Code indicateur | Description | Fréquence |
|---|---|---|
| `SL.UEM.TOTL.ZS` | Chômage total (% pop. active) | Annuelle |
| `SL.UEM.1524.ZS` | Chômage jeunes 15-24 (%) | Annuelle |
| `SL.UEM.TOTL.FE.ZS` | Chômage femmes (%) | Annuelle |
| `SL.TLF.TOTL.IN` | Population active totale | Annuelle |
| `SL.TLF.CACT.FE.ZS` | Taux activité femmes (%) | Annuelle |
| `SL.AGR.EMPL.ZS` | Emploi agriculture (%) | Annuelle |
| `SL.IND.EMPL.ZS` | Emploi industrie (%) | Annuelle |
| `SL.SRV.EMPL.ZS` | Emploi services (%) | Annuelle |
| `SL.EMP.VULN.ZS` | Emploi vulnérable (%) | Annuelle |
| `SI.POV.NAHC` | Taux de pauvreté national (%) | Annuelle |
| `NY.GDP.MKTP.KD.ZG` | Croissance PIB (%) | Annuelle |

#### 4.3.3 BAD — Banque Africaine de Développement

**URL :** `https://www.afdb.org/api/datasets`  
**Documentation :** [Developer Portal BAD](https://dataportal.opendataforafrica.org/)

---

### 4.4 Données géospatiales

#### GeoJSON Côte d'Ivoire — Régions administratives

```javascript
// Fichier à télécharger et héberger localement
// Source 1 (recommandée) : GADM Database
// https://gadm.org/download_country.html?country=CIV
// Niveau ADM1 = Régions / ADM2 = Départements

// Source 2 : Données ouvertes BNETD (Bureau National d'Études Techniques et de Développement)
// Contact : bnetd.ci

// Format : GeoJSON WGS84
// Champ de jointure avec les données emploi : properties.GID_1 (ex: "CIV.1_1")

// Exemple de feature GeoJSON pour une région
{
  "type": "Feature",
  "properties": {
    "GID_0": "CIV",
    "NAME_0": "Côte d'Ivoire",
    "GID_1": "CIV.1_1",
    "NAME_1": "Abidjan",
    "TYPE_1": "District Autonome"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[...long/lat pairs...]]]
  }
}
```

**Bibliothèques cartographiques recommandées :**
- **Leaflet.js** (open source, léger) — pour cartes choroplèthes simples
- **MapLibre GL** — pour cartes vectorielles performantes
- **D3.js** — pour cartes SVG personnalisées (plus de contrôle)
- **React Simple Maps** — pour intégration React/Next.js

---

## 5. Modèle de Données — Structure des Entités

### 5.1 Schéma de l'entrepôt de données (PostgreSQL)

```sql
-- ═══════════════════════════════════════════
-- DIMENSIONS (tables de référence)
-- ═══════════════════════════════════════════

-- Table des régions administratives CI
CREATE TABLE dim_regions (
    region_id         VARCHAR(10) PRIMARY KEY,    -- ex: "LAG", "YAM", "SAV"
    region_nom        VARCHAR(100) NOT NULL,
    district_nom      VARCHAR(100),
    chef_lieu         VARCHAR(100),
    population_totale BIGINT,
    geojson_id        VARCHAR(50),                -- Identifiant dans fichier GeoJSON
    actif             BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Table des secteurs d'activité (nomenclature INS CI)
CREATE TABLE dim_secteurs (
    secteur_id        VARCHAR(10) PRIMARY KEY,    -- ex: "AGR", "COM", "SRV", "BTP"
    secteur_nom       VARCHAR(100) NOT NULL,
    secteur_nom_court VARCHAR(30),
    code_isic_rev4    VARCHAR(5),                 -- Classification ISIC internationale
    description       TEXT,
    actif             BOOLEAN DEFAULT TRUE
);

-- Table des métiers (nomenclature à créer pour CI)
CREATE TABLE dim_metiers (
    metier_id         SERIAL PRIMARY KEY,
    code_ci           VARCHAR(10) UNIQUE,         -- Code métier ivoirien (à standardiser)
    intitule          VARCHAR(200) NOT NULL,
    intitule_court    VARCHAR(80),
    secteur_id        VARCHAR(10) REFERENCES dim_secteurs(secteur_id),
    niveau_requis     VARCHAR(20),                -- SANS / BEPC / BAC / BTS / LICENCE / MASTER
    description       TEXT,
    actif             BOOLEAN DEFAULT TRUE
);

-- Table des programmes DGE
CREATE TABLE dim_programmes (
    programme_id      VARCHAR(20) PRIMARY KEY,    -- ex: "C2D", "SIVP", "FIPPSH"
    programme_nom     VARCHAR(200) NOT NULL,
    programme_sigle   VARCHAR(20),
    description       TEXT,
    date_debut        DATE,
    date_fin          DATE,
    budget_total_fcfa BIGINT,
    structure_gestionnaire VARCHAR(100),
    population_cible  TEXT,
    actif             BOOLEAN DEFAULT TRUE
);

-- Table des périodes (calendrier)
CREATE TABLE dim_periodes (
    periode_id        SERIAL PRIMARY KEY,
    annee             SMALLINT NOT NULL,
    trimestre         SMALLINT,                   -- 1, 2, 3, 4 (null si annuel)
    mois              SMALLINT,                   -- 1-12 (null si trimestriel/annuel)
    libelle           VARCHAR(30),               -- ex: "T1 2024", "Jan 2024", "2024"
    granularite       VARCHAR(15) NOT NULL,       -- ANNUEL / TRIMESTRIEL / MENSUEL
    date_debut        DATE NOT NULL,
    date_fin          DATE NOT NULL
);

-- ═══════════════════════════════════════════
-- FAITS (tables de métriques)
-- ═══════════════════════════════════════════

-- Statistiques globales du marché du travail par région et période
CREATE TABLE fait_emploi_regional (
    id                    BIGSERIAL PRIMARY KEY,
    periode_id            INT REFERENCES dim_periodes(periode_id),
    region_id             VARCHAR(10) REFERENCES dim_regions(region_id),
    source                VARCHAR(50) NOT NULL,             -- INS, CNPS, DGE, etc.

    -- Population
    population_totale     BIGINT,
    population_active     BIGINT,
    population_15_64      BIGINT,

    -- Emploi
    emploi_total          BIGINT,
    emploi_formel         BIGINT,
    emploi_informel       BIGINT,
    emploi_agriculture    BIGINT,
    emploi_industrie      BIGINT,
    emploi_services       BIGINT,

    -- Chômage
    nb_chomeurs_total     BIGINT,
    nb_chomeurs_hommes    BIGINT,
    nb_chomeurs_femmes    BIGINT,
    nb_chomeurs_jeunes    BIGINT,                           -- 15-35 ans
    nb_chomeurs_longue_duree BIGINT,                        -- > 12 mois

    -- Taux calculés
    taux_activite         DECIMAL(5,2),
    taux_chomage          DECIMAL(5,2),
    taux_chomage_jeunes   DECIMAL(5,2),
    taux_chomage_femmes   DECIMAL(5,2),
    taux_emploi_formel    DECIMAL(5,2),

    -- Salaires
    salaire_median_fcfa   INT,
    salaire_moyen_fcfa    INT,

    -- Métadonnées
    date_extraction       TIMESTAMP DEFAULT NOW(),
    valide                BOOLEAN DEFAULT TRUE,
    commentaire           TEXT,

    UNIQUE(periode_id, region_id, source)
);

-- Flux offres / demandes mensuel
CREATE TABLE fait_flux_emploi (
    id                    BIGSERIAL PRIMARY KEY,
    periode_id            INT REFERENCES dim_periodes(periode_id),
    region_id             VARCHAR(10) REFERENCES dim_regions(region_id),
    secteur_id            VARCHAR(10) REFERENCES dim_secteurs(secteur_id),

    nb_offres_deposees    INT DEFAULT 0,
    nb_offres_pourvues    INT DEFAULT 0,
    nb_offres_expirees    INT DEFAULT 0,
    nb_demandeurs_inscrits INT DEFAULT 0,
    nb_demandeurs_places   INT DEFAULT 0,
    ratio_offre_demande   DECIMAL(5,3),           -- nb_offres / nb_demandeurs

    source                VARCHAR(50),            -- DGE, ONEF
    date_extraction       TIMESTAMP DEFAULT NOW(),

    UNIQUE(periode_id, region_id, secteur_id)
);

-- Métiers en tension
CREATE TABLE fait_tension_metiers (
    id                    BIGSERIAL PRIMARY KEY,
    periode_id            INT REFERENCES dim_periodes(periode_id),
    metier_id             INT REFERENCES dim_metiers(metier_id),
    region_id             VARCHAR(10) REFERENCES dim_regions(region_id),

    nb_offres_ouvertes    INT DEFAULT 0,
    nb_candidatures       INT DEFAULT 0,
    taux_couverture       DECIMAL(5,2),           -- (candidatures/offres)*100
    salaire_median_fcfa   INT,
    tendance              VARCHAR(10),            -- HAUSSE / STABLE / BAISSE

    source                VARCHAR(50),
    date_extraction       TIMESTAMP DEFAULT NOW(),

    UNIQUE(periode_id, metier_id, region_id)
);

-- Suivi des programmes DGE
CREATE TABLE fait_programmes (
    id                    BIGSERIAL PRIMARY KEY,
    periode_id            INT REFERENCES dim_periodes(periode_id),
    programme_id          VARCHAR(20) REFERENCES dim_programmes(programme_id),
    region_id             VARCHAR(10) REFERENCES dim_regions(region_id),

    nb_beneficiaires_inscrits    INT DEFAULT 0,
    nb_beneficiaires_actifs      INT DEFAULT 0,
    nb_beneficiaires_sortis      INT DEFAULT 0,
    nb_beneficiaires_femmes      INT DEFAULT 0,
    taux_insertion_6mois         DECIMAL(5,2),   -- % placés 6 mois après sortie
    taux_insertion_12mois        DECIMAL(5,2),
    budget_consomme_fcfa         BIGINT,
    nb_entreprises_partenaires   INT,

    source                VARCHAR(50),
    date_extraction       TIMESTAMP DEFAULT NOW(),

    UNIQUE(periode_id, programme_id, region_id)
);

-- Protection sociale (CMU / CNPS / CGRAE)
CREATE TABLE fait_protection_sociale (
    id                       BIGSERIAL PRIMARY KEY,
    periode_id               INT REFERENCES dim_periodes(periode_id),
    region_id                VARCHAR(10) REFERENCES dim_regions(region_id),
    regime                   VARCHAR(20) NOT NULL, -- CMU, CNPS, CGRAE, RSTI

    -- CMU
    nb_assures_actifs        BIGINT,
    nb_nouveaux_enrolements  INT,
    taux_couverture          DECIMAL(5,2),
    cotisations_collectees_fcfa  BIGINT,
    prestations_servies_fcfa     BIGINT,

    -- CNPS
    nb_cotisants             INT,
    nb_employeurs_affilies   INT,

    -- CGRAE
    nb_retraites             INT,
    pension_mediane_fcfa     INT,

    source                   VARCHAR(50),
    date_extraction          TIMESTAMP DEFAULT NOW(),

    UNIQUE(periode_id, region_id, regime)
);

-- ═══════════════════════════════════════════
-- VUES MATÉRIALISÉES (pour performance)
-- ═══════════════════════════════════════════

-- KPIs nationaux agrégés (actualisées toutes les nuits)
CREATE MATERIALIZED VIEW vue_kpis_nationaux AS
SELECT
    p.annee,
    p.trimestre,
    SUM(f.population_active)                                    AS pop_active_nationale,
    AVG(f.taux_chomage)                                         AS taux_chomage_national,
    AVG(f.taux_chomage_jeunes)                                  AS taux_chomage_jeunes,
    AVG(f.taux_chomage_femmes)                                  AS taux_chomage_femmes,
    SUM(f.emploi_formel)                                        AS emploi_formel_national
FROM fait_emploi_regional f
JOIN dim_periodes p ON f.periode_id = p.periode_id
WHERE f.valide = TRUE
GROUP BY p.annee, p.trimestre
ORDER BY p.annee DESC, p.trimestre DESC;

CREATE UNIQUE INDEX ON vue_kpis_nationaux (annee, trimestre);
```

---

## 6. Spécifications Techniques des APIs Internes

### 6.1 Structure générale de l'API Laravel

**Base URL :** `https://api.emploi.gouv.ci/v1`  
**Format :** JSON  
**Authentification :** Bearer Token (JWT) via OAuth2  
**Versioning :** Via URL (`/v1/`, `/v2/`)  
**Rate limiting :** 100 req/min (public) · 1000 req/min (authentifié)  

**Headers obligatoires :**

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
X-API-Version: 1.0
```

**Format de réponse standard :**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "source": "DGE",
    "periode": "2024-T4",
    "date_extraction": "2025-01-15T10:30:00Z",
    "total": 100,
    "page": 1,
    "per_page": 25
  },
  "errors": null
}
```

### 6.2 Endpoints principaux

```
GET  /v1/emploi/kpis
     Paramètres : annee, trimestre, region_id
     Description : KPIs agrégés (taux chômage, pop active, emploi formel)

GET  /v1/emploi/evolution
     Paramètres : indicateur, date_debut, date_fin, region_id, granularite
     Description : Série temporelle d'un indicateur

GET  /v1/emploi/regional
     Paramètres : annee, trimestre
     Description : Données par région (pour carte choroplèthe)

GET  /v1/chomage/profils
     Paramètres : periode, region, genre, niveau_etudes, tranche_age
     Description : Distribution des demandeurs d'emploi

GET  /v1/secteurs/emploi
     Paramètres : periode, region
     Description : Emploi et croissance par secteur

GET  /v1/metiers/tension
     Paramètres : periode, region, secteur
     Description : Métiers en tension et taux de couverture

GET  /v1/programmes/suivi
     Paramètres : programme_id, periode, region
     Description : Indicateurs de suivi des programmes DGE

GET  /v1/protection-sociale/cmu
     Paramètres : periode, region
     Description : Données CMU et enrôlement

GET  /v1/alertes
     Description : Alertes actives selon les seuils configurés

POST /v1/export/csv
     Body : { "module": "chomage", "filtres": {...} }
     Description : Génère un export CSV des données filtrées

POST /v1/export/pdf
     Body : { "module": "vue-generale", "periode": "2024" }
     Description : Génère un rapport PDF avec graphiques
```

### 6.3 Exemple de réponse — Données régionales

```json
// GET /v1/emploi/regional?annee=2024&trimestre=4
{
  "success": true,
  "data": [
    {
      "region_id": "LAG",
      "region_nom": "Lagunes (Abidjan)",
      "geojson_id": "CIV.AB",
      "population_active": 3800000,
      "emploi_formel": 1786000,
      "taux_emploi_formel": 47.0,
      "taux_chomage": 10.2,
      "taux_chomage_jeunes": 24.1,
      "nb_offres_actives": 12800,
      "nb_demandeurs_inscrits": 187400,
      "ratio_offre_demande": 0.068,
      "secteur_dominant": "Services",
      "indice_tension": "ELEVE",
      "programmes_actifs": ["C2D", "SIVP"]
    }
  ],
  "meta": {
    "source": "DGE / INS / CNPS",
    "periode": "2024-T4",
    "nb_regions": 14
  }
}
```

---

## 7. Stack Technologique Recommandée

### 7.1 Frontend — Dashboard

| Composant | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR pour SEO, performance, écosystème React |
| Langage | **TypeScript** | Typage fort, meilleure maintenabilité |
| Styling | **Tailwind CSS** | Rapidité de développement, cohérence |
| Graphiques | **Recharts** ou **Chart.js** | Légers, bien documentés, accessibles |
| Cartes | **Leaflet.js** + **react-leaflet** | Open source, adapté aux cartes choroplèthes |
| Tableaux | **TanStack Table v8** | Tri, filtres, pagination côté client |
| État global | **Zustand** | Léger, adapté aux filtres partagés |
| Requêtes API | **TanStack Query** | Cache, invalidation, loading states |
| Export | **react-pdf** + **xlsx** | PDF côté client, Excel natif |
| Auth | **NextAuth.js** | OAuth2, sessions sécurisées |
| Icônes | **Lucide React** | Open source, SVG optimisés |

### 7.2 Backend — API

| Composant | Technologie | Justification |
|---|---|---|
| Framework | **Laravel 11** | Maîtrisé par les équipes DSI MEPS (existant) |
| Langage | **PHP 8.3** | Performances améliorées, types stricts |
| Base de données | **PostgreSQL 16** | Robustesse, TimescaleDB pour séries temporelles |
| Cache | **Redis** | KPIs mis en cache, sessions, rate limiting |
| Queue | **Laravel Horizon** (Redis) | Jobs ETL asynchrones |
| Auth | **Laravel Passport** | OAuth2 complet, tokens M2M inter-institutions |
| ORM | **Eloquent** | Standard Laravel, migrations gérées |
| API Docs | **Scribe** ou **L5-Swagger** | Documentation OpenAPI auto-générée |

### 7.3 ETL & Data Pipeline

| Composant | Technologie | Usage |
|---|---|---|
| Orchestration | **Apache Airflow** (ou Laravel Scheduler pour démarrer) | Planification des jobs ETL |
| Transformation | **Python + pandas** | Nettoyage et normalisation des données |
| Stockage fichiers bruts | **MinIO** (self-hosted S3) | Archives des fichiers sources |
| Monitoring | **Grafana** + **Prometheus** | Alertes sur les pipelines ETL |

### 7.4 Infrastructure

| Composant | Recommandation | Note |
|---|---|---|
| Hébergement | Serveurs ARTCI / Centre de données ivoirien | Souveraineté des données (loi n°2013-450) |
| Alternative Azure | Zone francophone + conformité RGPD | Si hébergement local non disponible |
| Reverse proxy | **Nginx** | Performance, SSL termination |
| SSL | Let's Encrypt ou certificat ARTCI | HTTPS obligatoire |
| CI/CD | **GitHub Actions** ou **GitLab CI** | Déploiements automatisés |
| Backup | PostgreSQL pg_dump quotidien | Rétention 90 jours |

---

## 8. Sécurité, Authentification & Droits d'Accès

### 8.1 Matrice des droits par rôle

| Rôle | Vue générale | Données régionales | Données brutes | Export | Configuration alertes | Gestion utilisateurs |
|---|---|---|---|---|---|---|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `analyste_dge` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `agent_regional` | ✅ | Région seule | ❌ | ✅ Région | ❌ | ❌ |
| `decideur` | ✅ | ✅ | ❌ | ✅ PDF | ❌ | ❌ |
| `api_publique` | Agrégé national | Agrégé régional | ❌ | ❌ | ❌ | ❌ |

### 8.2 Authentification

```php
// Laravel Passport — Configuration OAuth2
// Scopes disponibles
'scopes' => [
    'read:kpis'           => 'Lire les KPIs agrégés',
    'read:regional'       => 'Lire les données régionales',
    'read:raw'            => 'Accéder aux données brutes',
    'write:alertes'       => 'Configurer les alertes',
    'export:csv'          => 'Exporter en CSV',
    'export:pdf'          => 'Exporter en PDF',
    'admin'               => 'Accès complet administration',
],

// Tokens inter-institutionnels (CNPS, CGRAE, etc.)
// Client Credentials Flow (M2M) — pas d'utilisateur humain
$grantTypes = ['client_credentials'];
```

### 8.3 Règles de sécurité des données

- **Données individuelles jamais exposées** : toutes les API retournent des agrégats (minimum : niveau régional)
- **Seuil de confidentialité** : si une cellule agrégée contient moins de 5 individus, afficher `< 5` ou masquer
- **Chiffrement en transit** : TLS 1.3 obligatoire sur tous les endpoints
- **Chiffrement au repos** : PostgreSQL avec tablespace chiffré
- **Audit log** : toute requête API loggée (user, timestamp, endpoint, IP)
- **Conformité** : Loi ivoirienne n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel (ARTCI)

---

## 9. Indicateurs Clés (KPIs) — Définitions & Formules

### 9.1 Indicateurs d'emploi

```
Taux d'activité (TA) :
  TA = (Population active / Population en âge de travailler 15-64 ans) × 100

Taux d'emploi (TE) :
  TE = (Personnes employées / Population en âge de travailler) × 100

Taux de chômage (TC) :
  TC = (Chômeurs / Population active) × 100
  [Définition BIT : sans emploi + disponibles + en recherche active]

Taux de chômage élargi (TCE) :
  TCE = (Chômeurs + Sous-employés / Population active) × 100

Ratio offre/demande (ROD) :
  ROD = Nombre d'offres d'emploi actives / Nombre de demandeurs inscrits

Taux de couverture d'un métier (TCM) :
  TCM = (Candidatures reçues / Offres ouvertes) × 100
  Métier en tension si TCM < 70%

Taux d'insertion à 6 mois (TI6) :
  TI6 = (Bénéficiaires placés 6 mois après sortie / Total sorties) × 100

Taux de formalisation de l'emploi (TFE) :
  TFE = (Emplois déclarés CNPS / Total emplois estimés) × 100
```

### 9.2 Indicateurs de protection sociale

```
Taux de couverture CMU (TCCMU) :
  TCCMU = (Assurés CMU actifs / Population totale) × 100
  Cible PND 2025 : 50% | Cible 2030 : 75%

Taux de recouvrement CMU (TRCMU) :
  TRCMU = (Cotisations collectées / Cotisations dues théoriques) × 100

Ratio de dépendance démographique CGRAE :
  RD = Nombre de retraités / Nombre de cotisants actifs
  Seuil d'alerte : RD > 0,6

Taux de conformité CNPS (TCO) :
  TCO = (Employeurs à jour / Employeurs affiliés) × 100
```

### 9.3 Seuils d'alerte automatique

```yaml
alertes:
  chomage_regional:
    seuil_absolu: 15.0          # Alerte si taux > 15% dans une région
    variation_trimestrielle: 2.0 # Alerte si hausse > 2 pts en 1 trimestre
    
  ratio_offre_demande:
    seuil_bas: 0.25              # Alerte si < 0,25 (1 offre pour 4 demandeurs)
    
  insertion_programme:
    seuil_bas: 40.0              # Alerte si taux insertion 6 mois < 40%
    
  cmu_recouvrement:
    seuil_bas: 70.0              # Alerte si recouvrement CMU < 70%
    
  chomage_jeunes:
    seuil_absolu: 30.0           # Alerte si chômage jeunes > 30% dans une région
```

---

## 10. Processus ETL & Pipeline de Données

### 10.1 Fréquences de mise à jour par source

| Source | Données | Fréquence source | Fréquence ingestion | Méthode |
|---|---|---|---|---|
| INS | Taux chômage global | Trimestrielle | Trimestrielle | Import Excel manuel → API interne |
| INS | RGPH / enquêtes | Annuelle | Annuelle | Import Excel manuel |
| CNPS | Cotisants, conformité | Mensuelle | Mensuelle | SFTP CSV ou API |
| CGRAE | Retraités, pensions | Mensuelle | Mensuelle | SFTP CSV |
| CNAM | Assurés CMU | Mensuelle | Mensuelle | API ou SFTP |
| DGE Registre | Demandeurs emploi | Quotidienne | Quotidienne | API interne (SYGESCO) |
| ONEF Bourse | Offres / candidatures | Quotidienne | Quotidienne | API ou scraping |
| Banque Mondiale | Indicateurs macro | Annuelle | Annuelle | API publique automatique |
| ILO/ILOSTAT | Indicateurs BIT | Annuelle | Annuelle | API publique automatique |

### 10.2 Architecture du pipeline ETL (Laravel)

```php
// Exemple de Job ETL Laravel pour les données Banque Mondiale
// app/Jobs/ImportBanqueMondiale.php

class ImportBanqueMondiale implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    private array $indicateurs = [
        'SL.UEM.TOTL.ZS'    => 'taux_chomage',
        'SL.UEM.1524.ZS'    => 'taux_chomage_jeunes',
        'SL.UEM.TOTL.FE.ZS' => 'taux_chomage_femmes',
        'SL.TLF.TOTL.IN'    => 'population_active',
        'SL.AGR.EMPL.ZS'    => 'emploi_agriculture_pct',
    ];

    public function handle(): void
    {
        foreach ($this->indicateurs as $code => $champ) {
            $url = "https://api.worldbank.org/v2/country/CI/indicator/{$code}?format=json&mrv=10";
            $response = Http::timeout(30)->get($url);

            if (!$response->successful()) {
                Log::warning("Echec import BM : {$code}");
                continue;
            }

            $donnees = $response->json()[1] ?? [];

            foreach ($donnees as $point) {
                if ($point['value'] === null) continue;

                IndicateurMacro::updateOrCreate(
                    ['code' => $code, 'annee' => (int)$point['date']],
                    [
                        'valeur' => $point['value'],
                        'champ'  => $champ,
                        'source' => 'BANQUE_MONDIALE',
                        'importé_le' => now(),
                    ]
                );
            }
        }

        // Invalider le cache Redis des KPIs
        Cache::tags(['kpis', 'banque-mondiale'])->flush();
    }
}

// Planification dans app/Console/Kernel.php
$schedule->job(new ImportBanqueMondiale)->monthlyOn(1, '02:00');
$schedule->job(new ImportCNPS)->monthlyOn(5, '03:00');       // J+5 de chaque mois
$schedule->job(new ImportDGEDemandeurs)->dailyAt('01:00');   // Quotidien
$schedule->job(new RefreshVuesMaterialisees)->dailyAt('04:00');
$schedule->job(new VerifierSeulesAlertes)->dailyAt('06:00');
```

### 10.3 Validation des données

```php
// Règles de validation pour les données importées
$regles = [
    'taux_chomage'        => 'numeric|between:0,100',
    'population_active'   => 'integer|min:0|max:30000000',
    'nb_emplois_formels'  => 'integer|min:0',
    'region_id'           => 'exists:dim_regions,region_id',
    'periode_id'          => 'exists:dim_periodes,periode_id',
    'source'              => 'required|string|max:50',
];

// Règles de cohérence (anomaly detection)
// - Un taux de chômage ne peut pas varier de plus de 5 pts en 1 mois
// - La population active ne peut pas diminuer de plus de 2% par an
// - Le nombre de cotisants CNPS ne peut pas varier de plus de 10% en 1 mois
```

---

## 11. Roadmap de Développement

### Phase 1 — MVP (Mois 1–4)

**Objectif :** Dashboard fonctionnel avec données manuelles et Banque Mondiale

```
Sprint 1 (semaines 1-2) : Fondations
  ├── Setup projet Next.js 14 + Laravel 11
  ├── Schéma PostgreSQL (tables dim_ et fait_)
  ├── Authentification OAuth2 (rôles de base)
  └── Layout dashboard + sidebar navigation

Sprint 2 (semaines 3-4) : Import données initiales
  ├── Job ETL Banque Mondiale (automatique)
  ├── Job ETL ILOSTAT (automatique)
  ├── Interface d'import manuel (Excel/CSV pour INS)
  └── Vue générale avec données réelles BM/ILO

Sprint 3 (semaines 5-6) : Modules principaux
  ├── Module chômage (graphiques + tableau)
  ├── Module secteurs (barres + tableau tension)
  ├── Export CSV et PDF
  └── Filtres par période

Sprint 4 (semaines 7-8) : Carte & alertes
  ├── Carte choroplèthe GeoJSON CI (Leaflet)
  ├── Module régions avec données par district
  ├── Système d'alertes automatiques
  └── Tests E2E + recette DSI
```

### Phase 2 — Intégration partenaires (Mois 4–9)

```
  ├── Convention et intégration API CNPS (cotisants)
  ├── Convention et intégration CNAM (CMU)
  ├── Intégration ONEF (offres emploi)
  ├── Intégration SYGESCO DGE (demandeurs, programmes)
  ├── Module protection sociale complet
  └── API publique Open Data (anonymisée)
```

### Phase 3 — Intelligence & prédiction (Mois 9–14)

```
  ├── Modèle prédictif taux de chômage (Python sklearn/statsmodels)
  ├── Détection automatique tendances sectorielles
  ├── Rapport automatique mensuel (PDF généré automatiquement)
  ├── Tableau de bord mobile-responsive renforcé
  └── Version publique citoyens (données open data)
```

---

## 12. Annexes — Références & Normes

### 12.1 Textes législatifs et réglementaires

| Texte | Objet |
|---|---|
| Décret n°2022-604 du 03 août 2022 | Attributions des membres du gouvernement (MEPS) |
| Loi n°2013-450 du 19 juin 2013 | Protection des données à caractère personnel (CI) |
| Loi n°2015-532 du 20 juillet 2015 | Code du travail ivoirien |
| Décret n°96-286 du 3 avril 1996 | Organisation de la DGE |
| Conventions OIT ratifiées par CI | C122 (politique de l'emploi), C88 (service de l'emploi) |

### 12.2 Nomenclatures à utiliser

| Nomenclature | Usage | Source |
|---|---|---|
| NHES (Nomenclature Harmonisée des Emplois et des Salaires) CI | Classification métiers | CNPS / DGE |
| NAEMA (Nomenclature des Activités Économiques en zone AFRISTAT) | Secteurs d'activité | INS / AFRISTAT |
| ISCED / CITE 2011 | Niveaux d'études | UNESCO (adapté CI) |
| NUTS → Régions CI (à créer) | Codes régions | INS CI |
| Indices INS (IPC, ILA) | Déflateur salaires | INS |

### 12.3 Contacts institutionnels clés

| Institution | Référent données | Méthode de contact |
|---|---|---|
| INS Côte d'Ivoire | Direction des Statistiques Économiques | [www.ins.ci](http://www.ins.ci) |
| CNPS | Direction des Études et Statistiques | [www.cnps.ci](https://www.cnps.ci) |
| CGRAE | Département Informatique | [www.cgrae.ci](https://www.cgrae.ci) |
| CNAM / CMU | Direction des Systèmes d'Information | [www.ipscnam.ci](https://www.ipscnam.ci) |
| ONEF | Direction de l'Observatoire | [www.onef.ci](https://onef.ci) |
| BNETD (Géodonnées) | Centre de Géomatique | [www.bnetd.ci](http://www.bnetd.ci) |
| ARTCI (conformité) | Direction de la Réglementation | [www.artci.ci](https://www.artci.ci) |
| BIT/OIT Bureau CI | Spécialiste Statistiques Travail | [ilo.org/abidjan](https://www.ilo.org/fr/regions-and-countries/africa/cote-d%E2%80%99ivoire) |

### 12.4 Ressources techniques

```
Documentation APIs :
  Banque Mondiale : https://datahelpdesk.worldbank.org/knowledgebase/topics/125589
  ILOSTAT        : https://ilostat.ilo.org/resources/ilostat-api/
  
Données géospatiales CI :
  GADM (gratuit) : https://gadm.org/download_country.html?country=CIV
  OCHA HDX (UN)  : https://data.humdata.org/dataset/cod-ab-civ
  
Bibliothèques cartographiques :
  Leaflet        : https://leafletjs.com
  MapLibre GL    : https://maplibre.org
  react-leaflet  : https://react-leaflet.js.org

Standards statistiques :
  Normes BIT emploi     : https://www.ilo.org/global/statistics-and-databases/standards-and-guidelines
  AFRISTAT données CI   : https://www.afristat.org
  INS publications CI   : http://www.ins.ci/publications

Stack recommandée :
  Next.js 14    : https://nextjs.org/docs
  Laravel 11    : https://laravel.com/docs/11.x
  Chart.js 4    : https://www.chartjs.org/docs
  TanStack Query: https://tanstack.com/query
  TanStack Table: https://tanstack.com/table
```

---

*Document établi par la DSI MEPS en collaboration avec la Direction de l'Observatoire de l'Emploi et des Métiers (DGE)*  
*Ministère de l'Emploi et de la Protection Sociale — Côte d'Ivoire*  
*Version 1.0 — Juin 2026*
