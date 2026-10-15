# Gestion du Parc Informatique — Front-end

Interface web de l'application de gestion du parc informatique du MEPS. Elle consomme l'API Django REST du backend et propose un tableau de bord par rôle.

## Fonctionnalités

| Rôle | Fonctionnalités |
| --- | --- |
| **Administrateur** | Gestion des comptes (création, modification, réinitialisation du mot de passe, suppression), journal d'audit |
| **Responsable de parc** | Inventaire des équipements, export Excel, affectation / désaffectation, traitement des demandes des agents, demandes d'acquisition, planification et clôture des maintenances, mise hors service |
| **Directeur** | Indicateurs du parc (filtrables par période), validation ou refus des demandes d'acquisition |
| **Agent bénéficiaire** | Espace personnel, demandes d'équipement, signalement de pannes |

Commun à tous : scan des QR codes des équipements (caméra), historique global, thème clair / sombre.

## Stack technique

- [React 19](https://react.dev) + TypeScript
- [Vite 6](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- Recharts (graphiques), lucide-react (icônes), motion (animations)
- jsQR / qrcode.react (lecture et génération de QR codes)

## Prérequis

- Node.js 20 ou plus récent
- Un backend Django accessible (par défaut : `https://api-parc.numerix.digital/api`)

## Installation

```bash
npm install
cp .env.example .env
```

Dans `.env`, renseigner l'URL de l'API :

```env
VITE_API_URL="https://api-parc.numerix.digital/api"
```

## Lancement

```bash
npm run dev       # serveur de développement sur http://localhost:3000
npm run build     # build de production dans dist/
npm run preview   # prévisualisation du build
npm run lint      # vérification TypeScript
```

En développement, les appels sont envoyés à `/api` et le serveur Vite les redirige vers l'origine de `VITE_API_URL` : le backend ne renvoie pas d'en-têtes CORS. En production, l'application appelle directement `VITE_API_URL`.

## Structure

```
src/
├── App.tsx                  # routage selon le rôle connecté
├── components/
│   ├── LoginPage.tsx
│   ├── Header.tsx
│   ├── QRScannerModal.tsx   # scan QR (caméra)
│   └── dashboards/          # un tableau de bord par rôle
├── context/                 # authentification, données, thème
├── services/
│   ├── api.ts               # client de l'API REST (JWT)
│   └── qr.ts
└── types.ts
```

## Comptes de démonstration

Le backend fournit la commande `python manage.py seed_demo`, qui crée un compte fictif par rôle. À ne pas exécuter en production.

## Tests de l'API

La collection Postman `Gestion Parc Informatique - COMPLETE.postman_collection.json` couvre l'ensemble des endpoints du backend.
