// js/auth.js
// Manejo de autenticación

const Auth = {
    /**
     * Realiza el login del usuario
     */
    async login(username, password) {
        try {
            // Validaciones básicas
            if (!username || !password) {
                throw new Error('Usuario y contraseña son requeridos');
            }

            // Sanitizar inputs
            username = Utils.sanitizeInput(username.trim());
            password = password.trim();

            Utils.toggleLoader(true);

            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
                // Timeout
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            Utils.toggleLoader(false);

            // Verificar respuesta
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Usuario o contraseña incorrectos');
                } else if (response.status === 500) {
                    throw new Error('Error del servidor. Intenta más tarde');
                } else {
                    throw new Error(`Error: ${response.status}`);
                }
            }

            const data = await response.json();

            // Verificar que el backend envió un token
            if (!data.token && !data.access_token) {
                throw new Error('Respuesta del servidor inválida');
            }

            // Guardar token (puede venir como 'token' o 'access_token')
            const token = data.token || data.access_token;
            this.saveSession(token, data);

            return { success: true, data };

        } catch (error) {
            Utils.toggleLoader(false);
            
            // Manejo de errores específicos
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Verifica tu conexión');
            }
            
            throw error;
        }
    },

    /**
     * Guarda la sesión del usuario
     */
    saveSession(token, userData) {
        // Guardar token
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        
        // Guardar datos del usuario (sin contraseña)
        const safeUserData = {
            username: userData.username || userData.user,
            email: userData.email,
            // Otros datos que el backend envíe
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(safeUserData));
        
        // Guardar timestamp de expiración
        const expiryTime = new Date().getTime() + CONFIG.SESSION_DURATION;
        localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY, expiryTime.toString());
    },

    /**
     * Obtiene el token actual
     */
    getToken() {
        if (Utils.isSessionExpired()) {
            this.logout();
            return null;
        }
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    },

    /**
     * Obtiene los datos del usuario actual
     */
    getCurrentUser() {
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        const token = this.getToken();
        return token !== null && !Utils.isSessionExpired();
    },

    /**
     * Cierra la sesión del usuario
     */
    logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
        window.location.href = 'index.html';
    },

    /**
     * Protege una página (redirige al login si no está autenticado)
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    }
};