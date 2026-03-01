# 🚗 Fourrière - PostgreSQL + Docker

## 🚀 Démarrage Rapide (3 minutes)

### Prérequis
- Docker installé ([Télécharger](https://docs.docker.com/get-docker/))
- Docker Compose installé (inclus avec Docker Desktop)

### Installation en 3 étapes

```bash
# 1. Extraire l'archive
unzip fourriere-postgresql-complete.zip
cd fourriere-postgresql-complete

# 2. Lancer tous les services
docker-compose up -d

# 3. Attendre 30 secondes et ouvrir le navigateur
```

**C'est tout !** 🎉

### Accès

- 🌐 **Application web**: http://localhost:8080
  - Username: `admin`
  - Password: `admin123`

- 🔧 **API Backend**: http://localhost:3000
  - Health check: http://localhost:3000/health

- 🗄️ **PgAdmin** (Interface PostgreSQL): http://localhost:5050
  - Email: `admin@fourriere.local`
  - Password: `admin123`
  
  Pour se connecter à la base:
  - Host: `postgres`
  - Port: `5432`
  - Database: `fourriere`
  - Username: `fourriere_user`
  - Password: `fourriere_password_2024`

### Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Redémarrer
docker-compose restart

# Voir le statut
docker-compose ps
```

### Structure du Projet

```
fourriere-postgresql-complete/
├── docker-compose.yml          # Configuration Docker
├── nginx.conf                  # Configuration serveur web
├── README-POSTGRES-DOCKER.md   # Documentation complète
├── DEMARRAGE-RAPIDE.md        # Ce fichier
├── backend-postgres/
│   ├── server.js              # API Node.js
│   ├── package.json           # Dépendances
│   ├── Dockerfile             # Image Docker
│   ├── .env.example           # Configuration
│   └── database/
│       └── init.sql           # Schema PostgreSQL
└── frontend/
    ├── index.html             # Application web
    ├── api-client.js          # Client API
    └── config.js              # Configuration
```

### Fonctionnalités

✅ **Agent Terrain**
- Scan OCR de plaques
- 5 photos obligatoires
- Géolocalisation GPS
- QR Code généré

✅ **Greffe**
- Scan QR à l'arrivée
- Affectation emplacement
- Bons de sortie

✅ **Public**
- Recherche par plaque
- Sans authentification

✅ **Admin**
- Tableau de bord
- Statistiques
- Extraction preuves

### Base de Données

PostgreSQL avec:
- 6 tables relationnelles
- 15+ index optimisés
- Fonctions SQL personnalisées
- Vues matérialisées
- 100 emplacements parking
- 3 utilisateurs initiaux

### En cas de problème

**Port déjà utilisé:**
```bash
# Changer les ports dans docker-compose.yml
# Par exemple: "8081:80" au lieu de "8080:80"
```

**Cannot connect to Docker:**
```bash
# Démarrer Docker Desktop (Windows/Mac)
# ou
sudo systemctl start docker  # Linux
```

**Base de données non initialisée:**
```bash
# Recréer les conteneurs
docker-compose down -v
docker-compose up -d
```

### Documentation Complète

Pour plus de détails, consultez `README-POSTGRES-DOCKER.md`

### Support

- 📧 Email: support@fourriere.local
- 📖 Documentation: Voir README-POSTGRES-DOCKER.md
- 🐛 Issues: Créer une issue sur GitHub

---

**Version:** 1.0.0 PostgreSQL
**Licence:** MIT
