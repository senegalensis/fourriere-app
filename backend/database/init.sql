-- Script d'initialisation de la base de données PostgreSQL
-- Fourrière

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================
-- TABLES
-- ======================

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent', 'greffe', 'fourriere', 'public')),
    email VARCHAR(100),
    telephone VARCHAR(20),
    matricule VARCHAR(50),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table des chauffeurs
CREATE TABLE chauffeurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prenom VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    telephone VARCHAR(20),
    matricule_plateau VARCHAR(30) NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des véhicules
CREATE TABLE vehicules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricule VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(50),
    modele VARCHAR(50),
    couleur VARCHAR(30),
    type_vehicule VARCHAR(30),
    annee INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_matricule CHECK (matricule ~ '^[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}$')
);

-- Table des enlèvements
CREATE TABLE enlevements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent VARCHAR(50) NOT NULL,
    agent_id UUID REFERENCES users(id),
    
    -- Véhicule
    vehicule_matricule VARCHAR(20) NOT NULL,
    vehicule_marque VARCHAR(50),
    vehicule_modele VARCHAR(50),
    vehicule_couleur VARCHAR(30),
    
    -- Détails
    cadre_saisie VARCHAR(100) CHECK (cadre_saisie IN (
        'Opération de désencombrement',
        'Routine'
    )),
    etat_vehicule VARCHAR(20) CHECK (etat_vehicule IN ('Bon', 'Moyen', 'Épave')),
    commentaires TEXT,
    
    -- GPS
    gps_latitude DECIMAL(10, 8) NOT NULL,
    gps_longitude DECIMAL(11, 8) NOT NULL,
    gps_accuracy DECIMAL(10, 2),
    gps_adresse TEXT,
    
    -- Autorité
    autorite_identifiant VARCHAR(100),
    autorite_type VARCHAR(50),
    
    -- Parking
    emplacement VARCHAR(10),
    date_entree_parc TIMESTAMP,
    
    -- Sortie
    sortie_date DATE,
    sortie_heure TIME,
    sortie_proprietaire VARCHAR(100),
    sortie_agent VARCHAR(50),
    sortie_montant_paye DECIMAL(10, 2),
    sortie_mode_paiement VARCHAR(50),
    date_main_levee DATE,
    bon_sortie_sendra VARCHAR(100),
    date_paiement_vae DATE,
    motif_sortie VARCHAR(20) CHECK (motif_sortie IN ('Rendue', 'Casse')),
    
    -- Chauffeur
    chauffeur_id UUID REFERENCES chauffeurs(id),

    -- Détails enlèvement
    date_enlevement DATE,
    heure_enlevement TIME,
    lieu_enlevement TEXT,
    agent_collecte VARCHAR(100),
    responsable VARCHAR(100),

    -- Sync offline
    client_id VARCHAR(36),
    synced_at TIMESTAMP,

    -- Statut
    qr_code TEXT,
    statut VARCHAR(20) DEFAULT 'en_route' CHECK (statut IN ('en_route', 'au_parc', 'sorti')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des photos
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enlevement_id UUID NOT NULL REFERENCES enlevements(id) ON DELETE CASCADE,
    type_photo VARCHAR(20) NOT NULL CHECK (type_photo IN ('avant', 'arriere', 'gauche', 'droite', 'interieur', 'autre')),
    data TEXT NOT NULL, -- Base64
    taille INTEGER,
    format VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des emplacements de parking
CREATE TABLE parking_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(10) UNIQUE NOT NULL,
    zone VARCHAR(10),
    occupied BOOLEAN DEFAULT false,
    vehicle_id UUID REFERENCES enlevements(id) ON DELETE SET NULL,
    reserve_pour VARCHAR(50),
    capacite VARCHAR(20) DEFAULT 'standard' CHECK (capacite IN ('standard', 'moto', 'poids-lourd')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs d'activité
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(50),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Séquence pour l'ordre d'entrée à la fourrière
CREATE SEQUENCE reception_ordre_seq START 1;

-- Table des réceptions à la fourrière
CREATE TABLE receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordre_entree INTEGER DEFAULT nextval('reception_ordre_seq') UNIQUE NOT NULL,
    enlevement_id UUID REFERENCES enlevements(id) ON DELETE SET NULL,
    vehicule_matricule VARCHAR(20) NOT NULL,
    agent_responsable VARCHAR(100) NOT NULL,
    date_entree DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_entree TIME NOT NULL DEFAULT CURRENT_TIME,
    zone_placement VARCHAR(50) CHECK (zone_placement IN ('Sendra', 'Ministere', 'Ville de Dakar')),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des photos de dommages constatés à la réception
CREATE TABLE reception_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reception_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
    data TEXT NOT NULL,
    taille INTEGER,
    format VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (reception_id, position)
);

-- Table de log de synchronisation offline
CREATE TABLE offline_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(36) NOT NULL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'photo')),
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'conflict', 'error')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- ======================
-- INDEX POUR PERFORMANCE
-- ======================

