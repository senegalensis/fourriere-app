// config.js - Configuration du frontend
const CONFIG = {
    // URL de l'API backend
    API_URL: 'http://localhost:3000/api',
    
    // Configuration pour production
    // Décommentez et modifiez selon votre déploiement
    // API_URL: 'https://votre-api.herokuapp.com/api',
    // API_URL: 'https://api.fourriere.com/api',
    
    // Paramètres de l'application
    APP_NAME: 'Fourrière',
    APP_VERSION: '1.0.0',
    
    // Limites
    MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_PHOTOS_PER_ENLEVEMENT: 10,
    
    // Timeout des requêtes (ms)
    REQUEST_TIMEOUT: 30000, // 30 secondes
    
    // Intervalle de rafraîchissement auto (ms)
    AUTO_REFRESH_INTERVAL: 60000, // 1 minute
    
    // OCR
    OCR_LANGUAGE: 'fra',
    OCR_CONFIDENCE_THRESHOLD: 60, // Pourcentage de confiance minimum
    
    // GPS
    GPS_TIMEOUT: 10000, // 10 secondes
    GPS_MAX_AGE: 30000, // 30 secondes
    GPS_ACCURACY_THRESHOLD: 100, // mètres
    
    // Validation
    MATRICULE_REGEX: /^[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}$/i,
    
    // Messages
    MESSAGES: {
        LOGIN_SUCCESS: 'Connexion réussie',
        LOGIN_ERROR: 'Identifiants incorrects',
        NETWORK_ERROR: 'Erreur de connexion au serveur',
        SAVE_SUCCESS: 'Données enregistrées avec succès',
        DELETE_CONFIRM: 'Êtes-vous sûr de vouloir supprimer ?',
        NO_CAMERA: 'Caméra non disponible',
        GPS_ERROR: 'Impossible d\'obtenir la localisation'
    },
    
    // Environnement
    ENV: 'development', // 'development' | 'production'
    
    // Debug
    DEBUG: true
};

// Détection automatique de l'environnement
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    CONFIG.ENV = 'production';
    CONFIG.DEBUG = false;
    
    // En production, utiliser l'URL relative si déployé sur le même domaine
    // ou spécifier l'URL complète de votre API
    if (window.location.hostname.includes('fourriere')) {
        CONFIG.API_URL = `${window.location.protocol}//${window.location.hostname}/api`;
    }
}

// Logger helper
const logger = {
    log: (...args) => {
        if (CONFIG.DEBUG) console.log('[Fourrière]', ...args);
    },
    error: (...args) => {
        if (CONFIG.DEBUG) console.error('[Fourrière Error]', ...args);
    },
    warn: (...args) => {
        if (CONFIG.DEBUG) console.warn('[Fourrière Warning]', ...args);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, logger };
}
