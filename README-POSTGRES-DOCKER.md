# 🐘 Fourrière - Backend PostgreSQL + Docker

Version complète avec PostgreSQL sur Docker pour la gestion de fourrière.

## 🏗️ Architecture Docker

```
┌─────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │  │
│  │    Nginx     │  │   Node.js    │  │   Database   │  │
│  │   Port 8080  │  │   Port 3000  │  │   Port 5432  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └────────┬────────┴──────────────────┘           │
│                  │                                        │
│            fourriere-network                             │
│                                                           │
│  ┌──────────────┐                                        │
│  │   PgAdmin    │  Interface web PostgreSQL              │
│  │   Port 5050  │                                        │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

## 📦 Contenu

### Services Docker

1. **PostgreSQL** - Base de données relationnelle
   - Port: 5432
   - User: fourriere_user
   - DB: fourriere
   - Volume persistant

2. **PgAdmin** - Interface web PostgreSQL
   - Port: 5050
   - Login: admin@fourriere.local / admin123

3. **Backend** - API Node.js
   - Port: 3000
   - Auto-reload en développement

4. **Frontend** - Application web (Nginx)
   - Port: 8080
   - Fichiers statiques optimisés

## 🚀 Installation et Démarrage

### Prérequis

- Docker (v20+)
- Docker Compose (v2+)

Installation Docker:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS (Homebrew)
brew install --cask docker

# Windows
# Télécharger Docker Desktop depuis https://www.docker.com/products/docker-desktop
```

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/fourriere.git
cd fourriere-```

### 2. Configuration (optionnel)

```bash
# Éditer docker-compose.yml si besoin
nano docker-compose.yml

# Ou créer un fichier .env
cp backend-postgres/.env.example backend-postgres/.env
nano backend-postgres/.env
```

### 3. Lancer tous les services

```bash
# Démarrer tous les conteneurs
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

**C'est tout!** 🎉

Les services sont disponibles sur:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **PgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432

### 4. Connexion

