# 🎓 EdukMaster

Application mobile éducative pour les élèves de la 3ème à la Terminale en Afrique de l'Ouest.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Android-green)
![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)

---

## 📱 Description

EdukMaster est une application mobile complète qui permet aux élèves de :

- 📚 **Apprendre** avec des cours détaillés (160 chapitres)
- ✍️ **S'entraîner** avec des exercices interactifs (1600 exercices)
- ⏱️ **Se tester** en conditions réelles (examens blancs chronométrés)
- 🤖 **Poser des questions** à l'assistant IA
- ⚔️ **Défier** des camarades dans l'Arène
- 🏆 **Gagner des badges** et suivre sa progression

---

## 🚀 Fonctionnalités

### 📚 Cours et Exercices
- 5 matières : Mathématiques, Français, Histoire-Géographie, SVT, Anglais
- 4 niveaux : 3ème, 2nde, 1ère, Terminale
- 160 chapitres avec cours structurés
- 1600 exercices (QCM, Vrai/Faux, Réponse libre)

### ⏱️ Examens et Entraînements
- Mode Entraînement avec 3 niveaux de difficulté
- Mode Examen Blanc avec chronomètre
- Rapport détaillé après chaque session
- Score enregistré et progression suivie

### 🤖 Assistant IA Premium
- Interface chat intuitive
- Génération d'épreuves complètes type BAC
- Méthodologie (dissertation, commentaire, philo)
- Historique des conversations sauvegardé
- Formatage propre des réponses

### ⚔️ Arène Multijoueur
- Défis en temps réel entre élèves
- Code d'invitation à 6 chiffres
- Classement avec rangs (Bronze → Légende)
- Partage du code via WhatsApp/SMS

### 🏆 Badges et Récompenses
- 13 badges à débloquer
- Streaks (séries de jours)
- Progression par matière
- Tableau de bord premium

### 👤 Profil
- Statistiques personnelles
- Changement de classe
- Modification du mot de passe
- Rang dans le classement

---

## 🛠️ Technologies

| Catégorie | Technologie |
|-----------|-------------|
| **Frontend** | React Native (Expo SDK 54) |
| **Backend** | Supabase (PostgreSQL) |
| **Authentification** | Supabase Auth (email + OTP) |
| **Base de données** | PostgreSQL (Row Level Security) |
| **IA** | OpenRouter (GPT/Mistral/Gemini) |
| **Notifications** | Expo Notifications |
| **Déploiement** | EAS Build |
| **Versionnement** | Git / GitHub |

---

## 📦 Installation

### Prérequis

- Node.js 18+
- Expo CLI
- Compte Supabase
- Compte OpenRouter (pour l'IA)

### Étapes

```bash
# Cloner le projet
git clone https://github.com/josuekelly-droid/EdukMaster.git
cd EdukMaster

# Installer les dépendances
npm install

# Configurer Supabase
# Créer un fichier src/services/supabase.js avec vos clés

# Configurer OpenRouter
# Dans Supabase, insérer la clé API dans app_config

# Lancer en développement
npx expo start

# Exécuter les scripts SQL dans l'ordre :
1. 01_matieres.sql
2. 02_cours_exercices.sql (par matière et niveau)
3. 03_defis_classement.sql
4. 04_badges_streaks.sql
5. 05_ai_conversations.sql


# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le build
eas build:configure

# Générer l'APK
eas build -p android --profile preview

🤝 Contribution
Les contributions sont les bienvenues ! Pour contribuer :

Fork le projet

Créer une branche (git checkout -b feature/nouvelle-fonctionnalite)

Commit (git commit -m 'Ajout fonctionnalité')

Push (git push origin feature/nouvelle-fonctionnalite)

Ouvrir une Pull Request


👨‍💻 Auteur:
Kelly AKPLOGAN

GitHub : @josuekelly-droid

Email : kelly.webnux@gmail.com