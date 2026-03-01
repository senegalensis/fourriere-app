// api-client.js - Client API pour se connecter au backend
class FourriereAPI {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('api_token');
    }

    // Headers par défaut
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Gestion des erreurs
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
            throw new Error(error.error || error.message || 'Erreur serveur');
        }
        return response.json();
    }

    // ========== AUTHENTIFICATION ==========

    async login(username, password) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify({ username, password })
        });

        const data = await this.handleResponse(response);
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('api_token', data.token);
        }

        return data;
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth/verify`, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('api_token');
    }

    async register(userData) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(userData)
        });
        return await this.handleResponse(response);
    }

    // ========== ENLÈVEMENTS ==========

    async createEnlevement(enlevementData) {
        const response = await fetch(`${this.baseURL}/enlevements`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(enlevementData)
        });
        return await this.handleResponse(response);
    }

    async getEnlevements(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${this.baseURL}/enlevements${queryParams ? '?' + queryParams : ''}`;
        
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    async getEnlevement(id) {
        const response = await fetch(`${this.baseURL}/enlevements/${id}`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    async updateEnlevement(id, data) {
        const response = await fetch(`${this.baseURL}/enlevements/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return await this.handleResponse(response);
    }

    async searchPublic(matricule) {
        const response = await fetch(`${this.baseURL}/public/search/${matricule}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        return await this.handleResponse(response);
    }

    // ========== PHOTOS ==========

    async addPhotos(enlevementId, photos) {
        const response = await fetch(`${this.baseURL}/photos`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ enlevementId, photos })
        });
        return await this.handleResponse(response);
    }

    async getPhotos(enlevementId) {
        const response = await fetch(`${this.baseURL}/photos/${enlevementId}`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    // ========== PARKING ==========

    async initParking() {
        const response = await fetch(`${this.baseURL}/parking/init`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    async getParkingSpots() {
        const response = await fetch(`${this.baseURL}/parking`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    async assignParking(spotId, enlevementId) {
        const response = await fetch(`${this.baseURL}/parking/assign`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ spotId, enlevementId })
        });
        return await this.handleResponse(response);
    }

    async releaseParking(spotId) {
        const response = await fetch(`${this.baseURL}/parking/release`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ spotId })
        });
        return await this.handleResponse(response);
    }

    // ========== STATISTIQUES ==========

    async getDashboardStats() {
        const response = await fetch(`${this.baseURL}/stats/dashboard`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    async getAgentStats(username) {
        const response = await fetch(`${this.baseURL}/stats/agent/${username}`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    // ========== LOGS ==========

    async getLogs(limit = 50, skip = 0) {
        const response = await fetch(`${this.baseURL}/logs?limit=${limit}&skip=${skip}`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    // ========== EXPORT ==========

    async exportBackup() {
        const response = await fetch(`${this.baseURL}/export/backup`, {
            headers: this.getHeaders()
        });
        return await this.handleResponse(response);
    }

    // ========== HEALTH CHECK ==========

    async healthCheck() {
        const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
        return await this.handleResponse(response);
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FourriereAPI;
}
