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

        // EFC-OBS: Collect frequency comments from the ficha and merge into frecuencia_consumo
        const freqCommentInputs = document.querySelectorAll('.freq-comment-input');
        if (freqCommentInputs.length > 0) {
            const freqContainer = document.getElementById('frecuenciaConsumoContainer');
            // If frecuencia_consumo not already set from above, load from the container data attribute
            if (!data.frecuencia_consumo && freqContainer) {
                try {
                    data.frecuencia_consumo = JSON.parse(freqContainer.dataset.freq || '{}');
                } catch(e) { data.frecuencia_consumo = {}; }
            }
            if (data.frecuencia_consumo && typeof data.frecuencia_consumo === 'object') {
                const comments = {};
                freqCommentInputs.forEach(input => {
                    const key = input.dataset.freqKey;
                    const val = input.value.trim();
                    if (key && val) comments[key] = val;
                });
                if (Object.keys(comments).length > 0) {
                    data.frecuencia_consumo._comments = comments;
                } else {
                    delete data.frecuencia_consumo._comments;
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

                // Tag all AI-generated items with source
                Object.values(pauta.dias || {}).forEach(dia => {
                    Object.values(dia.tiempos || {}).forEach(tiempo => {
                        (tiempo.alimentos || []).forEach(a => { a.source = a.source || 'ia'; });
                    });
                });

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
                            <h5 class="modal-title" style="color: white !important;">
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

                            <ul class="nav nav-tabs" id="pautaTabs" role="tablist" style="border-bottom: 2px solid #10b981;">
                                ${['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].filter(d => (pauta.dias || {})[d]).map((dia, i) => `
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="tab-${dia}" data-bs-toggle="tab"
                                            data-bs-target="#pane-${dia}" type="button" role="tab"
                                            style="color: ${i === 0 ? '#ffffff' : '#166534'} !important; background: ${i === 0 ? '#10b981' : '#f0fdf4'} !important; border: 1px solid #a7f3d0 !important; border-radius: 8px 8px 0 0; font-weight: 700; font-size: 0.9rem; padding: 0.6rem 1.2rem; margin-right: 4px;"
                                            onclick="this.parentElement.parentElement.querySelectorAll('.nav-link').forEach(t=>{t.style.setProperty('background','#f0fdf4','important');t.style.setProperty('color','#166534','important');}); this.style.setProperty('background','#10b981','important'); this.style.setProperty('color','#ffffff','important');">
                                            ${dia.charAt(0).toUpperCase() + dia.slice(1)}
                                        </button>
                                    </li>
                                `).join('')}
                            </ul>

                            <div class="tab-content mt-3" id="pautaTabContent">
                                ${['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].filter(d => (pauta.dias || {})[d]).map((dia, i) => [dia, pauta.dias[dia]]).map(([dia, diaData], i) => `
                                    <div class="tab-pane fade ${i === 0 ? 'show active' : ''}" id="pane-${dia}" role="tabpanel">
                                        ${Object.entries(diaData.tiempos || {}).sort(([a], [b]) => {
                                            const order = ['desayuno','colacion_am','colacion1','almuerzo','colacion_pm','colacion2','once','cena'];
                                            return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
                                        }).map(([tiempo, tiempoData]) => `
                                            <div class="card mb-3">
                                                <div class="card-header d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-bottom: 1px solid #bbf7d0;">
                                                    <strong style="color:#166534;">${tiempoData.nombre}</strong>
                                                    <div>
                                                        <span class="badge" style="background:#10b981; color:white;">${tiempoData.totales?.kcal || 0} kcal</span>
                                                        <span style="font-size:0.65rem; color:#64748b; margin-left:4px;">P:${tiempoData.totales?.proteinas?.toFixed(0) || 0}g C:${tiempoData.totales?.carbohidratos?.toFixed(0) || 0}g G:${tiempoData.totales?.lipidos?.toFixed(0) || 0}g</span>
                                                    </div>
                                                </div>
                                                <div class="card-body p-2">
                                                    <table class="table table-sm table-striped mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th>Alimento</th>
                                                                <th>Porcion</th>
                                                                <th class="text-end">Kcal</th>
                                                                <th class="text-end">Prot</th>
                                                                <th class="text-end">Carbs</th>
                                                                <th class="text-end">Grasas</th>
                                                                <th></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${(tiempoData.alimentos || []).map((a, aIdx) => {
                                                                const porcion = formatPautaPorcion(a.cantidad, a.medida_casera);
                                                                const srcBadge = a.source === 'manual'
                                                                    ? '<span class="badge bg-success ms-1" style="font-size:0.6rem;">Manual</span>'
                                                                    : (a.source === 'ia' ? '<span class="badge bg-info ms-1" style="font-size:0.6rem;">IA</span>' : '');
                                                                return `
                                                                <tr ${a.es_preferido ? 'class="table-success"' : ''} data-dia="${dia}" data-tiempo="${tiempo}" data-idx="${aIdx}">
                                                                    <td><span>${a.nombre}</span>${srcBadge} ${a.es_preferido ? '<i class="fas fa-star text-warning"></i>' : ''}</td>
                                                                    <td>${porcion}</td>
                                                                    <td class="text-end">${Math.round(a.kcal)}</td>
                                                                    <td class="text-end">${a.proteinas?.toFixed(1) || 0}g</td>
                                                                    <td class="text-end">${a.carbohidratos?.toFixed(1) || 0}g</td>
                                                                    <td class="text-end">${a.lipidos?.toFixed(1) || 0}g</td>
                                                                    <td>
                                                                        <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarAlimentoPauta('${dia}','${tiempo}',${aIdx})" title="Eliminar"><i class="fas fa-times"></i></button>
                                                                    </td>
                                                                </tr>`;
                                                            }).join('')}
                                                        </tbody>
                                                    </table>
                                                    <div class="p-2">
                                                        <div class="input-group input-group-sm">
                                                            <span class="input-group-text"><i class="fas fa-plus"></i></span>
                                                            <input type="text" class="form-control pauta-add-food-input" placeholder="Buscar alimento para agregar..." data-dia="${dia}" data-tiempo="${tiempo}">
                                                        </div>
                                                        <div class="pauta-add-food-results" style="display:none; max-height:180px; overflow-y:auto; background:#fff; border:1px solid #e2e8f0; border-radius:0 0 8px 8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);"></div>
                                                    </div>
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
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn" style="background:#059669; color:white;" onclick="guardarPautaDesdeModal()">
                                <i class="fas fa-save me-2"></i>Guardar Pauta
                            </button>
                            <button type="button" class="btn" style="background:#0891b2; color:white;" onclick="window.print()">
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
        const pautaModalEl = document.getElementById('pautaModal');
        // Store pauta data on the modal element for later reference
        pautaModalEl._pautaData = JSON.parse(JSON.stringify(pauta));
        const modal = new bootstrap.Modal(pautaModalEl);
        modal.show();

        // Wire up inline food search inputs for adding manual items
        setTimeout(() => {
            pautaModalEl.querySelectorAll('.pauta-add-food-input').forEach(input => {
                const resultsDiv = input.parentElement.nextElementSibling;
                let timer;
                input.addEventListener('input', function() {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        if (typeof searchR24hFoods !== 'function' || !this.value || this.value.length < 2) {
                            resultsDiv.style.display = 'none'; return;
                        }
                        const results = searchR24hFoods(this.value);
                        if (!results.length) { resultsDiv.style.display = 'none'; return; }
                        resultsDiv.innerHTML = results.map((f, i) => `
                            <div class="pauta-add-food-item px-3 py-2" style="cursor:pointer; border-bottom:1px solid #f1f5f9; font-size:0.85rem;" data-idx="${i}">
                                <div style="font-weight:500;">${f.nombre}</div>
                                <div style="color:#94a3b8; font-size:0.7rem;">
                                    <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem;">${f.grupo.replace(/_/g,' ')}</span>
                                    ${f.medida_casera} · ${f.kcal} kcal · P:${f.proteinas}g C:${f.carbohidratos}g G:${f.lipidos}g
                                </div>
                            </div>
                        `).join('');
                        resultsDiv._results = results;
                        resultsDiv.style.display = 'block';
                    }, 200);
                });
                input.addEventListener('blur', () => setTimeout(() => { resultsDiv.style.display = 'none'; }, 200));
                resultsDiv.addEventListener('mousedown', function(e) {
                    const item = e.target.closest('.pauta-add-food-item');
                    if (!item) return;
                    e.preventDefault();
                    const food = resultsDiv._results[parseInt(item.dataset.idx)];
                    if (!food) return;
                    const dia = input.dataset.dia;
                    const tiempo = input.dataset.tiempo;
                    agregarAlimentoAPauta(dia, tiempo, {
                        nombre: food.nombre, medida_casera: food.medida_casera,
                        cantidad: 1, kcal: food.kcal, proteinas: food.proteinas,
                        carbohidratos: food.carbohidratos, lipidos: food.lipidos,
                        source: 'manual'
                    });
                    input.value = '';
                    resultsDiv.style.display = 'none';
                });
            });
        }, 300);
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
                // Close any open modal and remove backdrop
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    const bsModal = bootstrap.Modal.getInstance(openModal);
                    if (bsModal) bsModal.hide();
                    else {
                        openModal.classList.remove('show');
                        openModal.style.display = 'none';
                    }
                }
                // Remove any leftover backdrop
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
                // Reload to show saved pauta in ficha
                setTimeout(() => location.reload(), 500);
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
            <div class="card mb-3" style="border: 1px solid #e2e8f0; border-radius: 12px;">
                <div class="card-header d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-bottom: 1px solid #bbf7d0; padding: 0.75rem 1rem;">
                    <h6 class="mb-0" style="font-weight:600; color:#166534;"><i class="fas fa-utensils me-2"></i>${NOMBRES[t]}</h6>
                    <div class="d-flex gap-2 align-items-center">
                        <span class="badge manual-meal-total" id="manual-total-${t}" style="background:#10b981; color:white;">0 kcal</span>
                        <button type="button" class="btn btn-sm btn-outline-success" onclick="agregarAlimentoManual('${t}')"><i class="fas fa-plus me-1"></i>Agregar</button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <table class="table table-sm mb-0" style="font-size:0.875rem;">
                        <thead style="background:#f8fafc;">
                            <tr>
                                <th style="padding:0.5rem; font-weight:600; color:#64748b; width:30%;">Alimento</th>
                                <th style="padding:0.5rem; font-weight:600; color:#64748b; width:20%;">Grupo</th>
                                <th style="padding:0.5rem; font-weight:600; color:#64748b; width:12%;">Cantidad</th>
                                <th style="padding:0.5rem; font-weight:600; color:#64748b; width:20%;">Medida</th>
                                <th style="padding:0.5rem; font-weight:600; color:#64748b; width:13%;">Kcal</th>
                                <th style="padding:0.5rem; width:5%;"></th>
                            </tr>
                        </thead>
                        <tbody id="manual-${t}"></tbody>
                    </table>
                </div>
            </div>`).join('');

        const modalHtml = `
            <div class="modal fade" id="pautaManualModal" tabindex="-1">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header" style="background:linear-gradient(135deg,#10b981,#059669);color:white;">
                            <h5 class="modal-title" style="color: white !important;"><i class="fas fa-edit me-2"></i>Crear Pauta Manual</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">${tiemposHTML}</div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn" style="background:#10b981; color:white;" onclick="complementarConIA()"><i class="fas fa-magic me-2"></i>Complementar con IA</button>
                            <button type="button" class="btn" style="background:#059669; color:white;" onclick="guardarPautaManual()"><i class="fas fa-save me-2"></i>Guardar Pauta</button>
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
        const tr = document.createElement('tr');
        tr.className = 'pauta-manual-row';
        tr.innerHTML = `
            <td style="padding:0.4rem; position:relative;">
                <input type="text" class="form-control form-control-sm pauta-manual-alimento" placeholder="Buscar alimento...">
                <div class="pauta-manual-results" style="display:none; position:absolute; left:0; top:100%; z-index:1050; width:100%; max-height:200px; overflow-y:auto; background:white; border:1px solid #e2e8f0; border-radius:0 0 8px 8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);"></div>
            </td>
            <td style="padding:0.4rem;">
                <input type="text" class="form-control form-control-sm pauta-manual-grupo" placeholder="Grupo" readonly style="background:#f1f5f9;">
            </td>
            <td style="padding:0.4rem;">
                <input type="number" class="form-control form-control-sm pauta-manual-cantidad" value="1" min="0.25" step="0.25" data-base-kcal="0" data-base-prot="0" data-base-carbs="0" data-base-fat="0"
                    oninput="
                        const tr=this.closest('tr');
                        const qty=parseFloat(this.value)||1;
                        const bk=parseFloat(this.dataset.baseKcal)||0;
                        const bp=parseFloat(this.dataset.baseProt)||0;
                        const bc=parseFloat(this.dataset.baseCarbs)||0;
                        const bf=parseFloat(this.dataset.baseFat)||0;
                        tr.querySelector('.pauta-manual-kcal').textContent=Math.round(bk*qty);
                        tr.querySelector('.pauta-manual-kcal').dataset.val=Math.round(bk*qty);
                        tr.querySelector('.pauta-manual-prot').dataset.val=(bp*qty).toFixed(1);
                        tr.querySelector('.pauta-manual-carbs').dataset.val=(bc*qty).toFixed(1);
                        tr.querySelector('.pauta-manual-fat').dataset.val=(bf*qty).toFixed(1);
                        updateManualMealTotal('${tiempo}');">
            </td>
            <td style="padding:0.4rem;">
                <input type="text" class="form-control form-control-sm pauta-manual-medida" placeholder="Seleccionar alimento primero" readonly style="background:#f1f5f9; cursor:not-allowed;">
            </td>
            <td style="padding:0.4rem;">
                <span class="pauta-manual-kcal badge bg-light text-dark" data-val="0">0</span>
                <span class="pauta-manual-prot" data-val="0" style="display:none;">0</span>
                <span class="pauta-manual-carbs" data-val="0" style="display:none;">0</span>
                <span class="pauta-manual-fat" data-val="0" style="display:none;">0</span>
            </td>
            <td style="padding:0.4rem;">
                <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="this.closest('tr').remove(); updateManualMealTotal('${tiempo}');" title="Eliminar"><i class="fas fa-times"></i></button>
            </td>`;
        tbody.appendChild(tr);

        // Wire food DB search
        const input = tr.querySelector('.pauta-manual-alimento');
        const resultsDiv = tr.querySelector('.pauta-manual-results');
        let searchTimeout;

        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (typeof searchR24hFoods === 'function') {
                    const results = searchR24hFoods(this.value);
                    if (!results.length) { resultsDiv.style.display = 'none'; return; }
                    resultsDiv.innerHTML = results.map((food, i) => `
                        <div class="pauta-manual-food-item px-3 py-2" style="cursor:pointer; border-bottom:1px solid #f1f5f9; font-size:0.875rem;" data-idx="${i}">
                            <div style="font-weight:500;">${food.nombre}</div>
                            <div style="color:#94a3b8; font-size:0.75rem;">
                                <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem;">${food.grupo.replace(/_/g, ' ')}</span>
                                ${food.medida_casera} &middot; ${food.kcal} kcal
                            </div>
                        </div>
                    `).join('');
                    resultsDiv._results = results;
                    resultsDiv.style.display = 'block';
                }
            }, 200);
        });

        input.addEventListener('blur', function() {
            setTimeout(() => { resultsDiv.style.display = 'none'; }, 200);
        });

        resultsDiv.addEventListener('mousedown', function(e) {
            const item = e.target.closest('.pauta-manual-food-item');
            if (!item) return;
            e.preventDefault();
            const idx = parseInt(item.dataset.idx);
            const food = resultsDiv._results[idx];
            if (!food) return;
            input.value = food.nombre;
            tr.querySelector('.pauta-manual-grupo').value = food.grupo.replace(/_/g, ' ');
            tr.querySelector('.pauta-manual-medida').value = food.medida_casera || '';
            const cantInput = tr.querySelector('.pauta-manual-cantidad');
            cantInput.dataset.baseKcal = food.kcal || 0;
            cantInput.dataset.baseProt = food.proteinas || 0;
            cantInput.dataset.baseCarbs = food.carbohidratos || 0;
            cantInput.dataset.baseFat = food.lipidos || 0;
            // Trigger recalc with current qty
            cantInput.dispatchEvent(new Event('input'));
            resultsDiv.style.display = 'none';
        });

        input.focus();
    };

    // Update per-meal kcal badge in manual pauta
    window.updateManualMealTotal = function(tiempo) {
        const tbody = document.getElementById(`manual-${tiempo}`);
        if (!tbody) return;
        let totalKcal = 0;
        tbody.querySelectorAll('tr').forEach(row => {
            const kcalSpan = row.querySelector('.pauta-manual-kcal');
            if (kcalSpan) totalKcal += parseFloat(kcalSpan.dataset.val || kcalSpan.textContent) || 0;
        });
        const badge = document.getElementById(`manual-total-${tiempo}`);
        if (badge) badge.textContent = Math.round(totalKcal) + ' kcal';
    };

    // ============================================
    // PAUTA: Merge, delete, complement functions
    // ============================================

    function mergeManualWithIA(manualPauta, iaPauta) {
        const merged = JSON.parse(JSON.stringify(manualPauta));
        for (const [dia, diaData] of Object.entries(iaPauta.dias || {})) {
            if (!merged.dias[dia]) merged.dias[dia] = { tiempos: {} };
            for (const [tiempo, tiempoData] of Object.entries(diaData.tiempos || {})) {
                if (!merged.dias[dia].tiempos[tiempo]) {
                    merged.dias[dia].tiempos[tiempo] = { nombre: tiempoData.nombre || tiempo, alimentos: [], totales: {} };
                }
                const existing = merged.dias[dia].tiempos[tiempo].alimentos;
                const existingNames = new Set(existing.map(a => a.nombre.toLowerCase()));
                for (const alimento of (tiempoData.alimentos || [])) {
                    if (!existingNames.has(alimento.nombre.toLowerCase())) {
                        alimento.source = 'ia';
                        existing.push(alimento);
                    }
                }
                const totales = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
                existing.forEach(a => {
                    totales.kcal += a.kcal || 0;
                    totales.proteinas += a.proteinas || 0;
                    totales.carbohidratos += a.carbohidratos || 0;
                    totales.lipidos += a.lipidos || 0;
                });
                merged.dias[dia].tiempos[tiempo].totales = totales;
            }
        }
        return merged;
    }

    window.eliminarAlimentoPauta = function(dia, tiempo, idx) {
        const pautaModal = document.getElementById('pautaModal');
        if (!pautaModal || !pautaModal._pautaData) return;
        const pauta = pautaModal._pautaData;
        if (pauta.dias[dia] && pauta.dias[dia].tiempos[tiempo]) {
            const alimentos = pauta.dias[dia].tiempos[tiempo].alimentos;
            if (idx >= 0 && idx < alimentos.length) {
                alimentos.splice(idx, 1);
                // Recalculate totals for this tiempo
                const totales = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
                alimentos.forEach(a => {
                    totales.kcal += a.kcal || 0;
                    totales.proteinas += a.proteinas || 0;
                    totales.carbohidratos += a.carbohidratos || 0;
                    totales.lipidos += a.lipidos || 0;
                });
                pauta.dias[dia].tiempos[tiempo].totales = totales;
                // Recalculate day totals
                const dayTotals = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
                Object.values(pauta.dias[dia].tiempos).forEach(t => {
                    dayTotals.kcal += t.totales?.kcal || 0;
                    dayTotals.proteinas += t.totales?.proteinas || 0;
                    dayTotals.carbohidratos += t.totales?.carbohidratos || 0;
                    dayTotals.lipidos += t.totales?.lipidos || 0;
                });
                pauta.dias[dia].totales = dayTotals;
            }
        }
        // Re-render modal with updated data
        document.getElementById('pautaModal')?.remove();
        showPautaModal(pauta);
    };

    window.agregarAlimentoAPauta = function(dia, tiempo, food) {
        const pautaModal = document.getElementById('pautaModal');
        if (!pautaModal || !pautaModal._pautaData) return;
        const pauta = pautaModal._pautaData;
        if (!pauta.dias[dia]) pauta.dias[dia] = { tiempos: {} };
        if (!pauta.dias[dia].tiempos[tiempo]) {
            pauta.dias[dia].tiempos[tiempo] = { nombre: tiempo, alimentos: [], totales: {} };
        }
        pauta.dias[dia].tiempos[tiempo].alimentos.push(food);
        // Recalculate totals
        const totales = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
        pauta.dias[dia].tiempos[tiempo].alimentos.forEach(a => {
            totales.kcal += a.kcal || 0;
            totales.proteinas += a.proteinas || 0;
            totales.carbohidratos += a.carbohidratos || 0;
            totales.lipidos += a.lipidos || 0;
        });
        pauta.dias[dia].tiempos[tiempo].totales = totales;
        // Recalculate day totals
        const dayTotals = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
        Object.values(pauta.dias[dia].tiempos).forEach(t => {
            dayTotals.kcal += t.totales?.kcal || 0;
            dayTotals.proteinas += t.totales?.proteinas || 0;
            dayTotals.carbohidratos += t.totales?.carbohidratos || 0;
            dayTotals.lipidos += t.totales?.lipidos || 0;
        });
        pauta.dias[dia].totales = dayTotals;
        // Re-render
        document.getElementById('pautaModal')?.remove();
        showPautaModal(pauta);
    };

    window.guardarPautaDesdeModal = function() {
        const pautaModal = document.getElementById('pautaModal');
        if (!pautaModal || !pautaModal._pautaData) return;
        guardarPauta(pautaModal._pautaData);
    };

    window.complementarConIA = async function() {
        const patientId = elements.patientId?.value;
        if (!patientId) { showToast('Error: No se encontro el ID del paciente', 'error'); return; }

        // 1. Build the manual pauta from the current form (new structure)
        const TIEMPOS = ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena'];
        const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const tiemposData = {};

        TIEMPOS.forEach(t => {
            const rows = document.querySelectorAll(`#manual-${t} tr.pauta-manual-row`);
            const alimentos = [];
            rows.forEach(row => {
                const nombre = row.querySelector('.pauta-manual-alimento')?.value?.trim();
                if (!nombre) return;
                alimentos.push({
                    nombre: nombre,
                    grupo: row.querySelector('.pauta-manual-grupo')?.value || '',
                    cantidad: parseFloat(row.querySelector('.pauta-manual-cantidad')?.value) || 1,
                    medida_casera: row.querySelector('.pauta-manual-medida')?.value || '',
                    kcal: parseFloat(row.querySelector('.pauta-manual-kcal')?.dataset.val) || 0,
                    proteinas: parseFloat(row.querySelector('.pauta-manual-prot')?.dataset.val) || 0,
                    carbohidratos: parseFloat(row.querySelector('.pauta-manual-carbs')?.dataset.val) || 0,
                    lipidos: parseFloat(row.querySelector('.pauta-manual-fat')?.dataset.val) || 0,
                    source: 'manual'
                });
            });
            if (alimentos.length > 0) {
                const totales = {
                    kcal: Math.round(alimentos.reduce((s, a) => s + a.kcal, 0)),
                    proteinas: Math.round(alimentos.reduce((s, a) => s + a.proteinas, 0) * 10) / 10,
                    carbohidratos: Math.round(alimentos.reduce((s, a) => s + a.carbohidratos, 0) * 10) / 10,
                    lipidos: Math.round(alimentos.reduce((s, a) => s + a.lipidos, 0) * 10) / 10
                };
                tiemposData[t] = { nombre: t, alimentos, totales };
            }
        });

        // Apply to all 7 days
        const dias = {};
        DIAS.forEach(dia => {
            const dayTotals = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
            Object.values(tiemposData).forEach(td => {
                dayTotals.kcal += td.totales.kcal;
                dayTotals.proteinas += td.totales.proteinas;
                dayTotals.carbohidratos += td.totales.carbohidratos;
                dayTotals.lipidos += td.totales.lipidos;
            });
            dias[dia] = { tiempos: JSON.parse(JSON.stringify(tiemposData)), totales: dayTotals };
        });
        const manualPauta = { dias, requerimientos: {} };

        // 2. Save manual first
        try {
            await guardarPauta(manualPauta);
        } catch(e) {
            showToast('Error guardando pauta manual: ' + e.message, 'error');
            return;
        }

        // 3. Call AI to generate suggestions
        const btnIA = document.querySelector('#pautaManualModal .btn-info');
        const originalText = btnIA ? btnIA.innerHTML : '';
        if (btnIA) { btnIA.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando IA...'; btnIA.disabled = true; }

        try {
            const response = await fetch(`/api/generar-pauta/${patientId}`);
            const result = await response.json();

            if (result.success) {
                const iaPauta = result.pauta;
                // Tag IA items
                Object.values(iaPauta.dias || {}).forEach(dia => {
                    Object.values(dia.tiempos || {}).forEach(tiempo => {
                        (tiempo.alimentos || []).forEach(a => { a.source = a.source || 'ia'; });
                    });
                });

                // 4. Merge manual + IA
                const merged = mergeManualWithIA(manualPauta, iaPauta);
                // Preserve configuracion and requerimientos from AI response
                merged.configuracion_dieta = iaPauta.configuracion_dieta || {};
                merged.requerimientos = iaPauta.requerimientos || {};
                merged.tiempos_comida = iaPauta.tiempos_comida || {};

                // 5. Close manual modal and show merged result in the main pauta modal
                bootstrap.Modal.getInstance(document.getElementById('pautaManualModal'))?.hide();
                showPautaModal(merged);
                showToast('Pauta complementada con IA exitosamente', 'success');
            } else {
                throw new Error(result.error || 'Error generando pauta IA');
            }
        } catch(error) {
            console.error('Error complementar IA:', error);
            showToast(error.message || 'Error generando pauta IA', 'error');
        } finally {
            if (btnIA) { btnIA.innerHTML = originalText; btnIA.disabled = false; }
        }
    };

    window.guardarPautaManual = async function() {
        const patientId = elements.patientId?.value;
        if (!patientId) return;
        const TIEMPOS = ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena'];
        const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

        // Build pauta for ALL days (same meals each day — manual pauta is weekly template)
        const dias = {};
        const tiemposData = {};

        TIEMPOS.forEach(t => {
            const rows = document.querySelectorAll(`#manual-${t} tr.pauta-manual-row`);
            const alimentos = [];
            rows.forEach(row => {
                const nombre = row.querySelector('.pauta-manual-alimento')?.value?.trim();
                if (!nombre) return;
                alimentos.push({
                    nombre: nombre,
                    grupo: row.querySelector('.pauta-manual-grupo')?.value || '',
                    cantidad: parseFloat(row.querySelector('.pauta-manual-cantidad')?.value) || 1,
                    medida_casera: row.querySelector('.pauta-manual-medida')?.value || '',
                    kcal: parseFloat(row.querySelector('.pauta-manual-kcal')?.dataset.val) || 0,
                    proteinas: parseFloat(row.querySelector('.pauta-manual-prot')?.dataset.val) || 0,
                    carbohidratos: parseFloat(row.querySelector('.pauta-manual-carbs')?.dataset.val) || 0,
                    lipidos: parseFloat(row.querySelector('.pauta-manual-fat')?.dataset.val) || 0,
                    source: 'manual'
                });
            });
            if (alimentos.length > 0) {
                const totales = {
                    kcal: Math.round(alimentos.reduce((s, a) => s + a.kcal, 0)),
                    proteinas: Math.round(alimentos.reduce((s, a) => s + a.proteinas, 0) * 10) / 10,
                    carbohidratos: Math.round(alimentos.reduce((s, a) => s + a.carbohidratos, 0) * 10) / 10,
                    lipidos: Math.round(alimentos.reduce((s, a) => s + a.lipidos, 0) * 10) / 10
                };
                tiemposData[t] = { nombre: t, alimentos, totales };
            }
        });

        // Apply to all 7 days
        DIAS.forEach(dia => {
            const dayTotals = { kcal: 0, proteinas: 0, carbohidratos: 0, lipidos: 0 };
            Object.values(tiemposData).forEach(td => {
                dayTotals.kcal += td.totales.kcal;
                dayTotals.proteinas += td.totales.proteinas;
                dayTotals.carbohidratos += td.totales.carbohidratos;
                dayTotals.lipidos += td.totales.lipidos;
            });
            dias[dia] = { tiempos: JSON.parse(JSON.stringify(tiemposData)), totales: dayTotals };
        });

        const pauta = { dias, requerimientos: {} };

        try {
            await guardarPauta(pauta);
            bootstrap.Modal.getInstance(document.getElementById('pautaManualModal'))?.hide();
        } catch (e) { console.error(e); }
    };

})();