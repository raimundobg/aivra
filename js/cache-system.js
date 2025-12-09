/* ============================================
   CACHE SYSTEM - ZENLAB PRO
   Sistema de persistencia local para borradores
   ============================================ */

   (function() {
    'use strict';
    
    console.log('💾 Cache System inicializado');
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CACHE_PREFIX = 'zenlab_patient_';
    const CACHE_EXPIRY_HOURS = 24;
    
    // ============================================
    // FUNCIONES DE CACHE
    // ============================================
    
    /**
     * Guardar datos en localStorage
     */
    window.cachePatientData = function(patientId, data) {
        try {
            const cacheKey = CACHE_PREFIX + (patientId || 'draft');
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log(`💾 Cache guardado: ${cacheKey}`);
            return true;
        } catch (e) {
            console.warn('⚠️ Error guardando cache:', e);
            return false;
        }
    };
    
    /**
     * Recuperar datos de localStorage
     */
    window.getCachedPatientData = function(patientId) {
        try {
            const cacheKey = CACHE_PREFIX + (patientId || 'draft');
            const cached = localStorage.getItem(cacheKey);
            
            if (!cached) {
                console.log(`💾 Cache no encontrado: ${cacheKey}`);
                return null;
            }
            
            const cacheData = JSON.parse(cached);
            
            // Verificar expiración
            const hoursOld = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);
            if (hoursOld > CACHE_EXPIRY_HOURS) {
                console.log(`💾 Cache expirado: ${cacheKey} (${hoursOld.toFixed(1)} horas)`);
                localStorage.removeItem(cacheKey);
                return null;
            }
            
            console.log(`💾 Cache recuperado: ${cacheKey}`);
            return cacheData.data;
        } catch (e) {
            console.warn('⚠️ Error leyendo cache:', e);
            return null;
        }
    };
    
    /**
     * Eliminar cache de un paciente
     */
    window.clearPatientCache = function(patientId) {
        try {
            const cacheKey = CACHE_PREFIX + (patientId || 'draft');
            localStorage.removeItem(cacheKey);
            console.log(`💾 Cache eliminado: ${cacheKey}`);
            return true;
        } catch (e) {
            console.warn('⚠️ Error eliminando cache:', e);
            return false;
        }
    };
    
    /**
     * Limpiar todos los caches de pacientes
     */
    window.clearAllPatientCache = function() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(CACHE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`💾 ${keysToRemove.length} caches eliminados`);
            return true;
        } catch (e) {
            console.warn('⚠️ Error limpiando caches:', e);
            return false;
        }
    };
    
    /**
     * Auto-guardar formulario periódicamente
     */
    window.initAutoSave = function(formId, patientId, intervalMs = 30000) {
        const form = document.getElementById(formId);
        if (!form) {
            console.warn('⚠️ Formulario no encontrado para auto-save:', formId);
            return;
        }
        
        setInterval(() => {
            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            cachePatientData(patientId, data);
        }, intervalMs);
        
        console.log(`💾 Auto-save iniciado: cada ${intervalMs/1000}s`);
    };
    
    console.log('💾 ✅ Cache System listo');
    
})();