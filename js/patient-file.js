/* ============================================
   PATIENT FILE - ZENLAB PRO
   JavaScript para gestión de ficha de paciente
   ============================================ */

   (function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_BASE: '/api/patients',
        AUTOSAVE_DELAY: 2000,
        IMC_CATEGORIES: {
            bajo: { min: 0, max: 18.5, label: 'Bajo peso', class: 'warning' },
            normal: { min: 18.5, max: 25, label: 'Normal', class: '' },
            sobrepeso: { min: 25, max: 30, label: 'Sobrepeso', class: 'warning' },
            obesidad1: { min: 30, max: 35, label: 'Obesidad I', class: 'danger' },
            obesidad2: { min: 35, max: 40, label: 'Obesidad II', class: 'danger' },
            obesidad3: { min: 40, max: 100, label: 'Obesidad III', class: 'danger' }
        },
        FACTORES_ACTIVIDAD: {
            'sedentario': 1.2,
            'ligero': 1.375,
            'moderado': 1.55,
            'activo': 1.725,
            'muy_activo': 1.9
        }
    };
    
    // ============================================
    // ESTADO
    // ============================================
    let state = {
        isEditMode: false,
        hasChanges: false,
        autosaveTimeout: null,
        patientId: null
    };
    
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================
    const elements = {
        form: document.getElementById('patientFileForm'),
        patientId: document.getElementById('patientId'),
        saveStatus: document.getElementById('saveStatus'),
        btnEdit: document.getElementById('btnEdit'),
        btnSave: document.getElementById('btnSave'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        // Campos de cálculo
        talla: document.getElementById('talla_m'),
        peso: document.getElementById('peso_kg'),
        sexo: document.getElementById('sexo'),
        fechaNacimiento: document.getElementById('fecha_nacimiento'),
        actividadFisica: document.getElementById('actividad_fisica'),
        // Pliegues
        pliegues: {
            bicipital: document.getElementById('pliegue_bicipital'),
            tricipital: document.getElementById('pliegue_tricipital'),
            subescapular: document.getElementById('pliegue_subescapular'),
            supracrestideo: document.getElementById('pliegue_supracrestideo')
        },
        // Perímetros
        perimetroCintura: document.getElementById('perimetro_cintura'),
        perimetroCadera: document.getElementById('perimetro_cadera'),
        // Sliders
        calidadSueno: document.getElementById('calidad_sueno'),
        nivelEstres: document.getElementById('nivel_estres'),
        // Macros
        proteinasPct: document.getElementById('proteinas_porcentaje'),
        carbohidratosPct: document.getElementById('carbohidratos_porcentaje'),
        grasasPct: document.getElementById('grasas_porcentaje')
    };
    
    // ============================================
    // MODO EDICIÓN
    // ============================================
    window.toggleEditMode = function() {
        state.isEditMode = !state.isEditMode;
        
        if (state.isEditMode) {
            elements.form.classList.remove('view-mode');
            elements.form.classList.add('edit-mode');
            elements.btnEdit.innerHTML = '<i class="fas fa-times"></i><span>Cancelar</span>';
            elements.btnEdit.classList.remove('btn-edit');
            elements.btnEdit.classList.add('btn-delete');
            elements.btnSave.disabled = false;
        } else {
            elements.form.classList.remove('edit-mode');
            elements.form.classList.add('view-mode');
            elements.btnEdit.innerHTML = '<i class="fas fa-edit"></i><span>Editar</span>';
            elements.btnEdit.classList.remove('btn-delete');
            elements.btnEdit.classList.add('btn-edit');
            elements.btnSave.disabled = true;
            
            // Si había cambios sin guardar, recargar
            if (state.hasChanges) {
                location.reload();
            }
        }
    };
    
    // ============================================
    // GUARDAR PACIENTE
    // ============================================
    window.savePatient = async function() {
        if (!state.isEditMode) return;
        
        const patientId = elements.patientId.value;
        const formData = new FormData(elements.form);
        const data = {};
        
        // Convertir FormData a objeto
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Convertir checkboxes y booleans
        data.fuma = document.getElementById('fuma').value === 'true';
        
        showLoading();
        updateSaveStatus('saving');
        
        try {
            const response = await fetch(`${CONFIG.API_BASE}/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Actualizar valores calculados
                if (result.patient) {
                    updateCalculatedFields(result.patient);
                }
                
                state.hasChanges = false;
                updateSaveStatus('saved');
                showToast('Ficha guardada exitosamente', 'success');
                
                // Salir del modo edición
                toggleEditMode();
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            updateSaveStatus('unsaved');
            showToast('Error al guardar la ficha', 'danger');
        } finally {
            hideLoading();
        }
    };
    
    // ============================================
    // CÁLCULOS ANTROPOMÉTRICOS
    // ============================================
    
    window.calcularIMC = function() {
        const peso = parseFloat(elements.peso?.value);
        const talla = parseFloat(elements.talla?.value);
        
        if (peso && talla && talla > 0) {
            const imc = peso / (talla * talla);
            const imcRounded = Math.round(imc * 10) / 10;
            
            // Determinar categoría
            let categoria = 'Normal';
            let cssClass = '';
            
            for (const [key, cat] of Object.entries(CONFIG.IMC_CATEGORIES)) {
                if (imc >= cat.min && imc < cat.max) {
                    categoria = cat.label;
                    cssClass = cat.class;
                    break;
                }
            }
            
            // Actualizar UI
            const imcValue = document.getElementById('imcValue');
            const imcCategoria = document.getElementById('imcCategoria');
            const summaryIMC = document.getElementById('summaryIMC');
            
            if (imcValue) imcValue.textContent = imcRounded;
            if (imcCategoria) imcCategoria.textContent = categoria;
            if (summaryIMC) summaryIMC.textContent = imcRounded;
            
            // Actualizar clase del campo calculado
            const field = imcValue?.closest('.calculated-field');
            if (field) {
                field.classList.remove('warning', 'danger');
                if (cssClass) field.classList.add(cssClass);
            }
            
            markAsChanged();
            return imcRounded;
        }
        return null;
    };
    
    window.calcularEdad = function() {
        const fechaNac = elements.fechaNacimiento?.value;
        if (!fechaNac) return null;
        
        const birth = new Date(fechaNac);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        const summaryEdad = document.getElementById('summaryEdad');
        if (summaryEdad) summaryEdad.textContent = age;
        
        return age;
    };
    
    window.calcularGrasa = function() {
        const pliegues = [
            parseFloat(elements.pliegues.bicipital?.value),
            parseFloat(elements.pliegues.tricipital?.value),
            parseFloat(elements.pliegues.subescapular?.value),
            parseFloat(elements.pliegues.supracrestideo?.value)
        ];
        
        // Verificar que todos los pliegues estén presentes
        if (pliegues.some(p => isNaN(p) || p <= 0)) {
            return null;
        }
        
        const sumaPliegues = pliegues.reduce((a, b) => a + b, 0);
        const logPliegues = Math.log10(sumaPliegues);
        
        const edad = calcularEdad() || 30;
        const sexo = elements.sexo?.value;
        
        // Coeficientes Durnin-Womersley
        let c, m;
        
        if (sexo === 'Masculino') {
            if (edad < 17) { c = 1.1533; m = 0.0643; }
            else if (edad < 20) { c = 1.1620; m = 0.0630; }
            else if (edad < 30) { c = 1.1631; m = 0.0632; }
            else if (edad < 40) { c = 1.1422; m = 0.0544; }
            else if (edad < 50) { c = 1.1620; m = 0.0700; }
            else { c = 1.1715; m = 0.0779; }
        } else {
            if (edad < 17) { c = 1.1369; m = 0.0598; }
            else if (edad < 20) { c = 1.1549; m = 0.0678; }
            else if (edad < 30) { c = 1.1599; m = 0.0717; }
            else if (edad < 40) { c = 1.1423; m = 0.0632; }
            else if (edad < 50) { c = 1.1333; m = 0.0612; }
            else { c = 1.1339; m = 0.0645; }
        }
        
        const densidad = c - (m * logPliegues);
        const porcentajeGrasa = Math.round(((495 / densidad) - 450) * 10) / 10;
        
        // Actualizar UI
        const grasaValue = document.getElementById('grasaValue');
        const summaryGrasa = document.getElementById('summaryGrasa');
        
        if (grasaValue) grasaValue.textContent = porcentajeGrasa + '%';
        if (summaryGrasa) summaryGrasa.textContent = porcentajeGrasa + '%';
        
        markAsChanged();
        return porcentajeGrasa;
    };
    
    window.calcularICC = function() {
        const cintura = parseFloat(elements.perimetroCintura?.value);
        const cadera = parseFloat(elements.perimetroCadera?.value);
        const sexo = elements.sexo?.value;
        
        if (cintura && cadera && cadera > 0) {
            const icc = Math.round((cintura / cadera) * 100) / 100;
            
            let riesgo = 'Bajo';
            let cssClass = '';
            
            if (sexo === 'Masculino') {
                if (icc >= 1.0) { riesgo = 'Alto'; cssClass = 'danger'; }
                else if (icc >= 0.95) { riesgo = 'Moderado'; cssClass = 'warning'; }
            } else {
                if (icc >= 0.85) { riesgo = 'Alto'; cssClass = 'danger'; }
                else if (icc >= 0.80) { riesgo = 'Moderado'; cssClass = 'warning'; }
            }
            
            const iccValue = document.getElementById('iccValue');
            const riesgoCV = document.getElementById('riesgoCV');
            
            if (iccValue) iccValue.textContent = icc;
            if (riesgoCV) riesgoCV.textContent = riesgo;
            
            const field = iccValue?.closest('.calculated-field');
            if (field) {
                field.classList.remove('warning', 'danger');
                if (cssClass) field.classList.add(cssClass);
            }
            
            markAsChanged();
            return icc;
        }
        return null;
    };
    
    // ============================================
    // CÁLCULOS NUTRICIONALES
    // ============================================
    
    window.calcularGEB = function() {
        const peso = parseFloat(elements.peso?.value);
        const talla = parseFloat(elements.talla?.value);
        const sexo = elements.sexo?.value;
        const edad = calcularEdad();
        
        if (!peso || !talla || !sexo || !edad) return null;
        
        const alturaCm = talla * 100;
        let geb;
        
        // Harris-Benedict revisada
        if (sexo === 'Masculino') {
            geb = 88.362 + (13.397 * peso) + (4.799 * alturaCm) - (5.677 * edad);
        } else {
            geb = 447.593 + (9.247 * peso) + (3.098 * alturaCm) - (4.330 * edad);
        }
        
        geb = Math.round(geb);
        
        const gebValue = document.getElementById('gebValue');
        if (gebValue) gebValue.textContent = geb;
        
        return geb;
    };
    
    window.calcularGET = function() {
        const geb = calcularGEB();
        if (!geb) return null;
        
        const actividad = elements.actividadFisica?.value;
        const factorActividad = CONFIG.FACTORES_ACTIVIDAD[actividad] || 1.2;
        
        const get = Math.round(geb * factorActividad);
        
        const getValue = document.getElementById('getValue');
        const summaryGET = document.getElementById('summaryGET');
        
        if (getValue) getValue.textContent = get;
        if (summaryGET) summaryGET.textContent = get;
        
        // Recalcular macros con nuevo GET
        calcularMacros();
        
        markAsChanged();
        return get;
    };
    
    window.calcularMacros = function() {
        const getEl = document.getElementById('getValue');
        const get = parseFloat(getEl?.textContent);
        
        if (!get || isNaN(get)) return null;
        
        const protPct = parseFloat(elements.proteinasPct?.value) || 20;
        const carbPct = parseFloat(elements.carbohidratosPct?.value) || 50;
        const grasPct = parseFloat(elements.grasasPct?.value) || 30;
        
        // Validar que sumen 100%
        const total = protPct + carbPct + grasPct;
        const totalBadge = document.getElementById('totalPorcentaje');
        if (totalBadge) {
            totalBadge.textContent = total + '%';
            totalBadge.className = total === 100 ? 'badge bg-success' : 'badge bg-danger';
        }
        
        // Calcular gramos
        const proteinasG = Math.round((get * protPct / 100) / 4);
        const carbohidratosG = Math.round((get * carbPct / 100) / 4);
        const grasasG = Math.round((get * grasPct / 100) / 9);
        const fibraG = Math.round(get * 14 / 1000);
        
        // Actualizar UI
        document.getElementById('proteinasG').textContent = proteinasG + 'g';
        document.getElementById('carbohidratosG').textContent = carbohidratosG + 'g';
        document.getElementById('grasasG').textContent = grasasG + 'g';
        document.getElementById('fibraG').textContent = fibraG + 'g';
        
        // Actualizar summary
        const summaryProteinas = document.getElementById('summaryProteinas');
        if (summaryProteinas) summaryProteinas.textContent = proteinasG + 'g';
        
        markAsChanged();
        return { proteinasG, carbohidratosG, grasasG, fibraG };
    };
    
    window.calcularRequerimientos = function() {
        calcularIMC();
        calcularGrasa();
        calcularICC();
        calcularGEB();
        calcularGET();
        calcularMacros();
        
        showToast('Cálculos actualizados', 'success');
    };
    
    // ============================================
    // UI HELPERS
    // ============================================
    
    function updateSaveStatus(status) {
        const statusEl = elements.saveStatus;
        if (!statusEl) return;
        
        statusEl.className = 'save-status ' + status;
        
        switch(status) {
            case 'saved':
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Guardado</span>';
                break;
            case 'saving':
                statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Guardando...</span>';
                break;
            case 'unsaved':
                statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Sin guardar</span>';
                break;
        }
    }
    
    function markAsChanged() {
        if (state.isEditMode) {
            state.hasChanges = true;
            updateSaveStatus('unsaved');
        }
    }
    
    function updateCalculatedFields(patient) {
        if (patient.imc) document.getElementById('imcValue').textContent = patient.imc;
        if (patient.imc_categoria) document.getElementById('imcCategoria').textContent = patient.imc_categoria;
        if (patient.porcentaje_grasa) document.getElementById('grasaValue').textContent = patient.porcentaje_grasa + '%';
        if (patient.indice_cintura_cadera) document.getElementById('iccValue').textContent = patient.indice_cintura_cadera;
        if (patient.geb_kcal) document.getElementById('gebValue').textContent = patient.geb_kcal;
        if (patient.get_kcal) document.getElementById('getValue').textContent = patient.get_kcal;
    }
    
    function showLoading() {
        elements.loadingOverlay?.classList.add('show');
    }
    
    function hideLoading() {
        elements.loadingOverlay?.classList.remove('show');
    }
    
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            <strong>${message}</strong>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    // ============================================
    // NAVEGACIÓN
    // ============================================
    
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Abrir el acordeón si está cerrado
        const collapse = new bootstrap.Collapse(section, { toggle: false });
        collapse.show();
        
        // Scroll suave
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        
        // Actualizar nav activo
        document.querySelectorAll('.quick-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.quick-nav-item')?.classList.add('active');
    };
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    function initSliders() {
        // Calidad del sueño
        const calidadSueno = elements.calidadSueno;
        if (calidadSueno) {
            calidadSueno.addEventListener('input', function() {
                document.getElementById('calidadSuenoValue').textContent = this.value;
                markAsChanged();
            });
        }
        
        // Nivel de estrés
        const nivelEstres = elements.nivelEstres;
        if (nivelEstres) {
            nivelEstres.addEventListener('input', function() {
                document.getElementById('estresValue').textContent = this.value;
                markAsChanged();
            });
        }
    }
    
    function initFormListeners() {
        // Escuchar cambios en cualquier campo
        elements.form?.addEventListener('input', () => {
            if (state.isEditMode) {
                markAsChanged();
            }
        });
        
        elements.form?.addEventListener('change', () => {
            if (state.isEditMode) {
                markAsChanged();
            }
        });
        
        // Prevenir envío del formulario
        elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            savePatient();
        });
    }
    
    function init() {
        state.patientId = elements.patientId?.value;
        
        initSliders();
        initFormListeners();
        
        // Calcular valores iniciales
        calcularEdad();
        
        console.log('✅ Patient File initialized');
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();