-- Index sur les utilisateurs
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_actif ON users(actif);

-- Index sur les véhicules
CREATE INDEX idx_vehicules_matricule ON vehicules(matricule);

-- Index sur les enlèvements
CREATE INDEX idx_enlevements_timestamp ON enlevements(timestamp DESC);
CREATE INDEX idx_enlevements_agent ON enlevements(agent);
CREATE INDEX idx_enlevements_matricule ON enlevements(vehicule_matricule);
CREATE INDEX idx_enlevements_statut ON enlevements(statut);
CREATE INDEX idx_enlevements_emplacement ON enlevements(emplacement);
CREATE INDEX idx_enlevements_date_entree ON enlevements(date_entree_parc);

-- Index sur les photos
CREATE INDEX idx_photos_enlevement ON photos(enlevement_id);
CREATE INDEX idx_photos_type ON photos(type_photo);

-- Index sur le parking
CREATE INDEX idx_parking_number ON parking_spots(number);
CREATE INDEX idx_parking_occupied ON parking_spots(occupied);
CREATE INDEX idx_parking_vehicle ON parking_spots(vehicle_id);

-- Index sur les logs
CREATE INDEX idx_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_logs_user ON activity_logs(user_name);
CREATE INDEX idx_logs_action ON activity_logs(action);

-- Index JSONB pour les détails des logs
CREATE INDEX idx_logs_details ON activity_logs USING GIN (details);

-- Index sur les chauffeurs
CREATE INDEX idx_chauffeurs_actif ON chauffeurs(actif);
CREATE INDEX idx_chauffeurs_matricule_plateau ON chauffeurs(matricule_plateau);

-- Index sur les enlèvements (nouveaux champs)
CREATE INDEX idx_enlevements_chauffeur ON enlevements(chauffeur_id);
CREATE INDEX idx_enlevements_client_id ON enlevements(client_id);

-- Index sur les réceptions
CREATE INDEX idx_receptions_matricule ON receptions(vehicule_matricule);
CREATE INDEX idx_receptions_enlevement ON receptions(enlevement_id);
CREATE INDEX idx_receptions_date_entree ON receptions(date_entree DESC);
CREATE INDEX idx_receptions_ordre ON receptions(ordre_entree DESC);

-- Index sur les photos de réception
CREATE INDEX idx_reception_photos_reception ON reception_photos(reception_id);

-- Index sur offline_sync_log
CREATE INDEX idx_sync_log_client_id ON offline_sync_log(client_id);
CREATE INDEX idx_sync_log_status ON offline_sync_log(status);
CREATE INDEX idx_sync_log_user ON offline_sync_log(user_id);

-- ======================
-- TRIGGERS
-- ======================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enlevements_updated_at
    BEFORE UPDATE ON enlevements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receptions_updated_at
    BEFORE UPDATE ON receptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- FONCTIONS UTILES
-- ======================

-- Fonction pour obtenir les statistiques du tableau de bord
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_vehicules BIGINT,
    entrees_aujourdhui BIGINT,
    sorties_aujourdhui BIGINT,
    taux_occupation NUMERIC,
    places_disponibles BIGINT
) AS $$
DECLARE
    v_total_places BIGINT;
    v_places_occupees BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total_places FROM parking_spots;
    SELECT COUNT(*) INTO v_places_occupees FROM parking_spots WHERE occupied = true;
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM enlevements WHERE statut != 'sorti'),
        (SELECT COUNT(*) FROM enlevements WHERE DATE(timestamp) = CURRENT_DATE),
        (SELECT COUNT(*) FROM enlevements WHERE sortie_date = CURRENT_DATE),
        CASE WHEN v_total_places > 0 THEN ROUND((v_places_occupees::NUMERIC / v_total_places * 100), 2) ELSE 0 END,
        v_total_places - v_places_occupees;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rechercher un véhicule (recherche publique)
CREATE OR REPLACE FUNCTION search_vehicule_public(search_matricule VARCHAR)
RETURNS TABLE (
    found BOOLEAN,
    matricule VARCHAR,
    marque VARCHAR,
    modele VARCHAR,
    couleur VARCHAR,
    emplacement VARCHAR,
    date_entree TIMESTAMP,
    cadre VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true,
        e.vehicule_matricule,
        e.vehicule_marque,
        e.vehicule_modele,
        e.vehicule_couleur,
        e.emplacement,
        COALESCE(e.date_entree_parc, e.timestamp),
        e.cadre_saisie
    FROM enlevements e
    WHERE UPPER(e.vehicule_matricule) = UPPER(search_matricule)
    AND e.statut != 'sorti'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ======================
-- VUES
-- ======================

-- Vue pour les véhicules en fourrière
CREATE OR REPLACE VIEW vehicules_en_fourriere AS
SELECT 
    e.id,
    e.vehicule_matricule,
    e.vehicule_marque,
    e.vehicule_modele,
    e.vehicule_couleur,
    e.emplacement,
    e.date_entree_parc,
    e.cadre_saisie,
    e.etat_vehicule,
    e.agent,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.date_entree_parc)) as jours_fourriere,
    ps.zone as zone_parking
