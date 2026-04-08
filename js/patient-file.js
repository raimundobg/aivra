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
        const modeIndicator = document.getElementById('modeIndicator');

        if (state.isEditMode) {
            elements.form.classList.remove('view-mode');
            elements.form.classList.add('edit-mode');
            elements.btnEdit.innerHTML = '<i class="fas fa-times"></i><span>Cancelar</span>';
            elements.btnEdit.classList.remove('btn-edit');
            elements.btnEdit.classList.add('btn-delete');
            elements.btnSave.disabled = false;
            if (modeIndicator) {
                modeIndicator.innerHTML = '<span><i class="fas fa-edit me-2"></i> <strong>Modo edicion activo</strong> — Modifica los campos y presiona <strong>Guardar</strong></span>';
                modeIndicator.style.background = '#f0fdf4';
                modeIndicator.style.borderColor = '#86efac';
                modeIndicator.className = 'alert alert-success py-2 px-3 mb-3';
            }
        } else {
            elements.form.classList.remove('edit-mode');
            elements.form.classList.add('view-mode');
            elements.btnEdit.innerHTML = '<i class="fas fa-edit"></i><span>Editar</span>';
            elements.btnEdit.classList.remove('btn-delete');
            elements.btnEdit.classList.add('btn-edit');
            elements.btnSave.disabled = true;
            if (modeIndicator) {
                modeIndicator.innerHTML = '<span><i class="fas fa-eye me-2"></i> <strong>Modo visualizacion</strong> — Presiona <strong>Editar</strong> para modificar datos</span><button type="button" class="btn btn-sm btn-success rounded-pill px-3" onclick="toggleEditMode()"><i class="fas fa-edit me-1"></i> Editar</button>';
                modeIndicator.style.background = '#eff6ff';
                modeIndicator.style.borderColor = '#bfdbfe';
                modeIndicator.className = 'alert alert-info py-2 px-3 mb-3 d-flex align-items-center justify-content-between';
            }

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

        // Incluir datos JSON de registro 24h y frecuencia de consumo
        // R24H-004: Use ficha's own collector, fallback to intake.js or hidden input
        if (typeof collectR24hDataFromFicha === 'function') {
            data.registro_24h = collectR24hDataFromFicha();
        } else if (typeof collect24hData === 'function') {
            data.registro_24h = collect24hData();
        } else {
            const registro24hInput = document.getElementById('registro_24h_data');
            if (registro24hInput && registro24hInput.value) {
                try {
                    data.registro_24h = JSON.parse(registro24hInput.value);
                } catch (e) {
                    console.warn('Error parsing registro_24h:', e);
                }
            }
        }

        if (typeof collectFrequencyData === 'function') {
            data.frecuencia_consumo = collectFrequencyData();
        } else {
            const frecuenciaInput = document.getElementById('frecuencia_consumo_data');
            if (frecuenciaInput && frecuenciaInput.value) {
                try {
                    data.frecuencia_consumo = JSON.parse(frecuenciaInput.value);
                } catch (e) {
                    console.warn('Error parsing frecuencia_consumo:', e);
                }
            }
        }
        
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

        if (getValue) getValue.value = get;
        if (summaryGET) summaryGET.textContent = get;
        
        // Recalcular macros con nuevo GET
        calcularMacros();
        
        markAsChanged();
        return get;
    };
    
    window.calcularMacros = function() {
        const getEl = document.getElementById('getValue');
        const get = parseFloat(getEl?.value || getEl?.textContent);
        
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
        if (patient.get_kcal) {
            const getEl = document.getElementById('getValue');
            if (getEl && getEl.tagName === 'INPUT') getEl.value = patient.get_kcal;
            else if (getEl) getEl.textContent = patient.get_kcal;
        }
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
    // GENERAR PAUTA ALIMENTARIA
    // ============================================

    window.generarPauta = async function() {
        const patientId = elements.patientId?.value;
        if (!patientId) {
            showToast('Error: No se encontro el ID del paciente', 'error');
            return;
        }

        // Show loading state
        const btnPauta = document.getElementById('btnPauta');
        const originalText = btnPauta.innerHTML;
        btnPauta.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Generando...</span>';
        btnPauta.disabled = true;

        try {
            const response = await fetch(`/api/generar-pauta/${patientId}`);
            const result = await response.json();

            if (result.success) {
                // Store pauta data
                const pauta = result.pauta;

                // Show pauta modal or redirect to pauta view
                showPautaModal(pauta);
                showToast('Pauta generada exitosamente', 'success');
            } else {
                throw new Error(result.error || 'Error generando pauta');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || 'Error generando pauta', 'error');
        } finally {
            btnPauta.innerHTML = originalText;
            btnPauta.disabled = false;
        }
    };

    function formatPautaPorcion(cantidad, medidaCasera) {
        if (!medidaCasera) return cantidad + ' porción';
        const medida = medidaCasera.trim();
        const match = medida.match(/^1\s+(.+)$/);
        if (match && cantidad !== 1) {
            let unidad = match[1];
            if (!unidad.endsWith('s') && cantidad > 1) {
                if (unidad.endsWith('z')) unidad = unidad.slice(0, -1) + 'ces';
                else unidad += 's';
            }
            return cantidad + ' ' + unidad;
        }
        if (cantidad > 1 && /^[½¼¾⅓⅔]/.test(medida)) return cantidad + ' × ' + medida;
        if (cantidad === 1) return medida;
        return cantidad + ' ' + medida;
    }

    function showPautaModal(pauta) {
        // Create modal to show pauta
        const config = pauta.configuracion_dieta || {};
        const reqs = pauta.requerimientos || {};
        const tiempos = pauta.tiempos_comida || {};

        let dietaInfo = '';
        if (config.es_vegano) {
            dietaInfo = '<span class="badge bg-success me-2"><i class="fas fa-leaf"></i> Vegano</span>';
        } else if (config.es_vegetariano) {
            dietaInfo = '<span class="badge bg-info me-2"><i class="fas fa-seedling"></i> Vegetariano</span>';
        }

        if (config.restricciones && config.restricciones.length > 0) {
            dietaInfo += config.restricciones.map(r => `<span class="badge bg-warning text-dark me-1">${r}</span>`).join('');
        }

        const TIEMPO_DISPLAY = {
            desayuno: 'Desayuno', colacion_am: 'Colación AM', almuerzo: 'Almuerzo',
            colacion_pm: 'Colación PM', cena: 'Cena'
        };
        const formatTiempo = t => TIEMPO_DISPLAY[t] || t;

        let tiemposInfo = '';
        if (tiempos.activos) {
            tiemposInfo = `<small class="text-muted">Tiempos activos: ${tiempos.activos.map(formatTiempo).join(', ')}</small>`;
        }
        if (tiempos.excluidos && tiempos.excluidos.length > 0) {
            tiemposInfo += `<br><small class="text-warning">Excluidos: ${tiempos.excluidos.map(formatTiempo).join(', ')}</small>`;
        }

        const modalHtml = `
            <div class="modal fade" id="pautaModal" tabindex="-1">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                            <h5 class="modal-title">
                                <i class="fas fa-utensils me-2"></i>
                                Pauta Alimentaria Semanal
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <strong>Configuracion:</strong>
                                    ${dietaInfo}
                                </div>
                                <div class="row">
                                    <div class="col-md-3"><strong>GET:</strong> ${reqs.get_kcal || '-'} kcal</div>
                                    <div class="col-md-3"><strong>Proteinas:</strong> ${reqs.proteinas_g || '-'}g</div>
                                    <div class="col-md-3"><strong>Carbohidratos:</strong> ${reqs.carbohidratos_g || '-'}g</div>
                                    <div class="col-md-3"><strong>Grasas:</strong> ${reqs.grasas_g || '-'}g</div>
                                </div>
                                ${tiemposInfo}
                            </div>

                            <ul class="nav nav-tabs" id="pautaTabs" role="tablist">
                                ${Object.keys(pauta.dias || {}).map((dia, i) => `
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link ${i === 0 ? 'active' : ''}" id="tab-${dia}" data-bs-toggle="tab"
                                            data-bs-target="#pane-${dia}" type="button" role="tab"
                                            style="color: ${i === 0 ? 'white' : '#166534'}; background: ${i === 0 ? '#10b981' : '#f0fdf4'}; border: 1px solid #a7f3d0; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 0.85rem;"
                                            onclick="this.parentElement.parentElement.querySelectorAll('.nav-link').forEach(t=>{t.style.background='#f0fdf4';t.style.color='#166534';}); this.style.background='#10b981'; this.style.color='white';">
                                            ${dia.charAt(0).toUpperCase() + dia.slice(1)}
                                        </button>
                                    </li>
                                `).join('')}
                            </ul>

                            <div class="tab-content mt-3" id="pautaTabContent">
                                ${Object.entries(pauta.dias || {}).map(([dia, diaData], i) => `
                                    <div class="tab-pane fade ${i === 0 ? 'show active' : ''}" id="pane-${dia}" role="tabpanel">
                                        ${Object.entries(diaData.tiempos || {}).sort(([a], [b]) => {
                                            const order = ['desayuno','colacion_am','colacion1','almuerzo','colacion_pm','colacion2','once','cena'];
                                            return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
                                        }).map(([tiempo, tiempoData]) => `
                                            <div class="card mb-3">
                                                <div class="card-header bg-light d-flex justify-content-between">
                                                    <strong>${tiempoData.nombre}</strong>
                                                    <span class="badge bg-primary">${tiempoData.totales?.kcal || 0} kcal</span>
                                                </div>
                                                <div class="card-body p-2">
                                                    <table class="table table-sm table-striped mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th>Alimento</th>
                                                                <th>Porcion</th>
                                                                <th class="text-end">Kcal</th>
                                                                <th class="text-end">Prot</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${(tiempoData.alimentos || []).map((a, aIdx) => {
                                                                const porcion = formatPautaPorcion(a.cantidad, a.medida_casera);
                                                                return `
                                                                <tr ${a.es_preferido ? 'class="table-success"' : ''} data-dia="${dia}" data-tiempo="${tiempo}" data-idx="${aIdx}">
                                                                    <td><input type="text" class="form-control form-control-sm pauta-edit-field" value="${a.nombre}" style="display:none;" data-field="nombre"><span class="pauta-display">${a.nombre}</span> ${a.es_preferido ? '<i class="fas fa-star text-warning" title="Preferido del paciente"></i>' : ''}</td>
                                                                    <td><input type="text" class="form-control form-control-sm pauta-edit-field" value="${porcion}" style="display:none;" data-field="porcion"><span class="pauta-display">${porcion}</span></td>
                                                                    <td class="text-end">${Math.round(a.kcal)}</td>
                                                                    <td class="text-end">${a.proteinas?.toFixed(1) || 0}g</td>
                                                                    <td class="text-end"><button class="btn btn-sm btn-outline-danger pauta-edit-btn" onclick="this.closest('tr').remove()" style="display:none;" title="Eliminar"><i class="fas fa-times"></i></button></td>
                                                                </tr>`;
                                                            }).join('')}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        `).join('')}
                                        <div class="alert alert-secondary">
                                            <strong>Total del dia:</strong>
                                            ${diaData.totales?.kcal || 0} kcal |
                                            ${diaData.totales?.proteinas || 0}g prot |
                                            ${diaData.totales?.carbohidratos || 0}g carbs |
                                            ${diaData.totales?.lipidos || 0}g lip
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-warning" onclick="togglePautaEdit()">
                                <i class="fas fa-edit me-2"></i>Editar Pauta
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="guardarPauta(${JSON.stringify(pauta).replace(/"/g, '&quot;')})">
                                <i class="fas fa-save me-2"></i>Guardar Pauta
                            </button>
                            <button type="button" class="btn btn-success" onclick="window.print()">
                                <i class="fas fa-print me-2"></i>Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        document.getElementById('pautaModal')?.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('pautaModal'));
        modal.show();
    }

    // BUG-004: Toggle edit mode for pauta (enhanced with food DB autocomplete)
    window.togglePautaEdit = function() {
        const modal = document.getElementById('pautaModal');
        if (!modal) return;
        const editing = modal.dataset.editing === 'true';
        modal.dataset.editing = editing ? 'false' : 'true';
        modal.querySelectorAll('.pauta-edit-field, .pauta-edit-btn').forEach(el => el.style.display = editing ? 'none' : '');
        modal.querySelectorAll('.pauta-display').forEach(el => el.style.display = editing ? '' : 'none');

        // Attach food autocomplete to nombre fields when entering edit mode
        if (!editing) {
            modal.querySelectorAll('.pauta-edit-field[data-field="nombre"]').forEach(input => {
                if (input._pautaAutocomplete) return; // already attached
                input._pautaAutocomplete = true;
                const wrapper = input.parentElement;
                wrapper.style.position = 'relative';
                let dropdown = wrapper.querySelector('.pauta-food-dropdown');
                if (!dropdown) {
                    dropdown = document.createElement('div');
                    dropdown.className = 'pauta-food-dropdown position-absolute w-100';
                    dropdown.style.cssText = 'z-index:1060; display:none; max-height:200px; overflow-y:auto; background:#fff; border:1px solid #e2e8f0; border-radius:0 0 8px 8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); left:0; top:100%;';
                    wrapper.appendChild(dropdown);
                }
                let timer;
                input.addEventListener('input', function() {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        if (typeof searchR24hFoods !== 'function' || !this.value || this.value.length < 2) {
                            dropdown.style.display = 'none';
                            return;
                        }
                        const results = searchR24hFoods(this.value);
                        if (!results.length) { dropdown.style.display = 'none'; return; }
                        dropdown.innerHTML = results.map(f => `
                            <div class="px-3 py-2" style="cursor:pointer; border-bottom:1px solid #f1f5f9; font-size:0.85rem;"
                                 data-nombre="${f.nombre}" data-kcal="${f.kcal}" data-medida="${f.medida_casera}">
                                <div style="font-weight:500;">${f.nombre}</div>
                                <div style="color:#94a3b8; font-size:0.7rem;">${f.grupo.replace(/_/g,' ')} · ${f.medida_casera} · ${f.kcal} kcal</div>
                            </div>
                        `).join('');
                        dropdown.style.display = 'block';
                        dropdown.querySelectorAll('[data-nombre]').forEach(item => {
                            item.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                input.value = item.dataset.nombre;
                                // Update porcion field in same row if exists
                                const row = input.closest('tr');
                                const porcionInput = row?.querySelector('.pauta-edit-field[data-field="porcion"]');
                                if (porcionInput) porcionInput.value = item.dataset.medida;
                                // Update kcal display
                                const kcalCell = row?.children[2];
                                if (kcalCell) kcalCell.textContent = Math.round(item.dataset.kcal);
                                dropdown.style.display = 'none';
                            });
                        });
                    }, 200);
                });
                input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
            });
        }
    };

    window.guardarPauta = async function(pauta) {
        const patientId = elements.patientId?.value;
        if (!patientId) return;

        try {
            const response = await fetch(`/api/guardar-pauta/${patientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pauta: pauta })
            });

            const result = await response.json();
            if (result.success) {
                showToast('Pauta guardada exitosamente', 'success');
            } else {
                throw new Error(result.error || 'Error guardando pauta');
            }
        } catch (error) {
            showToast(error.message || 'Error guardando pauta', 'error');
        }
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
    
    // PAUTA-004: Manual meal plan creation
    window.abrirPautaManual = function() {
        const TIEMPOS = ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena'];
        const NOMBRES = {desayuno:'Desayuno', colacion_am:'Colación AM', almuerzo:'Almuerzo', colacion_pm:'Colación PM', cena:'Cena'};

        let tiemposHTML = TIEMPOS.map(t => `
            <div class="card mb-3">
                <div class="card-header bg-light"><strong>${NOMBRES[t]}</strong></div>
                <div class="card-body p-2">
                    <table class="table table-sm mb-0"><thead><tr><th>Alimento</th><th>Porción</th><th>Kcal</th><th>Prot (g)</th><th>Carbs (g)</th><th>Grasas (g)</th><th></th></tr></thead>
                    <tbody id="manual-${t}"></tbody></table>
                    <button type="button" class="btn btn-sm btn-outline-success mt-1" onclick="agregarAlimentoManual('${t}')"><i class="fas fa-plus me-1"></i>Agregar</button>
                </div>
            </div>`).join('');

        const modalHtml = `
            <div class="modal fade" id="pautaManualModal" tabindex="-1">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header" style="background:linear-gradient(135deg,#10b981,#059669);color:white;">
                            <h5 class="modal-title"><i class="fas fa-edit me-2"></i>Crear Pauta Manual</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">${tiemposHTML}</div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-info" onclick="alert('Función IA: Proyectar semana con variaciones basadas en esta pauta. Próximamente.')"><i class="fas fa-magic me-2"></i>Proyectar Semana (IA)</button>
                            <button type="button" class="btn btn-primary" onclick="guardarPautaManual()"><i class="fas fa-save me-2"></i>Guardar</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.getElementById('pautaManualModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        new bootstrap.Modal(document.getElementById('pautaManualModal')).show();
    };

    window.agregarAlimentoManual = function(tiempo) {
        const tbody = document.getElementById(`manual-${tiempo}`);
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><input type="text" class="form-control form-control-sm" placeholder="Nombre"></td>
                <td><input type="text" class="form-control form-control-sm" placeholder="Ej: 1 taza"></td>
                <td><input type="number" class="form-control form-control-sm" placeholder="0"></td>
                <td><input type="number" class="form-control form-control-sm" placeholder="0"></td>
                <td><input type="number" class="form-control form-control-sm" placeholder="0"></td>
                <td><input type="number" class="form-control form-control-sm" placeholder="0"></td>
                <td><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()"><i class="fas fa-times"></i></button></td>
            </tr>`);
    };

    window.guardarPautaManual = async function() {
        const patientId = elements.patientId?.value;
        if (!patientId) return;
        const TIEMPOS = ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena'];
        const pauta = { dias: { lunes: { tiempos: {} } }, requerimientos: {} };

        TIEMPOS.forEach(t => {
            const rows = document.querySelectorAll(`#manual-${t} tr`);
            const alimentos = [];
            rows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                if (inputs[0]?.value) {
                    alimentos.push({
                        nombre: inputs[0].value, medida_casera: inputs[1].value,
                        kcal: parseFloat(inputs[2].value)||0, proteinas: parseFloat(inputs[3].value)||0,
                        carbohidratos: parseFloat(inputs[4].value)||0, lipidos: parseFloat(inputs[5].value)||0
                    });
                }
            });
            if (alimentos.length > 0) {
                const totKcal = alimentos.reduce((s,a) => s + a.kcal, 0);
                pauta.dias.lunes.tiempos[t] = { nombre: t, alimentos, totales: { kcal: totKcal } };
            }
        });

        try {
            await guardarPauta(pauta);
            bootstrap.Modal.getInstance(document.getElementById('pautaManualModal'))?.hide();
        } catch(e) { console.error(e); }
    };

})();