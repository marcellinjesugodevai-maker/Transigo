# TransiGo

Application VTC révolutionnaire pour la Côte d'Ivoire.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Cloner et installer les dépendances
cd "TransiGo V01"
npm install

# Lancer l'app Passager
cd apps/passenger
npm install
npm run dev

# Lancer l'app Chauffeur (autre terminal)
cd apps/driver
npm install
npm run dev

# Lancer l'Admin Dashboard (autre terminal)
cd apps/admin
npm install
npm run dev
```

## 📱 Applications

| App | Port | Description |
|-----|------|-------------|
| **Passenger** | Expo Go | App passager mobile |
| **Driver** | Expo Go | App chauffeur mobile |
| **Admin** | localhost:3001 | Dashboard web admin |

## 🎨 Charte Graphique

- **Orange** `#FF6B00` - Couleur principale
- **Vert** `#00C853` - Couleur secondaire  
- **Blanc** `#FFFFFF` - Fond
- **Noir** `#1A1A2E` - Texte

## ✨ Fonctionnalités Principales

### Passager
- 🗺️ Carte avec OpenStreetMap
- 💰 Négociation de prix
- 👩 Mode Femme (sécurité)
- 🏍️ Moto, Colis, Food
- 🤝 Trajets partagés
- 📦 Abonnements
- 🎰 Loterie quotidienne
- 🎓 Réduction étudiants

### Chauffeur
- 📊 Commission 12%
- 💸 Retrait instantané
- 🏆 Système de niveaux
- 📈 Dashboard gains

### Admin
- 📊 Statistiques temps réel
- 👥 Gestion utilisateurs
- 🚗 Gestion chauffeurs
- 💰 Suivi des paiements

## 📂 Structure

```
TransiGo V01/
├── apps/
│   ├── passenger/     # App Passager (Expo 51)
│   ├── driver/        # App Chauffeur (Expo 51)
│   └── admin/         # Dashboard Admin (Next.js 14)
├── packages/
│   └── shared/        # Types, constants, utils
└── package.json       # Monorepo config
```

## 🔧 Technologies

- **Mobile**: React Native, Expo 51
- **Web**: Next.js 14, Tailwind CSS
- **State**: Zustand
- **Maps**: OpenStreetMap, react-native-maps
- **Backend**: À ajouter (NestJS prévu)

---

**TransiGo** - L'application VTC qui écrase la concurrence 🚀
