// js/api.js
// Módulo para consumir las APIs del backend

const API = {
    /**
     * Realiza una petición GET autenticada
     */
    async get(endpoint) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include', // Importante: enviar cookies de sesión
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            if (response.status === 401) {
                // Sesión expirada
                Auth.logout();
                throw new Error('Sesión expirada. Por favor inicia sesión nuevamente');
            }

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado');
            }
            throw error;
        }
    },

    /**
     * Obtiene la lista de dispositivos (taxis) del usuario
     */
    async getDevices() {
        try {
            const devices = await this.get(CONFIG.ENDPOINTS.DEVICES);
            console.log('Dispositivos obtenidos:', devices);
            return devices;
        } catch (error) {
            console.error('Error obteniendo dispositivos:', error);
            throw error;
        }
    },

    /**
     * Obtiene las posiciones de todos los dispositivos
     * @param {Array} deviceIds - Array opcional de IDs de dispositivos específicos
     */
    async getPositions(deviceIds = null) {
        try {
            let endpoint = CONFIG.ENDPOINTS.POSITIONS;
            
            // Si se especifican IDs, filtrar por ellos
            if (deviceIds && deviceIds.length > 0) {
                const params = new URLSearchParams();
                deviceIds.forEach(id => params.append('deviceId', id));
                endpoint += `?${params.toString()}`;
            }
            
            const positions = await this.get(endpoint);
            console.log('Posiciones obtenidas:', positions);
            return positions;
        } catch (error) {
            console.error('Error obteniendo posiciones:', error);
            throw error;
        }
    },

    /**
     * Obtiene la posición de un dispositivo específico
     */
    async getDevicePosition(deviceId) {
        try {
            const positions = await this.getPositions([deviceId]);
            return positions.length > 0 ? positions[0] : null;
        } catch (error) {
            console.error(`Error obteniendo posición del dispositivo ${deviceId}:`, error);
            throw error;
        }
    }
};