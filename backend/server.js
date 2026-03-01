const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-key-super-securise';

// Configuration PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'fourriere',
    user: process.env.DB_USER || 'fourriere_user',
    password: process.env.DB_PASSWORD || 'fourriere_password_2024',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur connexion PostgreSQL:', err.stack);
    } else {
        console.log('✅ PostgreSQL connecté');
        release();
    }
});

// Middleware d'authentification
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentification requise' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const result = await pool.query(
            'SELECT id, username, role, email, actif FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (result.rows.length === 0 || !result.rows[0].actif) {
            return res.status(401).json({ error: 'Utilisateur invalide' });
        }
        
        req.user = result.rows[0];
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
};

// Middleware de logging
const logActivity = async (req, res, next) => {
    if (req.user) {
        try {
            await pool.query(
                `INSERT INTO activity_logs 
                (user_name, user_id, role, action, details, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    req.user.username,
                    req.user.id,
                    req.user.role,
                    `${req.method} ${req.path}`,
                    JSON.stringify({ body: req.body, query: req.query, params: req.params }),
                    req.ip,
                    req.get('User-Agent')
                ]
            );
        } catch (error) {
            console.error('Erreur log activité:', error);
        }
    }
    next();
};

// Routes API

// ========== AUTHENTIFICATION ==========

// Inscription (admin uniquement)
app.post('/api/auth/register', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        
        const { username, password, role, email, telephone, matricule } = req.body;
        
        // Vérifier si l'utilisateur existe
        const existing = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Utilisateur existe déjà' });
        }
        
        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (username, password, role, email, telephone, matricule)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, username, role`,
            [username, hashedPassword, role, email || null, telephone || null, matricule || null]
        );
        
        res.status(201).json({
            message: 'Utilisateur créé',
            user: result.rows[0]
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        
        const user = result.rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }
        
        if (!user.actif) {
            return res.status(401).json({ error: 'Compte désactivé' });
        }
        
        // Mettre à jour last_login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vérification du token
app.get('/api/auth/verify', authenticate, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

// ========== CHAUFFEURS ==========

// Créer un chauffeur (tous les utilisateurs authentifiés)
app.post('/api/chauffeurs', authenticate, logActivity, async (req, res) => {
    try {
        const { prenom, nom, telephone, matricule_plateau } = req.body;

        const result = await pool.query(
            `INSERT INTO chauffeurs (prenom, nom, telephone, matricule_plateau)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [prenom, nom, telephone, matricule_plateau]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Lister les chauffeurs actifs
app.get('/api/chauffeurs', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM chauffeurs WHERE actif = true ORDER BY nom, prenom'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Modifier un chauffeur (admin uniquement)
app.put('/api/chauffeurs/:id', authenticate, logActivity, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const fields = [];
        const values = [];
        let paramCount = 0;

        const allowedFields = ['prenom', 'nom', 'telephone', 'matricule_plateau', 'actif'];

        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                values.push(req.body[key]);
                fields.push(`${key} = $${++paramCount}`);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        values.push(req.params.id);
        const query = `UPDATE chauffeurs SET ${fields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chauffeur non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ========== SYNC OFFLINE ==========

// Réception batch d'enregistrements offline
app.post('/api/sync/push', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { records } = req.body;
        const results = [];

        for (const record of records) {
            // Dédoublonnage par client_id
            if (record.client_id) {
                const existing = await client.query(
                    'SELECT id FROM enlevements WHERE client_id = $1',
                    [record.client_id]
                );
                if (existing.rows.length > 0) {
                    results.push({ client_id: record.client_id, status: 'duplicate', id: existing.rows[0].id });
                    continue;
                }
            }

            const result = await client.query(
                `INSERT INTO enlevements (
                    agent, agent_id,
                    vehicule_matricule, vehicule_marque, vehicule_modele, vehicule_couleur,
                    cadre_saisie, etat_vehicule, commentaires,
                    gps_latitude, gps_longitude, gps_accuracy, gps_adresse,
                    autorite_identifiant, autorite_type,
                    chauffeur_id, date_enlevement, heure_enlevement, lieu_enlevement,
                    agent_collecte, responsable, client_id, synced_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP)
                RETURNING id`,
                [
                    req.user.username,
                    req.user.id,
                    record.vehicule?.matricule,
                    record.vehicule?.marque,
                    record.vehicule?.modele,
                    record.vehicule?.couleur,
                    record.details?.cadre,
                    record.details?.etat,
                    record.details?.commentaires,
                    record.gps?.latitude || 0,
                    record.gps?.longitude || 0,
                    record.gps?.accuracy,
                    record.gps?.adresse,
                    record.autorite?.identifiant,
                    record.autorite?.type,
                    record.chauffeur_id || null,
                    record.date_enlevement || null,
                    record.heure_enlevement || null,
                    record.lieu_enlevement || null,
                    record.agent_collecte || null,
                    record.responsable || null,
                    record.client_id
                ]
            );

            // Log sync
            await client.query(
                `INSERT INTO offline_sync_log (client_id, user_id, action, entity_type, entity_id, status, synced_at)
                 VALUES ($1, $2, 'create', 'enlevement', $3, 'synced', CURRENT_TIMESTAMP)`,
                [record.client_id, req.user.id, result.rows[0].id]
            );

            results.push({ client_id: record.client_id, status: 'synced', id: result.rows[0].id });
        }

        await client.query('COMMIT');

        res.json({ results });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ========== ENLÈVEMENTS ==========

// Créer un enlèvement
app.post('/api/enlevements', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            vehicule,
            details,
            gps,
            autorite,
            chauffeur_id,
            date_enlevement,
            heure_enlevement,
            lieu_enlevement,
            agent_collecte,
            responsable,
            client_id
        } = req.body;

        const result = await client.query(
            `INSERT INTO enlevements (
                agent, agent_id,
                vehicule_matricule, vehicule_marque, vehicule_modele, vehicule_couleur,
                cadre_saisie, etat_vehicule, commentaires,
                gps_latitude, gps_longitude, gps_accuracy, gps_adresse,
                autorite_identifiant, autorite_type,
                chauffeur_id, date_enlevement, heure_enlevement, lieu_enlevement,
                agent_collecte, responsable, client_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *`,
            [
                req.user.username,
                req.user.id,
                vehicule.matricule,
                vehicule.marque,
                vehicule.modele,
                vehicule.couleur,
                details.cadre,
                details.etat,
                details.commentaires,
                gps.latitude,
                gps.longitude,
                gps.accuracy,
                gps?.adresse || null,
                autorite?.identifiant,
                autorite?.type,
                chauffeur_id || null,
                date_enlevement || null,
                heure_enlevement || null,
                lieu_enlevement || null,
                agent_collecte || null,
                responsable || null,
                client_id || null
            ]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Récupérer tous les enlèvements
app.get('/api/enlevements', authenticate, async (req, res) => {
    try {
        const { statut, agent, matricule, dateDebut, dateFin, limit = 100, skip = 0 } = req.query;
        
        let query = 'SELECT * FROM enlevements WHERE 1=1';
        const params = [];
        let paramCount = 0;
        
        if (statut) {
            params.push(statut);
            query += ` AND statut = $${++paramCount}`;
        }
        
        if (agent) {
            params.push(agent);
            query += ` AND agent = $${++paramCount}`;
        }
        
        if (matricule) {
            params.push(`%${matricule}%`);
            query += ` AND vehicule_matricule ILIKE $${++paramCount}`;
        }
        
        if (dateDebut) {
            params.push(dateDebut);
            query += ` AND timestamp >= $${++paramCount}`;
        }
        
        if (dateFin) {
            params.push(dateFin);
            query += ` AND timestamp <= $${++paramCount}`;
        }
        
        // Filtrer par agent si rôle agent
        if (req.user.role === 'agent') {
            params.push(req.user.username);
            query += ` AND agent = $${++paramCount}`;
        }
        
        query += ` ORDER BY timestamp DESC`;
        
        params.push(limit);
        query += ` LIMIT $${++paramCount}`;
        
        params.push(skip);
        query += ` OFFSET $${++paramCount}`;
        
        const result = await pool.query(query, params);
        
        // Compter le total
        let countQuery = 'SELECT COUNT(*) FROM enlevements WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (statut) {
            countParams.push(statut);
            countQuery += ` AND statut = $${++countParamCount}`;
        }
        if (agent) {
            countParams.push(agent);
            countQuery += ` AND agent = $${++countParamCount}`;
        }
        if (matricule) {
            countParams.push(`%${matricule}%`);
            countQuery += ` AND vehicule_matricule ILIKE $${++countParamCount}`;
        }
        if (dateDebut) {
            countParams.push(dateDebut);
            countQuery += ` AND timestamp >= $${++countParamCount}`;
        }
        if (dateFin) {
            countParams.push(dateFin);
            countQuery += ` AND timestamp <= $${++countParamCount}`;
        }
        if (req.user.role === 'agent') {
            countParams.push(req.user.username);
            countQuery += ` AND agent = $${++countParamCount}`;
        }

        const countResult = await pool.query(countQuery, countParams);
        
        res.json({
            enlevements: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rechercher un enlèvement par matricule (pour la réception fourrière)
app.get('/api/enlevements/search/:matricule', authenticate, async (req, res) => {
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const matricule = req.params.matricule.trim().toUpperCase();

        const result = await pool.query(
            `SELECT e.*,
                    c.prenom as chauffeur_prenom, c.nom as chauffeur_nom, c.matricule_plateau
             FROM enlevements e
             LEFT JOIN chauffeurs c ON e.chauffeur_id = c.id
             WHERE UPPER(e.vehicule_matricule) = $1
               AND e.statut = 'en_route'
             ORDER BY e.timestamp DESC
             LIMIT 1`,
            [matricule]
        );

        if (result.rows.length === 0) {
            const anyResult = await pool.query(
                `SELECT statut FROM enlevements
                 WHERE UPPER(vehicule_matricule) = $1
                 ORDER BY timestamp DESC LIMIT 1`,
                [matricule]
            );
            if (anyResult.rows.length > 0) {
                const statut = anyResult.rows[0].statut;
                const msg = statut === 'au_parc'
                    ? 'Ce véhicule est déjà enregistré en fourrière'
                    : 'Ce véhicule est déjà sorti de la fourrière';
                return res.json({ found: false, statut, message: msg });
            }
            return res.json({ found: false, message: 'Aucun enlèvement en cours trouvé pour ce matricule' });
        }

        res.json({ found: true, enlevement: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Récupérer un enlèvement par ID
app.get('/api/enlevements/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM enlevements WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enlèvement non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un enlèvement
app.put('/api/enlevements/:id', authenticate, logActivity, async (req, res) => {
    try {
        const fields = [];
        const values = [];
        let paramCount = 0;

        const ALLOWED_FIELDS = [
            'vehicule_matricule', 'vehicule_marque', 'vehicule_modele', 'vehicule_couleur',
            'cadre_saisie', 'etat_vehicule', 'commentaires',
            'gps_latitude', 'gps_longitude', 'gps_accuracy', 'gps_adresse',
            'autorite_identifiant', 'autorite_type',
            'chauffeur_id', 'date_enlevement', 'heure_enlevement',
            'lieu_enlevement', 'agent_collecte', 'responsable',
            'statut', 'emplacement', 'date_entree_parc'
        ];

        // Construire dynamiquement la requête UPDATE avec whitelist
        ALLOWED_FIELDS.forEach(key => {
            if (req.body[key] !== undefined) {
                values.push(req.body[key]);
                fields.push(`${key} = $${++paramCount}`);
            }
        });
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }
        
        values.push(req.params.id);
        const query = `UPDATE enlevements SET ${fields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enlèvement non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Recherche publique par matricule
app.get('/api/public/search/:matricule', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                vehicule_matricule, vehicule_marque, vehicule_modele, vehicule_couleur,
                emplacement, 
                COALESCE(date_entree_parc, timestamp) as date_entree,
                cadre_saisie
             FROM enlevements
             WHERE UPPER(vehicule_matricule) = UPPER($1)
             AND statut != 'sorti'
             LIMIT 1`,
            [req.params.matricule]
        );
        
        if (result.rows.length === 0) {
            return res.json({ found: false });
        }
        
        const data = result.rows[0];
        res.json({
            found: true,
            vehicule: {
                matricule: data.vehicule_matricule,
                marque: data.vehicule_marque,
                modele: data.vehicule_modele,
                couleur: data.vehicule_couleur
            },
            emplacement: data.emplacement,
            dateEntree: data.date_entree,
            cadre: data.cadre_saisie
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RÉCEPTIONS FOURRIÈRE ==========

// Créer une réception
app.post('/api/receptions', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        await client.query('BEGIN');

        const {
            enlevement_id,
            vehicule_matricule,
            agent_responsable,
            date_entree,
            heure_entree,
            zone_placement,
            observations
        } = req.body;

        const result = await client.query(
            `INSERT INTO receptions
                (enlevement_id, vehicule_matricule, agent_responsable, date_entree, heure_entree, zone_placement, observations)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                enlevement_id || null,
                vehicule_matricule,
                agent_responsable,
                date_entree,
                heure_entree,
                zone_placement || null,
                observations || null
            ]
        );

        // Passer l'enlèvement au statut 'au_parc'
        if (enlevement_id) {
            await client.query(
                `UPDATE enlevements
                 SET statut = 'au_parc', date_entree_parc = CURRENT_TIMESTAMP, emplacement = $1
                 WHERE id = $2`,
                [zone_placement || null, enlevement_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Lister les réceptions
app.get('/api/receptions', authenticate, async (req, res) => {
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { matricule, dateDebut, dateFin, limit = 50, skip = 0 } = req.query;

        let query = `SELECT r.*,
                            e.vehicule_marque, e.vehicule_modele, e.vehicule_couleur,
                            e.cadre_saisie, e.agent as agent_enlevement
                     FROM receptions r
                     LEFT JOIN enlevements e ON r.enlevement_id = e.id
                     WHERE 1=1`;
        const params = [];
        let paramCount = 0;

        if (matricule) {
            params.push(`%${matricule}%`);
            query += ` AND r.vehicule_matricule ILIKE $${++paramCount}`;
        }
        if (dateDebut) {
            params.push(dateDebut);
            query += ` AND r.date_entree >= $${++paramCount}`;
        }
        if (dateFin) {
            params.push(dateFin);
            query += ` AND r.date_entree <= $${++paramCount}`;
        }

        query += ` ORDER BY r.ordre_entree DESC`;
        params.push(limit);
        query += ` LIMIT $${++paramCount}`;
        params.push(skip);
        query += ` OFFSET $${++paramCount}`;

        const result = await pool.query(query, params);

        // Count with same filters (exclude LIMIT/OFFSET params)
        const countParams = params.slice(0, params.length - 2);
        let countQuery = `SELECT COUNT(*) FROM receptions r WHERE 1=1`;
        let countParamCount = 0;
        if (matricule) countQuery += ` AND r.vehicule_matricule ILIKE $${++countParamCount}`;
        if (dateDebut) countQuery += ` AND r.date_entree >= $${++countParamCount}`;
        if (dateFin)   countQuery += ` AND r.date_entree <= $${++countParamCount}`;

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            receptions: result.rows,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Récupérer une réception par ID (avec ses photos)
app.get('/api/receptions/:id', authenticate, async (req, res) => {
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const [receptionResult, photosResult] = await Promise.all([
            pool.query(
                `SELECT r.*,
                        e.vehicule_marque, e.vehicule_modele, e.vehicule_couleur,
                        e.cadre_saisie, e.etat_vehicule, e.agent as agent_enlevement,
                        e.date_enlevement, e.heure_enlevement, e.lieu_enlevement,
                        e.commentaires, e.gps_adresse, e.autorite_identifiant, e.autorite_type
                 FROM receptions r
                 LEFT JOIN enlevements e ON r.enlevement_id = e.id
                 WHERE r.id = $1`,
                [req.params.id]
            ),
            pool.query(
                'SELECT * FROM reception_photos WHERE reception_id = $1 ORDER BY position',
                [req.params.id]
            )
        ]);

        if (receptionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Réception non trouvée' });
        }

        res.json({ ...receptionResult.rows[0], photos: photosResult.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ajouter des photos de dommages à une réception (max 3)
app.post('/api/receptions/:id/photos', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        await client.query('BEGIN');

        const { photos } = req.body; // [{ position: 1|2|3, data: base64 }]
        const insertedPhotos = [];

        for (const photo of photos) {
            if (photo.position < 1 || photo.position > 3) continue;
            const result = await client.query(
                `INSERT INTO reception_photos (reception_id, position, data, taille, format)
                 VALUES ($1, $2, $3, $4, 'base64')
                 ON CONFLICT (reception_id, position) DO NOTHING
                 RETURNING *`,
                [req.params.id, photo.position, photo.data, photo.data.length]
            );
            if (result.rows.length > 0) insertedPhotos.push(result.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json(insertedPhotos);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ========== PHOTOS ==========

// Ajouter des photos
app.post('/api/photos', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { enlevementId, photos } = req.body;
        
        const insertedPhotos = [];
        
        for (const photo of photos) {
            const result = await client.query(
                `INSERT INTO photos (enlevement_id, type_photo, data, taille, format)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [enlevementId, photo.type, photo.data, photo.data.length, 'base64']
            );
            insertedPhotos.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        
        res.status(201).json(insertedPhotos);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Récupérer les photos d'un enlèvement
app.get('/api/photos/:enlevementId', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM photos WHERE enlevement_id = $1 ORDER BY timestamp',
            [req.params.enlevementId]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PARKING ==========

// Récupérer tous les emplacements
app.get('/api/parking', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ps.*, 
                    e.vehicule_matricule, e.vehicule_marque, e.vehicule_modele
             FROM parking_spots ps
             LEFT JOIN enlevements e ON ps.vehicle_id = e.id
             ORDER BY ps.number`
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Affecter un emplacement
app.post('/api/parking/assign', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { spotId, enlevementId } = req.body;
        
        // Vérifier que l'emplacement existe et est libre
        const spotResult = await client.query(
            'SELECT * FROM parking_spots WHERE id = $1',
            [spotId]
        );
        
        if (spotResult.rows.length === 0) {
            throw new Error('Emplacement non trouvé');
        }
        
        if (spotResult.rows[0].occupied) {
            throw new Error('Emplacement déjà occupé');
        }
        
        // Marquer l'emplacement comme occupé
        await client.query(
            'UPDATE parking_spots SET occupied = true, vehicle_id = $1 WHERE id = $2',
            [enlevementId, spotId]
        );
        
        // Mettre à jour l'enlèvement
        const enlevementResult = await client.query(
            `UPDATE enlevements 
             SET emplacement = $1, date_entree_parc = CURRENT_TIMESTAMP, statut = 'au_parc'
             WHERE id = $2
             RETURNING *`,
            [spotResult.rows[0].number, enlevementId]
        );
        
        await client.query('COMMIT');
        
        res.json({
            spot: spotResult.rows[0],
            enlevement: enlevementResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Libérer un emplacement
app.post('/api/parking/release', authenticate, logActivity, async (req, res) => {
    try {
        const { spotId } = req.body;
        
        const result = await pool.query(
            `UPDATE parking_spots 
             SET occupied = false, vehicle_id = NULL
             WHERE id = $1
             RETURNING *`,
            [spotId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Emplacement non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ========== STATISTIQUES ==========

app.get('/api/stats/dashboard', authenticate, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM enlevements WHERE statut != 'sorti') as total_vehicules,
                (SELECT COUNT(*) FROM enlevements WHERE DATE(timestamp) = CURRENT_DATE) as entrees_aujourdhui,
                (SELECT COUNT(*) FROM enlevements WHERE sortie_date = CURRENT_DATE) as sorties_aujourdhui,
                (SELECT COUNT(*) FROM parking_spots WHERE occupied = true) as places_occupees,
                (SELECT COUNT(*) FROM parking_spots) as total_places
        `);
        const data = stats.rows[0];
        const totalPlaces = parseInt(data.total_places) || 0;
        const placesOccupees = parseInt(data.places_occupees) || 0;
        res.json({
            total_vehicules: parseInt(data.total_vehicules),
            entrees_aujourdhui: parseInt(data.entrees_aujourdhui),
            sorties_aujourdhui: parseInt(data.sorties_aujourdhui),
            taux_occupation: totalPlaces > 0 ? Math.round((placesOccupees / totalPlaces) * 100) : 0,
            places_disponibles: totalPlaces - placesOccupees
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats/agent/:username', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'agent' && req.user.username !== req.params.username) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE DATE(timestamp) = CURRENT_DATE) as jour,
                COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as semaine,
                COUNT(*) FILTER (WHERE DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)) as mois
             FROM enlevements
             WHERE agent = $1`,
            [req.params.username]
        );
        
        res.json({
            total: parseInt(result.rows[0].total),
            jour: parseInt(result.rows[0].jour),
            semaine: parseInt(result.rows[0].semaine),
            mois: parseInt(result.rows[0].mois)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ADMINISTRATION ==========

// Lister tous les utilisateurs (admin uniquement)
app.get('/api/admin/users', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
        const result = await pool.query(
            `SELECT id, username, role, email, telephone, actif, created_at, last_login
             FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Activer / désactiver un utilisateur (admin uniquement)
app.put('/api/admin/users/:id', authenticate, logActivity, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
        if (req.user.id === req.params.id) return res.status(400).json({ error: 'Impossible de modifier son propre compte' });

        const allowed = ['actif', 'role', 'email', 'telephone'];
        const fields = [], values = [];
        let n = 0;
        for (const key of allowed) {
            if (req.body[key] !== undefined) { values.push(req.body[key]); fields.push(`${key} = $${++n}`); }
        }
        if (fields.length === 0) return res.status(400).json({ error: 'Aucune donnée' });
        values.push(req.params.id);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${++n} RETURNING id, username, role, email, actif`,
            values
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Changer le mot de passe d'un utilisateur (admin uniquement)
app.put('/api/admin/users/:id/password', authenticate, logActivity, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
        const { password } = req.body;
        if (!password || password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 caractères min)' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, username',
            [hashedPassword, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ message: 'Mot de passe mis à jour', user: result.rows[0] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Traiter la sortie d'un véhicule (admin et fourrière)
app.post('/api/admin/sorties', authenticate, logActivity, async (req, res) => {
    const client = await pool.connect();
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé' });
        await client.query('BEGIN');

        const { enlevement_id, sortie_proprietaire, sortie_agent, sortie_montant_paye, sortie_mode_paiement,
                date_main_levee, bon_sortie_sendra, date_paiement_vae, motif_sortie } = req.body;
        if (!enlevement_id) return res.status(400).json({ error: 'enlevement_id requis' });

        const result = await client.query(
            `UPDATE enlevements
             SET statut = 'sorti',
                 sortie_date = CURRENT_DATE,
                 sortie_heure = CURRENT_TIME,
                 sortie_proprietaire = $2,
                 sortie_agent = $3,
                 sortie_montant_paye = $4,
                 sortie_mode_paiement = $5,
                 date_main_levee = $6,
                 bon_sortie_sendra = $7,
                 date_paiement_vae = $8,
                 motif_sortie = $9
             WHERE id = $1 AND statut = 'au_parc'
             RETURNING *`,
            [enlevement_id, sortie_proprietaire || null, sortie_agent || req.user.username,
             sortie_montant_paye || null, sortie_mode_paiement || null,
             date_main_levee || null, bon_sortie_sendra || null,
             date_paiement_vae || null, motif_sortie || null]
        );
        if (result.rows.length === 0) {
            throw new Error('Véhicule non trouvé ou déjà sorti');
        }

        // Libérer l'emplacement parking si occupé
        await client.query(
            `UPDATE parking_spots SET occupied = false, vehicle_id = NULL
             WHERE vehicle_id = $1`,
            [enlevement_id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Véhicules actuellement au parc (admin et fourrière)
app.get('/api/admin/au-parc', authenticate, async (req, res) => {
    try {
        if (!['admin', 'fourriere'].includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé' });
        const result = await pool.query(
            `SELECT e.*,
                    r.ordre_entree, r.zone_placement, r.agent_responsable, r.date_entree, r.heure_entree,
                    EXTRACT(DAY FROM (NOW() - COALESCE(e.date_entree_parc, e.timestamp))) AS jours_parc
             FROM enlevements e
             LEFT JOIN receptions r ON r.enlevement_id = e.id
             WHERE e.statut = 'au_parc'
             ORDER BY e.date_entree_parc ASC NULLS LAST`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PDF ==========

// Utilitaire : formater une date française
function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return String(d); }
}

// Utilitaire : formater une heure (HH:MM)
function fmtTime(t) {
    if (!t) return '—';
    return String(t).slice(0, 5);
}

// Utilitaire : construire le PDF avec les sections communes
function buildPdf(doc, type, enlevement, chauffeur) {
    // En-tête
    doc.fontSize(10).font('Helvetica').fillColor('#555555')
       .text('DIRECTION GESTION DU CADRE DE VIE', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a')
       .text(type, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#888888')
       .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('#cccccc').stroke();
    doc.moveDown(0.5);

    // Section VÉHICULE
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('VÉHICULE');
    doc.moveDown(0.3);
    const vFields = [
        ['Matricule', enlevement.vehicule_matricule],
        ['Marque', enlevement.vehicule_marque || '—'],
        ['Modèle', enlevement.vehicule_modele || '—'],
        ['Couleur', enlevement.vehicule_couleur || '—'],
        ['État', enlevement.etat_vehicule || '—'],
    ];
    vFields.forEach(([label, val]) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#555').text(label + ' : ', { continued: true })
           .font('Helvetica').fillColor('#000').text(val);
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#dddddd').stroke();
    doc.moveDown(0.5);

    // Section ENLÈVEMENT
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('ENLÈVEMENT');
    doc.moveDown(0.3);
    const chauffeurNom = chauffeur ? `${chauffeur.prenom} ${chauffeur.nom} (${chauffeur.matricule_plateau})` : '—';
    const eFields = [
        ['Agent', enlevement.agent || '—'],
        ['Cadre de saisie', enlevement.cadre_saisie || '—'],
        ['Date', fmtDate(enlevement.date_enlevement || enlevement.timestamp)],
        ['Heure', fmtTime(enlevement.heure_enlevement)],
        ['Lieu', enlevement.lieu_enlevement || enlevement.gps_adresse || '—'],
        ['GPS', enlevement.gps_latitude ? `${enlevement.gps_latitude}, ${enlevement.gps_longitude}` : '—'],
        ['Commentaires', enlevement.commentaires || '—'],
        ['Autorité', enlevement.autorite_identifiant ? `${enlevement.autorite_identifiant} (${enlevement.autorite_type || '—'})` : '—'],
        ['Chauffeur', chauffeurNom],
    ];
    eFields.forEach(([label, val]) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#555').text(label + ' : ', { continued: true })
           .font('Helvetica').fillColor('#000').text(val);
    });
}

// GET /api/pdf/rapport-enlevement/:id
app.get('/api/pdf/rapport-enlevement/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, c.prenom as chauffeur_prenom, c.nom as chauffeur_nom, c.matricule_plateau
             FROM enlevements e
             LEFT JOIN chauffeurs c ON e.chauffeur_id = c.id
             WHERE e.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Enlèvement non trouvé' });

        const e = result.rows[0];
        const chauffeur = e.chauffeur_prenom ? { prenom: e.chauffeur_prenom, nom: e.chauffeur_nom, matricule_plateau: e.matricule_plateau } : null;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rapport-enlevement-${e.vehicule_matricule}.pdf"`);
        doc.pipe(res);

        buildPdf(doc, "RAPPORT D'ENLÈVEMENT", e, chauffeur);

        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pdf/bon-entree/:reception_id
app.get('/api/pdf/bon-entree/:reception_id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, e.vehicule_matricule, e.vehicule_marque, e.vehicule_modele, e.vehicule_couleur,
                    e.cadre_saisie, e.etat_vehicule, e.agent, e.gps_latitude, e.gps_longitude, e.gps_adresse,
                    e.date_enlevement, e.heure_enlevement, e.lieu_enlevement, e.commentaires,
                    e.autorite_identifiant, e.autorite_type, e.timestamp,
                    c.prenom as chauffeur_prenom, c.nom as chauffeur_nom, c.matricule_plateau
             FROM receptions r
             LEFT JOIN enlevements e ON r.enlevement_id = e.id
             LEFT JOIN chauffeurs c ON e.chauffeur_id = c.id
             WHERE r.id = $1`,
            [req.params.reception_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Réception non trouvée' });

        const row = result.rows[0];
        const chauffeur = row.chauffeur_prenom ? { prenom: row.chauffeur_prenom, nom: row.chauffeur_nom, matricule_plateau: row.matricule_plateau } : null;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="bon-entree-${row.vehicule_matricule}.pdf"`);
        doc.pipe(res);

        buildPdf(doc, "BON D'ENTRÉE EN FOURRIÈRE", row, chauffeur);

        // Section RÉCEPTION
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#dddddd').stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('RÉCEPTION EN FOURRIÈRE');
        doc.moveDown(0.3);
        const rFields = [
            ['Agent responsable', row.agent_responsable || '—'],
            ['Date entrée', fmtDate(row.date_entree)],
            ['Heure entrée', fmtTime(row.heure_entree)],
            ['Zone de placement', row.zone_placement || '—'],
            ['Observations', row.observations || '—'],
        ];
        rFields.forEach(([label, val]) => {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#555').text(label + ' : ', { continued: true })
               .font('Helvetica').fillColor('#000').text(val);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pdf/bon-sortie/:enlevement_id
app.get('/api/pdf/bon-sortie/:enlevement_id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, c.prenom as chauffeur_prenom, c.nom as chauffeur_nom, c.matricule_plateau
             FROM enlevements e
             LEFT JOIN chauffeurs c ON e.chauffeur_id = c.id
             WHERE e.id = $1 AND e.statut = 'sorti'`,
            [req.params.enlevement_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Véhicule sorti non trouvé' });

        const e = result.rows[0];
        const chauffeur = e.chauffeur_prenom ? { prenom: e.chauffeur_prenom, nom: e.chauffeur_nom, matricule_plateau: e.matricule_plateau } : null;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="bon-sortie-${e.vehicule_matricule}.pdf"`);
        doc.pipe(res);

        buildPdf(doc, 'BON DE SORTIE DE FOURRIÈRE', e, chauffeur);

        // Section SORTIE
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(0.5).strokeColor('#dddddd').stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('SORTIE DE FOURRIÈRE');
        doc.moveDown(0.3);
        const sFields = [
            ['Agent sortie', e.sortie_agent || '—'],
            ['Propriétaire', e.sortie_proprietaire || '—'],
            ['Date de main levée', fmtDate(e.date_main_levee)],
            ['Bon de sortie Sendra', e.bon_sortie_sendra || '—'],
            ['Date paiement / VAE', fmtDate(e.date_paiement_vae)],
            ['Date sortie', fmtDate(e.sortie_date)],
            ['Heure sortie', fmtTime(e.sortie_heure)],
            ['Montant payé', e.sortie_montant_paye ? `${e.sortie_montant_paye} FCFA` : '—'],
            ['Mode de paiement', e.sortie_mode_paiement || '—'],
            ['Motif de sortie', e.motif_sortie || '—'],
        ];
        sFields.forEach(([label, val]) => {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#555').text(label + ' : ', { continued: true })
               .font('Helvetica').fillColor('#000').text(val);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== LOGS D'ACTIVITÉ ==========

app.get('/api/logs', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        
        const { limit = 50, skip = 0 } = req.query;
        
        const result = await pool.query(
            `SELECT * FROM activity_logs 
             ORDER BY timestamp DESC 
             LIMIT $1 OFFSET $2`,
            [limit, skip]
        );
        
        const countResult = await pool.query('SELECT COUNT(*) FROM activity_logs');
        
        res.json({
            logs: result.rows,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== BACKUP / EXPORT ==========

app.get('/api/export/backup', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        
        const [enlevements, parkingSpots, users] = await Promise.all([
            pool.query('SELECT * FROM enlevements'),
            pool.query('SELECT * FROM parking_spots'),
            pool.query('SELECT id, username, role, email, actif FROM users')
        ]);
        
        const backup = {
            exportDate: new Date().toISOString(),
            exportedBy: req.user.username,
            data: {
                enlevements: enlevements.rows,
                parkingSpots: parkingSpots.rows,
                users: users.rows
            }
        };
        
        res.json(backup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route de santé
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'Connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            database: 'Disconnected',
            error: error.message
        });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🐘 PostgreSQL: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, fermeture du pool PostgreSQL...');
    pool.end(() => {
        console.log('Pool PostgreSQL fermé');
        process.exit(0);
    });
});

module.exports = app;
