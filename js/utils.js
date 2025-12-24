// js/utils.js
// Funciones auxiliares

const Utils = {
    /**
     * Muestra un mensaje de error al usuario
     */
    showError(message, elementId = 'error-message') {
        const errorElement = document.getElementById(elementId);
        if(errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';

            //Auto-ocultar despues de 5 segundos
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    },

    /**
     * Muestra un mensaje de exito
     */
     showSuccess(message, elementId = 'success-message') {
        const successElement = document.getElementById(elementId);
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 3000);
        }
    },

    /**
     * Muestra/oculta el loader
     */
    toggleLoader(show, elementId = 'loader') {
        const loader = document.getElementById(elementId);
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    },

    /**
     * Valida email
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Sanitiza input del usuario
     */
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    /**
     * Verifica si una sesión ha expirado
     */
    isSessionExpired() {
        const expiry = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
        if (!expiry) return true;
        return new Date().getTime() > parseInt(expiry);
    }
};
