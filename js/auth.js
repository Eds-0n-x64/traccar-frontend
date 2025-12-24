// js/auth.js
// Manejo de autenticación

// js/auth.js
const Auth = {
    /**
     * Realiza el login del usuario
     */
    async login(email, password) {
        try {
            // Validaciones básicas
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }

            // Sanitizar inputs
            email = Utils.sanitizeInput(email.trim());
            password = password.trim();

            Utils.toggleLoader(true);

            // Crear FormData como URLSearchParams
            const formData = new URLSearchParams();
            formData.append('email', email);
            formData.append('password', password);

            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                credentials: 'include', // Para cookies de sesión
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            Utils.toggleLoader(false);

            // Si es 400, leer el mensaje de error del servidor
            if (response.status === 400) {
                let errorMessage = 'Datos inválidos';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Usar mensaje genérico
                }
                throw new Error(errorMessage);
            }

            // Verificar respuesta
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Email o contraseña incorrectos');
                } else if (response.status === 500) {
                    throw new Error('Error del servidor. Intenta más tarde');
                } else {
                    throw new Error(`Error: ${response.status}`);
                }
            }

            const data = await response.json();

            // Verificar que tengamos al menos un ID de usuario
            if (!data.id) {
                throw new Error('Respuesta del servidor inválida');
            }

            // Guardar sesión
            this.saveSession(data);

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
    saveSession(userData) {
        // Guardar los datos del usuario completos (excepto password)
        const safeUserData = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            administrator: userData.administrator,
            readonly: userData.readonly,
            disabled: userData.disabled,
            deviceLimit: userData.deviceLimit,
            userLimit: userData.userLimit,
            attributes: userData.attributes || {},
            // Configuración del mapa del usuario
            latitude: userData.latitude,
            longitude: userData.longitude,
            zoom: userData.zoom,
            map: userData.map,
            coordinateFormat: userData.coordinateFormat,
            // Permisos
            deviceReadonly: userData.deviceReadonly,
            limitCommands: userData.limitCommands,
            disableReports: userData.disableReports
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(safeUserData));
        
        // Guardar timestamp de inicio de sesión
        const loginTime = new Date().getTime();
        localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY, 
            (loginTime + CONFIG.SESSION_DURATION).toString());
        
        // Guardar flag de sesión activa
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, 'session_active');
    },

    /**
     * Obtiene el token/sesión actual
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
     * Verifica si el usuario es administrador
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.administrator === true;
    },

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        const token = this.getToken();
        const userData = this.getCurrentUser();
        
        // Verificar que no esté deshabilitado
        if (userData && userData.disabled) {
            this.logout();
            return false;
        }
        
        return token !== null && userData !== null && !Utils.isSessionExpired();
    },

    /**
     * Cierra la sesión del usuario
     */
    logout() {
        // Eliminar datos locales
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
        
        // Llamar al endpoint de logout del servidor (DELETE /api/session)
        fetch(`${CONFIG.API_BASE_URL}/api/session`, {
            method: 'DELETE',
            credentials: 'include'
        }).catch(err => console.log('Error en logout:', err));
        
        // Redirigir al login
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith('index.html') && currentPath !== '/') {
            window.location.href = 'index.html';
        }
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