**Application Web** (http://localhost:8080)
```
Username: admin
Password: admin123
```

**PgAdmin** (http://localhost:5050)
```
Email: admin@fourriere.local
Password: admin123
```

Pour connecter PgAdmin à PostgreSQL:
```
Host: postgres
Port: 5432
Database: fourriere
Username: fourriere_user
Password: fourriere_password_2024
```

## 🛠️ Commandes Utiles

### Gestion des conteneurs

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer un service
docker-compose restart backend

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Voir tous les conteneurs
docker-compose ps

# Entrer dans un conteneur
docker-compose exec backend sh
docker-compose exec postgres psql -U fourriere_user -d fourriere
```

### Base de données

```bash
# Se connecter à PostgreSQL
docker-compose exec postgres psql -U fourriere_user -d fourriere

# Dans psql:
\dt              # Lister les tables
\d users         # Décrire une table
\l               # Lister les bases
\q               # Quitter

# Backup de la base
docker-compose exec postgres pg_dump -U fourriere_user fourriere > backup.sql

# Restaurer
docker-compose exec -T postgres psql -U fourriere_user fourriere < backup.sql
```

### Backend

```bash
# Voir les logs backend
docker-compose logs -f backend

# Redémarrer le backend
docker-compose restart backend

# Reconstruire l'image
docker-compose build backend
docker-compose up -d backend
```

## 📊 Structure de la Base de Données

### Tables PostgreSQL

```sql
users           -- Utilisateurs (admin, agent, greffe)
enlevements     -- Enlèvements de véhicules
photos          -- Photos des véhicules (5 obligatoires)
parking_spots   -- 100 emplacements de parking
activity_logs   -- Journal d'audit complet
vehicules       -- Catalogue véhicules (optionnel)
```

### Fonctions SQL

```sql
get_dashboard_stats()           -- Statistiques temps réel
search_vehicule_public(text)    -- Recherche publique
update_updated_at_column()      -- Trigger auto-update
```

### Vues

```sql
vehicules_en_fourriere   -- Véhicules actuellement en fourrière
stats_par_agent          -- Performance des agents
```

## 🔧 Configuration Avancée

### Personnaliser les ports

Éditer `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "80:80"    # Au lieu de 8080:80
  
  backend:
    ports:
      - "4000:3000"  # Au lieu de 3000:3000
```

### Variables d'environnement

Créer un fichier `.env` à la racine:

```env
# Ports
FRONTEND_PORT=8080
BACKEND_PORT=3000
POSTGRES_PORT=5432
PGADMIN_PORT=5050

# Database
POSTGRES_PASSWORD=mon-super-mot-de-passe
JWT_SECRET=mon-secret-jwt-tres-long
```

Puis dans `docker-compose.yml`:

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### Volumes persistants

Les données sont stockées dans des volumes Docker:

```bash
# Lister les volumes
docker volume ls

# Voir les détails
docker volume inspect fourriere_postgres_data

# Backup du volume
docker run --rm -v fourriere_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-backup.tar.gz /data

# Restaurer
docker run --rm -v fourriere_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres-backup.tar.gz -C /
```

## 🚀 Déploiement en Production

### 1. Préparation

```bash
# Changer les mots de passe
nano docker-compose.yml

# Mettre en production
export NODE_ENV=production
```

### 2. SSL/HTTPS avec Nginx

Ajouter un service nginx reverse proxy:

```yaml
services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### 3. Monitoring

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

## 🧪 Tests

### Test de santé

```bash
# Backend
curl http://localhost:3000/health

# PostgreSQL
docker-compose exec postgres pg_isready -U fourriere_user

# Frontend
curl http://localhost:8080
```

### Test API

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Récupérer un token et l'utiliser
TOKEN="votre-token-ici"
curl http://localhost:3000/api/enlevements \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Sécurité

### Checklist Production

- [ ] Changer tous les mots de passe par défaut
- [ ] Utiliser des secrets Docker pour les mots de passe
- [ ] Activer SSL/TLS (HTTPS)
- [ ] Configurer un firewall
- [ ] Limiter les ports exposés
- [ ] Backups automatiques configurés
- [ ] Logs centralisés
- [ ] Monitoring actif

### Mots de passe à changer

1. PostgreSQL: `POSTGRES_PASSWORD`
2. PgAdmin: `PGADMIN_DEFAULT_PASSWORD`
3. JWT: `JWT_SECRET`
4. Utilisateur admin de l'app

### Docker Secrets (recommandé)

```bash
# Créer un secret
echo "mon-super-secret" | docker secret create jwt_secret -

# Dans docker-compose.yml
secrets:
  jwt_secret:
    external: true

services:
  backend:
    secrets:
      - jwt_secret
```

## 📈 Performance

### Optimisations PostgreSQL

Éditer `docker-compose.yml`:

```yaml
services:
  postgres:
    command: 
      - "postgres"
      - "-c"
      - "max_connections=100"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "effective_cache_size=1GB"
```

### Cache Nginx

Déjà configuré dans `nginx.conf`:
- Compression gzip activée
- Cache des fichiers statiques (1 an)
- Headers optimisés

## 🐛 Dépannage

### Le conteneur ne démarre pas

```bash
# Voir les logs
docker-compose logs backend

# Vérifier la configuration
docker-compose config

# Reconstruire
docker-compose build --no-cache
docker-compose up -d
```

### Base de données inaccessible

```bash
# Vérifier que PostgreSQL est prêt
docker-compose exec postgres pg_isready

# Se connecter manuellement
docker-compose exec postgres psql -U fourriere_user -d fourriere

# Vérifier les connexions
docker-compose exec postgres psql -U fourriere_user -c "SELECT * FROM pg_stat_activity;"
```

### Permission denied sur les volumes

```bash
# Linux: donner les permissions
sudo chown -R $USER:$USER .

# Ou recréer les volumes
docker-compose down -v
docker-compose up -d
```

## 📝 Maintenance

### Nettoyage

```bash
# Arrêter et supprimer tout (ATTENTION: perte de données)
docker-compose down -v

# Nettoyer les images inutilisées
docker system prune -a

# Voir l'espace utilisé
docker system df
```

### Mise à jour

```bash
# Mettre à jour les images
docker-compose pull

# Reconstruire
docker-compose build

# Redémarrer
docker-compose up -d
```

## 📞 Support

### Problèmes courants

**"Port already in use"**
```bash
# Changer le port dans docker-compose.yml
# Ou arrêter le service qui utilise le port
lsof -ti:3000 | xargs kill
```

**"Cannot connect to Docker daemon"**
```bash
# Démarrer Docker
sudo systemctl start docker

# macOS/Windows: Démarrer Docker Desktop
```

**"Database connection failed"**
- Vérifier que PostgreSQL est démarré: `docker-compose ps`
- Vérifier les logs: `docker-compose logs postgres`
- Vérifier les credentials dans `.env`

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Node.js avec PostgreSQL](https://node-postgres.com/)
- [Nginx](https://nginx.org/en/docs/)

## 🎉 Avantages de cette Configuration

✅ **Tout-en-un** - Un seul `docker-compose up`
✅ **Isolation** - Chaque service dans son conteneur
✅ **Portable** - Fonctionne partout (dev, prod, CI/CD)
✅ **Scalable** - Facile à répliquer et scaler
✅ **Persistant** - Données conservées dans volumes
✅ **Monitoring** - PgAdmin inclus
✅ **Performance** - PostgreSQL optimisé

---

**Version:** 1.0.0
**Date:** Février 2024
**Licence:** MIT