FROM enlevements e
LEFT JOIN parking_spots ps ON e.emplacement = ps.number
WHERE e.statut = 'au_parc'
ORDER BY e.date_entree_parc DESC;

-- Vue pour les statistiques par agent
CREATE OR REPLACE VIEW stats_par_agent AS
SELECT 
    agent,
    COUNT(*) as total_enlevements,
    COUNT(*) FILTER (WHERE DATE(timestamp) = CURRENT_DATE) as aujourdhui,
    COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as cette_semaine,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)) as ce_mois,
    COUNT(*) FILTER (WHERE statut = 'sorti') as sorties_effectuees
FROM enlevements
GROUP BY agent
ORDER BY total_enlevements DESC;

-- ======================
-- DONNÉES INITIALES
-- ======================

-- Créer l'utilisateur admin (mot de passe: admin123)
-- pgcrypto gen_salt('bf') produit des hashes $2a$ compatibles avec bcryptjs
INSERT INTO users (username, password, role, email, actif) VALUES
('admin', crypt('admin123', gen_salt('bf')), 'admin', 'admin@fourriere.local', true),
('agent1', crypt('test123', gen_salt('bf')), 'agent', 'agent1@fourriere.local', true),
('greffe1', crypt('test123', gen_salt('bf')), 'greffe', 'greffe1@fourriere.local', true),
('receptionnaire1', crypt('test123', gen_salt('bf')), 'fourriere', 'receptionnaire1@fourriere.local', true);

-- Créer quelques chauffeurs de test
INSERT INTO chauffeurs (prenom, nom, telephone, matricule_plateau) VALUES
('Mohamed', 'Benali', '0661234567', 'PLT-001'),
('Ahmed', 'Tazi', '0662345678', 'PLT-002'),
('Youssef', 'Alami', '0663456789', 'PLT-003');

-- Créer les emplacements de parking
DO $$
DECLARE
    i INTEGER;
BEGIN
    -- Zone A: 50 emplacements standard
    FOR i IN 1..50 LOOP
        INSERT INTO parking_spots (number, zone, capacite) 
        VALUES (
            'P' || LPAD(i::TEXT, 3, '0'),
            'A',
            'standard'
        );
    END LOOP;
    
    -- Zone B: 40 emplacements standard
    FOR i IN 51..90 LOOP
        INSERT INTO parking_spots (number, zone, capacite) 
        VALUES (
            'P' || LPAD(i::TEXT, 3, '0'),
            'B',
            'standard'
        );
    END LOOP;
    
    -- Zone B: 10 emplacements poids lourds
    FOR i IN 91..100 LOOP
        INSERT INTO parking_spots (number, zone, capacite) 
        VALUES (
            'P' || LPAD(i::TEXT, 3, '0'),
            'B',
            'poids-lourd'
        );
    END LOOP;
END $$;

-- ======================
-- PERMISSIONS
-- ======================

-- Accorder les permissions à l'utilisateur de l'application
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fourriere_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fourriere_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fourriere_user;

-- ======================
-- COMMENTAIRES
-- ======================

COMMENT ON TABLE chauffeurs IS 'Chauffeurs de plateaux pour les enlèvements';
COMMENT ON TABLE offline_sync_log IS 'Journal de synchronisation des données offline';
COMMENT ON TABLE users IS 'Utilisateurs du système avec authentification';
COMMENT ON TABLE vehicules IS 'Catalogue des véhicules connus';
COMMENT ON TABLE enlevements IS 'Enlèvements de véhicules avec tous les détails';
COMMENT ON TABLE photos IS 'Photos des véhicules enlevés (5 photos obligatoires)';
COMMENT ON TABLE parking_spots IS 'Emplacements de stationnement dans le parc';
COMMENT ON TABLE activity_logs IS 'Journal d''activité pour audit';
COMMENT ON TABLE receptions IS 'Réceptions de véhicules à l''entrée de la fourrière';
COMMENT ON TABLE reception_photos IS 'Photos de dommages constatés à la réception (max 3)';

COMMENT ON FUNCTION get_dashboard_stats() IS 'Retourne les statistiques du tableau de bord';
COMMENT ON FUNCTION search_vehicule_public(VARCHAR) IS 'Recherche publique de véhicule par matricule';

COMMENT ON VIEW vehicules_en_fourriere IS 'Vue des véhicules actuellement en fourrière';
COMMENT ON VIEW stats_par_agent IS 'Statistiques de performance par agent';

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données initialisée avec succès!';
    RAISE NOTICE '📊 Créé: % utilisateurs, % emplacements', 
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM parking_spots);
END $$;
