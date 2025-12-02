/* ============================================
   PATIENT FILE COMPLETE - ZENLAB PRO V3.2 FIXED
   Archivo COMPLETO con todas las funcionalidades + CORRECCIONES
   - Modo edición/visualización
   - Cálculos antropométricos
   - Registro 24h con multiplicadores
   - Frecuencia de consumo
   - ✅ FIX: Actualización de resumen después de guardar
   - ✅ FIX: Captura correcta de campos múltiples
   - ✅ FIX: Recarga de datos calculados
   ============================================ */

   (function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_BASE: '/api/patients',
        ALIMENTOS_ENDPOINT: '/api/alimentos',
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
    // MULTIPLICADORES
    // ============================================
    const MULTIPLICADORES = [
        { value: 0.25, label: '¼' },
        { value: 0.33, label: '⅓' },
        { value: 0.5, label: '½' },
        { value: 0.75, label: '¾' },
        { value: 1, label: '1' },
        { value: 1.5, label: '1½' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' }
    ];
    
    // ============================================
    // CACHE DE ALIMENTOS
    // ============================================
    let ALIMENTOS_DATABASE = {};
    let databaseLoaded = false;
    
    // ============================================
    // ESTADO
    // ============================================
    let state = {
        isEditMode: false,
        hasChanges: false,
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
    // CARGAR BASE DE DATOS DE ALIMENTOS
    // ============================================
    async function loadAlimentosDatabase() {
        if (databaseLoaded) {
            console.log('✅ Base de datos ya cargada desde cache');
            return true;
        }
        
        try {
            console.log('📡 Cargando base de datos de alimentos desde API...');
            
            const response = await fetch(CONFIG.ALIMENTOS_ENDPOINT);
            const result = await response.json();
            
            if (result.success) {
                ALIMENTOS_DATABASE = result.data;
                databaseLoaded = true;
                console.log(`✅ Base de datos cargada: ${result.total_grupos} grupos, ${result.total_alimentos} alimentos`);
                
                // Inicializar dropdowns de grupo
                initializeGroupSelects();
                
                return true;
            } else {
                throw new Error(result.error || 'Error cargando alimentos');
            }
        } catch (error) {
            console.error('❌ Error cargando base de datos:', error);
            showNotification('Error cargando base de datos de alimentos', 'error');
            return false;
        }
    }
    
    // ============================================
    // MODO EDICIÓN
    // ============================================
    window.toggleEditMode = function() {
        state.isEditMode = !state.isEditMode;
        
        if (state.isEditMode) {
            // ACTIVAR MODO EDICIÓN
            elements.form.classList.remove('view-mode');
            elements.form.classList.add('edit-mode');
            
            // Habilitar todos los campos
            elements.form.querySelectorAll('input, select, textarea').forEach(field => {
                field.disabled = false;
            });
            
            // Cambiar botón Editar
            if (elements.btnEdit) {
                elements.btnEdit.innerHTML = '<i class="fas fa-times"></i><span>Cancelar</span>';
                elements.btnEdit.classList.remove('btn-edit');
                elements.btnEdit.classList.add('btn-delete');
            }
            
            // Habilitar botón Guardar
            if (elements.btnSave) {
                elements.btnSave.disabled = false;
            }
            
            showNotification('Modo edición activado', 'info');
            
        } else {
            // DESACTIVAR MODO EDICIÓN (volver a visualización)
            elements.form.classList.remove('edit-mode');
            elements.form.classList.add('view-mode');
            
            // Deshabilitar todos los campos
            elements.form.querySelectorAll('input, select, textarea').forEach(field => {
                field.disabled = true;
            });
            
            // Cambiar botón Editar
            if (elements.btnEdit) {
                elements.btnEdit.innerHTML = '<i class="fas fa-edit"></i><span>Editar</span>';
                elements.btnEdit.classList.remove('btn-delete');
                elements.btnEdit.classList.add('btn-edit');
            }
            
            // Deshabilitar botón Guardar
            if (elements.btnSave) {
                elements.btnSave.disabled = true;
            }
            
            // Si había cambios sin guardar, recargar
            if (state.hasChanges) {
                location.reload();
            }
        }
    };
    
    // ============================================
    // GUARDAR PACIENTE - VERSIÓN CORREGIDA
    // ============================================
    window.savePatient = async function() {
        if (!state.isEditMode) return;
        
        const patientId = document.getElementById('patientId').value;
        const form = document.getElementById('patientFileForm');
        const formData = new FormData(form);
        const data = {};
        
        // ============================================
        // 1. CAMPOS BÁSICOS DEL FORMULARIO
        // ============================================
        console.log('🔍 DEBUG: Recolectando datos del formulario...');
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // ============================================
        // 2. CAMPOS DE SELECCIÓN MÚLTIPLE (CRÍTICO)
        // ============================================
        console.log('🔍 DEBUG: Capturando campos de selección múltiple...');
        
        const multipleSelectFields = [
            'diagnosticos', 
            'medicamentos', 
            'suplementos', 
            'quien_cocina', 
            'con_quien_vive', 
            'donde_come', 
            'tipo_alcohol'
        ];
        
        multipleSelectFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.multiple) {
                const selectedValues = Array.from(element.selectedOptions).map(opt => opt.value);
                data[fieldName] = selectedValues;
                console.log(`  ✓ ${fieldName}:`, selectedValues);
            }
        });
        
        // ============================================
        // 3. PLIEGUES CUTÁNEOS
        // ============================================
        console.log('🔍 DEBUG: Capturando pliegues cutáneos...');
        
        const plieguesFields = [
            'pliegue_bicipital',
            'pliegue_tricipital',
            'pliegue_subescapular',
            'pliegue_supracrestideo'
        ];
        
        plieguesFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.value) {
                data[fieldName] = parseFloat(element.value);
                console.log(`  ✓ ${fieldName}:`, element.value);
            }
        });
        
        // ============================================
        // 4. PERÍMETROS
        // ============================================
        console.log('🔍 DEBUG: Capturando perímetros...');
        
        const perimetrosFields = [
            'perimetro_brazo',
            'perimetro_cintura',
            'perimetro_cadera',
            'perimetro_pantorrilla'
        ];
        
        perimetrosFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.value) {
                data[fieldName] = parseFloat(element.value);
                console.log(`  ✓ ${fieldName}:`, element.value);
            }
        });
        
        // ============================================
        // 5. REGISTRO 24H Y FRECUENCIA
        // ============================================
        console.log('🔍 DEBUG: Capturando registro 24h y frecuencia...');
        
        data.registro_24h = collect24hData();
        data.frecuencia_consumo = collectFrequencyData();
        
        console.log('  ✓ Registro 24h:', data.registro_24h);
        console.log('  ✓ Frecuencia consumo:', data.frecuencia_consumo);
        
        // ============================================
        // 6. MOSTRAR TODOS LOS DATOS QUE SE ENVIARÁN
        // ============================================
        console.log('📤 DEBUG: Datos completos a enviar:', data);
        console.log('📊 DEBUG: Total de campos:', Object.keys(data).length);
        
        // ============================================
        // 7. ENVIAR AL BACKEND
        // ============================================
        showLoading();
        updateSaveStatus('saving');
        
        try {
            console.log(`🌐 DEBUG: Enviando PUT a /api/patients/${patientId}`);
            
            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            console.log('📥 DEBUG: Respuesta recibida:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ DEBUG: Datos guardados exitosamente:', result);
                
                // ============================================
                // ✅ FIX CRÍTICO: RECARGAR DATOS DEL BACKEND
                // ============================================
                console.log('🔄 FIX: Recargando datos calculados desde el backend...');
                
                // Hacer GET para obtener datos actualizados con cálculos
                const reloadResponse = await fetch(`/api/patients/${patientId}`);
                if (reloadResponse.ok) {
                    const reloadData = await reloadResponse.json();
                    
                    if (reloadData.success && reloadData.patient) {
                        console.log('✅ FIX: Datos recalculados recibidos:', reloadData.patient);
                        
                        // Actualizar valores calculados en el formulario
                        updateCalculatedFields(reloadData.patient);
                        
                        // ✅ FIX: Actualizar resumen visual
                        updatePatientSummary(reloadData.patient);
                        
                        // Actualizar campos del formulario
                        populateForm(reloadData.patient);
                    }
                }
                
                state.hasChanges = false;
                updateSaveStatus('saved');
                showNotification('Ficha guardada exitosamente', 'success');
                
                // Salir del modo edición después de 1 segundo
                setTimeout(() => {
                    toggleEditMode();
                }, 1000);
                
            } else {
                const errorData = await response.json();
                console.error('❌ DEBUG: Error del servidor:', errorData);
                throw new Error(errorData.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('❌ DEBUG: Error en el guardado:', error);
            updateSaveStatus('pending');
            showNotification('Error al guardar la ficha: ' + error.message, 'danger');
        } finally {
            hideLoading();
        }
    };

    // ============================================
    // ✅ NUEVA FUNCIÓN: ACTUALIZAR RESUMEN DEL PACIENTE
    // ============================================
    function updatePatientSummary(patient) {
        console.log('🔄 UPDATE SUMMARY: Actualizando resumen visual del paciente');
        
        // Actualizar Edad
        if (patient.edad) {
            const summaryEdad = document.getElementById('summaryEdad');
            if (summaryEdad) {
                summaryEdad.textContent = patient.edad;
                console.log('  ✓ Edad actualizada:', patient.edad);
            }
        }
        
        // Actualizar IMC
        if (patient.imc) {
            const summaryIMC = document.getElementById('summaryIMC');
            if (summaryIMC) {
                summaryIMC.textContent = parseFloat(patient.imc).toFixed(1);
                console.log('  ✓ IMC actualizado:', patient.imc);
                
                // Actualizar clases de alerta según IMC
                const summaryItem = summaryIMC.closest('.summary-item');
                if (summaryItem) {
                    summaryItem.classList.remove('warning', 'danger');
                    if (patient.imc >= 25 && patient.imc < 30) {
                        summaryItem.classList.add('warning');
                    } else if (patient.imc >= 30) {
                        summaryItem.classList.add('danger');
                    }
                }
            }
        }
        
        // Actualizar % Grasa
        if (patient.porcentaje_grasa) {
            const summaryGrasa = document.getElementById('summaryGrasa');
            if (summaryGrasa) {
                summaryGrasa.textContent = parseFloat(patient.porcentaje_grasa).toFixed(1) + '%';
                console.log('  ✓ % Grasa actualizado:', patient.porcentaje_grasa);
            }
        }
        
        // Actualizar GET
        if (patient.get_kcal) {
            const summaryGET = document.getElementById('summaryGET');
            if (summaryGET) {
                summaryGET.textContent = Math.round(patient.get_kcal);
                console.log('  ✓ GET actualizado:', patient.get_kcal);
            }
        }
        
        // Actualizar Proteínas
        if (patient.proteinas_g) {
            const summaryProteinas = document.getElementById('summaryProteinas');
            if (summaryProteinas) {
                summaryProteinas.textContent = Math.round(patient.proteinas_g) + 'g';
                console.log('  ✓ Proteínas actualizadas:', patient.proteinas_g);
            }
        }
        
        console.log('✅ UPDATE SUMMARY: Resumen actualizado completamente');
    }

    // ============================================
    // FUNCIÓN AUXILIAR: collectFrequencyData
    // ============================================
    function collectFrequencyData() {
        const frequency = {};
        
        // Capturar botones de frecuencia
        document.querySelectorAll('.frequency-selector').forEach(selector => {
            const group = selector.dataset.group;
            const activeBtn = selector.querySelector('.freq-btn.active');
            const value = activeBtn ? parseInt(activeBtn.dataset.value) : 0;
            
            frequency[group] = value;
            console.log(`    Frecuencia ${group}:`, value);
        });
        
        // Capturar hidden inputs de frecuencia (respaldo)
        document.querySelectorAll('input[name^="freq_"]').forEach(input => {
            const fieldName = input.name.replace('freq_', '');
            frequency[fieldName] = parseInt(input.value) || 0;
        });
        
        // Campos adicionales de texto libre
        const textFields = [
            'cereales_desayuno_tipo', 'arroz_pasta_tipo', 'tipo_pan', 'verduras_tipo',
            'cuales_frutas', 'jugos_tipo', 'legumbres_tipo', 'carnes_blancas_tipo',
            'carnes_rojas_tipo', 'huevo_tipo', 'pescado_tipo', 'cecinas_tipo',
            'lacteos_tipo', 'aceite_tipo', 'cuales_frutos_secos', 'dulces_tipo',
            'frituras_tipo', 'agua_observaciones', 'cafe_te_tipo', 'bebidas_azucaradas_tipo'
        ];
        
        textFields.forEach(field => {
            const input = document.querySelector(`input[name="${field}"]`);
            if (input && input.value) {
                frequency[field] = input.value;
            }
        });
        
        return frequency;
    }

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
        const proteinasGEl = document.getElementById('proteinasG');
        const carbohidratosGEl = document.getElementById('carbohidratosG');
        const grasasGEl = document.getElementById('grasasG');
        const fibraGEl = document.getElementById('fibraG');
        
        if (proteinasGEl) proteinasGEl.textContent = proteinasG + 'g';
        if (carbohidratosGEl) carbohidratosGEl.textContent = carbohidratosG + 'g';
        if (grasasGEl) grasasGEl.textContent = grasasG + 'g';
        if (fibraGEl) fibraGEl.textContent = fibraG + 'g';
        
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
        
        showNotification('Cálculos actualizados', 'success');
    };
    
    // ============================================
    // REGISTRO 24 HORAS - FUNCIONES GLOBALES
    // ============================================
    
    window.loadSubgrupos = function(selectElement, mealType, rowIndex) {
        const grupo = selectElement.value;
        const row = selectElement.closest('tr');
        const subgrupoSelect = row.querySelector('.subgrupo-select');
        const alimentoSelect = row.querySelector('.alimento-select');
        const porcionCell = row.querySelector('.porcion-cell');
        
        // Resetear
        subgrupoSelect.innerHTML = '<option value="">Subgrupo</option>';
        alimentoSelect.innerHTML = '<option value="">Alimento</option>';
        if (porcionCell) porcionCell.innerHTML = '<span class="text-muted">-</span>';
        subgrupoSelect.disabled = true;
        alimentoSelect.disabled = true;
        
        // Resetear valores nutricionales
        row.querySelector('.kcal-cell').textContent = '-';
        row.querySelector('.prot-cell').textContent = '-';
        row.querySelector('.carbs-cell').textContent = '-';
        row.querySelector('.lipidos-cell').textContent = '-';
        
        if (!grupo || !ALIMENTOS_DATABASE[grupo]) {
            return;
        }
        
        // Cargar subgrupos
        const subgrupos = Object.keys(ALIMENTOS_DATABASE[grupo]);
        subgrupos.forEach(subgrupo => {
            const option = document.createElement('option');
            option.value = subgrupo;
            option.textContent = subgrupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            subgrupoSelect.appendChild(option);
        });
        
        subgrupoSelect.disabled = false;
        
        // Event listener para subgrupo
        subgrupoSelect.onchange = function() {
            loadAlimentos(this, mealType, grupo);
        };
    };
    
    function loadAlimentos(subgrupoSelect, mealType, grupo) {
        const subgrupo = subgrupoSelect.value;
        const row = subgrupoSelect.closest('tr');
        const alimentoSelect = row.querySelector('.alimento-select');
        const porcionCell = row.querySelector('.porcion-cell');
        
        alimentoSelect.innerHTML = '<option value="">Alimento</option>';
        if (porcionCell) porcionCell.innerHTML = '<span class="text-muted">-</span>';
        alimentoSelect.disabled = true;
        
        if (!subgrupo) return;
        
        const alimentos = ALIMENTOS_DATABASE[grupo][subgrupo];
        if (!alimentos) return;
        
        alimentos.forEach((alimento, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = alimento.nombre;
            option.dataset.alimento = JSON.stringify(alimento);
            alimentoSelect.appendChild(option);
        });
        
        alimentoSelect.disabled = false;
        
        alimentoSelect.onchange = function() {
            loadPorcion(this, mealType);
        };
    }
    
    function loadPorcion(alimentoSelect, mealType) {
        const row = alimentoSelect.closest('tr');
        const porcionCell = row.querySelector('.porcion-cell');
        const selectedOption = alimentoSelect.options[alimentoSelect.selectedIndex];
        
        if (!alimentoSelect.value || !porcionCell) {
            if (porcionCell) porcionCell.innerHTML = '<span class="text-muted">-</span>';
            row.querySelector('.kcal-cell').textContent = '-';
            row.querySelector('.prot-cell').textContent = '-';
            row.querySelector('.carbs-cell').textContent = '-';
            row.querySelector('.lipidos-cell').textContent = '-';
            updateMealTotals(mealType);
            return;
        }
        
        const alimentoData = JSON.parse(selectedOption.dataset.alimento);
        
        // CREAR DROPDOWN DE MULTIPLICADOR + MEDIDA CASERA
        porcionCell.innerHTML = `
            <div class="d-flex gap-2 align-items-center">
                <select class="form-select form-select-sm cantidad-select" style="width: 80px; font-weight: 600; border: 2px solid #10b981;">
                    ${MULTIPLICADORES.map(m => 
                        `<option value="${m.value}" ${m.value === 1 ? 'selected' : ''}>${m.label}</option>`
                    ).join('')}
                </select>
                <span class="form-control form-control-sm border-0 bg-light flex-grow-1" style="padding: 0.375rem 0.75rem;">
                    ${alimentoData.medida_casera}
                </span>
            </div>
        `;
        
        // Event listener para cambios en cantidad
        const cantidadSelect = porcionCell.querySelector('.cantidad-select');
        cantidadSelect.addEventListener('change', function() {
            const multiplier = parseFloat(this.value);
            calculateNutrientsWithMultiplier(row, alimentoData, multiplier, mealType);
        });
        
        // Calcular con multiplicador inicial (1)
        calculateNutrientsWithMultiplier(row, alimentoData, 1, mealType);
    }
    
    function calculateNutrientsWithMultiplier(row, alimentoData, multiplier, mealType) {
        const kcal = Math.round(alimentoData.kcal * multiplier);
        const prot = (alimentoData.proteinas * multiplier).toFixed(1);
        const carbs = (alimentoData.carbohidratos * multiplier).toFixed(1);
        const lipidos = (alimentoData.lipidos * multiplier).toFixed(1);
        
        row.querySelector('.kcal-cell').textContent = kcal;
        row.querySelector('.prot-cell').textContent = prot;
        row.querySelector('.carbs-cell').textContent = carbs;
        row.querySelector('.lipidos-cell').textContent = lipidos;
        
        updateMealTotals(mealType);
    }
    
    window.addMealRow = function(mealType) {
        const table = document.getElementById(`${mealType}Table`);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        
        const newRow = document.createElement('tr');
        newRow.className = 'meal-row';
        newRow.dataset.meal = mealType;
        
        newRow.innerHTML = `
            <td>
                <select class="form-select form-select-sm grupo-select" onchange="window.loadSubgrupos(this, '${mealType}', 0)">
                    <option value="">Grupo</option>
                    ${Object.keys(ALIMENTOS_DATABASE).map(g => 
                        `<option value="${g}">${g.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm subgrupo-select" disabled>
                    <option value="">Subgrupo</option>
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm alimento-select" disabled>
                    <option value="">Alimento</option>
                </select>
            </td>
            <td class="porcion-cell">
                <span class="text-muted">-</span>
            </td>
            <td class="nutrient-cell kcal-cell">-</td>
            <td class="nutrient-cell prot-cell">-</td>
            <td class="nutrient-cell carbs-cell">-</td>
            <td class="nutrient-cell lipidos-cell">-</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.removeRow(this)">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(newRow);
    };
    
    window.removeRow = function(button) {
        const row = button.closest('tr');
        const mealType = row.dataset.meal;
        const tbody = row.parentElement;
        
        if (tbody.querySelectorAll('tr').length > 1) {
            row.remove();
            updateMealTotals(mealType);
        }
    };
    
    function updateMealTotals(mealType) {
        const table = document.getElementById(`${mealType}Table`);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr.meal-row');
        
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        
        rows.forEach(row => {
            totalKcal += parseFloat(row.querySelector('.kcal-cell').textContent) || 0;
            totalProt += parseFloat(row.querySelector('.prot-cell').textContent) || 0;
            totalCarbs += parseFloat(row.querySelector('.carbs-cell').textContent) || 0;
            totalLipidos += parseFloat(row.querySelector('.lipidos-cell').textContent) || 0;
        });
        
        const footer = table.querySelector('tfoot');
        if (footer) {
            const totalKcalEl = footer.querySelector('.total-kcal');
            const totalProtEl = footer.querySelector('.total-prot');
            const totalCarbsEl = footer.querySelector('.total-carbs');
            const totalLipidosEl = footer.querySelector('.total-lipidos');
            
            if (totalKcalEl) totalKcalEl.textContent = Math.round(totalKcal);
            if (totalProtEl) totalProtEl.textContent = totalProt.toFixed(1);
            if (totalCarbsEl) totalCarbsEl.textContent = totalCarbs.toFixed(1);
            if (totalLipidosEl) totalLipidosEl.textContent = totalLipidos.toFixed(1);
        }
        
        updateDailySummary();
    }
    
    function updateDailySummary() {
        const meals = ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena'];
        
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        
        meals.forEach(meal => {
            const table = document.getElementById(`${meal}Table`);
            if (table) {
                const footer = table.querySelector('tfoot');
                if (footer) {
                    totalKcal += parseFloat(footer.querySelector('.total-kcal')?.textContent) || 0;
                    totalProt += parseFloat(footer.querySelector('.total-prot')?.textContent) || 0;
                    totalCarbs += parseFloat(footer.querySelector('.total-carbs')?.textContent) || 0;
                    totalLipidos += parseFloat(footer.querySelector('.total-lipidos')?.textContent) || 0;
                }
            }
        });
        
        const totalDiaKcalEl = document.getElementById('totalDiaKcal');
        const totalDiaProtEl = document.getElementById('totalDiaProt');
        const totalDiaCarbsEl = document.getElementById('totalDiaCarbs');
        const totalDiaLipidosEl = document.getElementById('totalDiaLipidos');
        
        if (totalDiaKcalEl) totalDiaKcalEl.textContent = Math.round(totalKcal);
        if (totalDiaProtEl) totalDiaProtEl.textContent = totalProt.toFixed(1) + 'g';
        if (totalDiaCarbsEl) totalDiaCarbsEl.textContent = totalCarbs.toFixed(1) + 'g';
        if (totalDiaLipidosEl) totalDiaLipidosEl.textContent = totalLipidos.toFixed(1) + 'g';
    }
    
    function initializeGroupSelects() {
        document.querySelectorAll('.grupo-select').forEach(select => {
            select.innerHTML = '<option value="">Grupo</option>';
            Object.keys(ALIMENTOS_DATABASE).forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo;
                option.textContent = grupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                select.appendChild(option);
            });
        });
    }
    
    function collect24hData() {
        const meals = ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena'];
        const registro = {};
        
        meals.forEach(meal => {
            const table = document.getElementById(`${meal}Table`);
            if (!table) {
                registro[meal] = [];
                return;
            }
            
            const rows = table.querySelectorAll('tbody tr.meal-row');
            registro[meal] = [];
            
            rows.forEach(row => {
                const grupoSelect = row.querySelector('.grupo-select');
                const subgrupoSelect = row.querySelector('.subgrupo-select');
                const alimentoSelect = row.querySelector('.alimento-select');
                const porcionCell = row.querySelector('.porcion-cell');
                const cantidadSelect = porcionCell?.querySelector('.cantidad-select');
                
                if (grupoSelect?.value && subgrupoSelect?.value && alimentoSelect?.value && cantidadSelect) {
                    const selectedOption = alimentoSelect.options[alimentoSelect.selectedIndex];
                    const alimentoData = JSON.parse(selectedOption.dataset.alimento);
                    const multiplier = parseFloat(cantidadSelect.value);
                    
                    registro[meal].push({
                        grupo: grupoSelect.value,
                        subgrupo: subgrupoSelect.value,
                        alimento: alimentoSelect.value,
                        alimento_nombre: alimentoSelect.options[alimentoSelect.selectedIndex].textContent,
                        porcion: alimentoData.medida_casera,
                        cantidad: multiplier,
                        kcal: parseFloat(row.querySelector('.kcal-cell').textContent) || 0,
                        proteinas: parseFloat(row.querySelector('.prot-cell').textContent) || 0,
                        carbohidratos: parseFloat(row.querySelector('.carbs-cell').textContent) || 0,
                        lipidos: parseFloat(row.querySelector('.lipidos-cell').textContent) || 0
                    });
                }
            });
        });
        
        const totalDiaKcal = document.getElementById('totalDiaKcal');
        const totalDiaProt = document.getElementById('totalDiaProt');
        const totalDiaCarbs = document.getElementById('totalDiaCarbs');
        const totalDiaLipidos = document.getElementById('totalDiaLipidos');
        
        registro.totales = {
            kcal: totalDiaKcal ? parseFloat(totalDiaKcal.textContent) || 0 : 0,
            proteinas: totalDiaProt ? parseFloat(totalDiaProt.textContent) || 0 : 0,
            carbohidratos: totalDiaCarbs ? parseFloat(totalDiaCarbs.textContent) || 0 : 0,
            lipidos: totalDiaLipidos ? parseFloat(totalDiaLipidos.textContent) || 0 : 0
        };
        
        return registro;
    }
    
    // ============================================
    // FRECUENCIA DE CONSUMO
    // ============================================
    
    function initFrequencyButtons() {
        document.querySelectorAll('.frequency-selector').forEach(selector => {
            const buttons = selector.querySelectorAll('.freq-btn');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (state.isEditMode) {
                        buttons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        markAsChanged();
                    }
                });
            });
        });
    }
    
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
            case 'pending':
                statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Cambios sin guardar</span>';
                break;
        }
    }
    
    function markAsChanged() {
        if (state.isEditMode) {
            state.hasChanges = true;
            updateSaveStatus('pending');
        }
    }
    
    function updateCalculatedFields(patient) {
        if (patient.imc) {
            const imcValue = document.getElementById('imcValue');
            if (imcValue) imcValue.textContent = patient.imc;
        }
        if (patient.imc_categoria) {
            const imcCategoria = document.getElementById('imcCategoria');
            if (imcCategoria) imcCategoria.textContent = patient.imc_categoria;
        }
        if (patient.porcentaje_grasa) {
            const grasaValue = document.getElementById('grasaValue');
            if (grasaValue) grasaValue.textContent = patient.porcentaje_grasa + '%';
        }
        if (patient.indice_cintura_cadera) {
            const iccValue = document.getElementById('iccValue');
            if (iccValue) iccValue.textContent = patient.indice_cintura_cadera;
        }
        if (patient.geb_kcal) {
            const gebValue = document.getElementById('gebValue');
            if (gebValue) gebValue.textContent = patient.geb_kcal;
        }
        if (patient.get_kcal) {
            const getValue = document.getElementById('getValue');
            if (getValue) getValue.textContent = patient.get_kcal;
        }
    }
    
    function showLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('show');
        }
    }
    
    function hideLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('show');
        }
    }
    
    function showNotification(message, type = 'success') {
        const prevNotification = document.querySelector('.toast-notification');
        if (prevNotification) prevNotification.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                <strong>${message}</strong>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ============================================
    // NAVEGACIÓN
    // ============================================
    
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Abrir el acordeón si está cerrado
        if (bootstrap && bootstrap.Collapse) {
            const collapse = new bootstrap.Collapse(section, { toggle: false });
            collapse.show();
        }
        
        // Scroll suave
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        
        // Actualizar nav activo
        document.querySelectorAll('.quick-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const clickedNav = document.querySelector(`[onclick*="${sectionId}"]`);
        if (clickedNav) {
            clickedNav.closest('.quick-nav-item')?.classList.add('active');
        }
    };
    
    // ============================================
    // CARGAR Y LLENAR DATOS DEL PACIENTE
    // ============================================
    
    async function loadPatientData(patientId) {
        try {
            console.log('📥 Cargando datos del paciente:', patientId);
            
            const response = await fetch(`/api/patients/${patientId}`);
            
            if (!response.ok) {
                throw new Error('Error cargando paciente');
            }
            
            const result = await response.json();
            
            if (!result.success || !result.patient) {
                throw new Error('No se encontraron datos del paciente');
            }
            
            const patient = result.patient;
            console.log('✅ Datos recibidos:', patient);
            
            // Llenar campos básicos
            fillBasicFields(patient);
            
            // Llenar selecciones múltiples
            fillMultipleSelects(patient);
            
            // Llenar pliegues y perímetros
            fillAnthropometry(patient);
            
            // Actualizar valores calculados
            updateCalculatedFields(patient);
            
            // ✅ FIX: Actualizar resumen visual al cargar
            updatePatientSummary(patient);
            
            console.log('✅ Todos los datos cargados correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando datos del paciente:', error);
            showNotification('Error al cargar los datos del paciente', 'danger');
        }
    }
    
    function fillBasicFields(patient) {
        const textFields = [
            'nombre', 'fecha_nacimiento', 'sexo', 'email', 'telefono',
            'direccion', 'ocupacion', 'motivo_consulta', 'profesion',
            'teletrabajo', 'horas_sueno', 'observaciones_sueno',
            'gatillantes_estres', 'manejo_estres', 'consumo_alcohol',
            'tabaco', 'drogas', 'actividad_fisica', 'tipo_ejercicio'
        ];
        
        textFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field]) {
                element.value = patient[field];
            }
        });
        
        // Campos numéricos
        const numericFields = [
            'talla_m', 'peso_kg', 'calidad_sueno', 'nivel_estres', 'duracion_ejercicio'
        ];
        
        numericFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field]) {
                element.value = patient[field];
            }
        });
    }
    
    function fillMultipleSelects(patient) {
        console.log('🔄 Llenando campos de selección múltiple...');
        
        const multipleSelectFields = [
            'diagnosticos',
            'medicamentos', 
            'suplementos',
            'quien_cocina',
            'con_quien_vive',
            'donde_come',
            'tipo_alcohol'
        ];
        
        multipleSelectFields.forEach(fieldName => {
            const selectElement = document.getElementById(fieldName);
            
            if (!selectElement) {
                console.warn(`⚠️ Campo ${fieldName} no encontrado en el DOM`);
                return;
            }
            
            let savedValues = patient[fieldName];
            
            if (typeof savedValues === 'string') {
                try {
                    savedValues = JSON.parse(savedValues);
                } catch (e) {
                    console.warn(`⚠️ Error parseando ${fieldName}:`, e);
                    return;
                }
            }
            
            if (!Array.isArray(savedValues)) {
                console.warn(`⚠️ ${fieldName} no es un array:`, savedValues);
                return;
            }
            
            Array.from(selectElement.options).forEach(option => {
                if (savedValues.includes(option.value)) {
                    option.selected = true;
                    console.log(`  ✓ ${fieldName}: Seleccionado "${option.value}"`);
                } else {
                    option.selected = false;
                }
            });
        });
        
        console.log('✅ Selecciones múltiples cargadas');
    }
    
    function fillAnthropometry(patient) {
        const anthropometryFields = [
            'pliegue_bicipital', 'pliegue_tricipital',
            'pliegue_subescapular', 'pliegue_supracrestideo',
            'perimetro_brazo', 'perimetro_cintura',
            'perimetro_cadera', 'perimetro_pantorrilla'
        ];
        
        anthropometryFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field]) {
                element.value = patient[field];
            }
        });
    }
    
    function populateForm(patient) {
        console.log('[POPULATE] Actualizando formulario con nuevos datos...');
        fillBasicFields(patient);
        fillMultipleSelects(patient);
        fillAnthropometry(patient);
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    function initSliders() {
        const calidadSueno = elements.calidadSueno;
        if (calidadSueno) {
            const calidadSuenoValue = document.getElementById('calidadSuenoValue');
            calidadSueno.addEventListener('input', function() {
                if (calidadSuenoValue) calidadSuenoValue.textContent = this.value;
                markAsChanged();
            });
        }
        
        const nivelEstres = elements.nivelEstres;
        if (nivelEstres) {
            const estresValue = document.getElementById('estresValue');
            nivelEstres.addEventListener('input', function() {
                if (estresValue) estresValue.textContent = this.value;
                markAsChanged();
            });
        }
    }
    
    function initFormListeners() {
        if (elements.form) {
            elements.form.addEventListener('input', () => {
                if (state.isEditMode) {
                    markAsChanged();
                }
            });
            
            elements.form.addEventListener('change', () => {
                if (state.isEditMode) {
                    markAsChanged();
                }
            });
            
            elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                savePatient();
            });
        }
        
        // Listeners para campos de cálculo
        if (elements.talla) {
            elements.talla.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularIMC();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        if (elements.peso) {
            elements.peso.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularIMC();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        if (elements.fechaNacimiento) {
            elements.fechaNacimiento.addEventListener('change', () => {
                if (state.isEditMode) {
                    calcularEdad();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        if (elements.actividadFisica) {
            elements.actividadFisica.addEventListener('change', () => {
                if (state.isEditMode) {
                    calcularGET();
                }
            });
        }
        
        // Listeners para pliegues
        Object.values(elements.pliegues).forEach(pliegue => {
            if (pliegue) {
                pliegue.addEventListener('input', () => {
                    if (state.isEditMode) {
                        calcularGrasa();
                    }
                });
            }
        });
        
        // Listeners para perímetros
        if (elements.perimetroCintura) {
            elements.perimetroCintura.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularICC();
                }
            });
        }
        
        if (elements.perimetroCadera) {
            elements.perimetroCadera.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularICC();
                }
            });
        }
        
        // Listeners para macros
        if (elements.proteinasPct) {
            elements.proteinasPct.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularMacros();
                }
            });
        }
        
        if (elements.carbohidratosPct) {
            elements.carbohidratosPct.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularMacros();
                }
            });
        }
        
        if (elements.grasasPct) {
            elements.grasasPct.addEventListener('input', () => {
                if (state.isEditMode) {
                    calcularMacros();
                }
            });
        }
    }
    
    async function init() {
        console.log('🚀 Inicializando Patient File COMPLETE V3.2 FIXED...');
        
        state.patientId = elements.patientId?.value;
        
        // Cargar base de datos de alimentos
        await loadAlimentosDatabase();
        
        // Inicializar módulos
        initSliders();
        initFormListeners();
        initFrequencyButtons();
        
        // Inicializar en modo visualización
        elements.form?.classList.add('view-mode');
        elements.form?.querySelectorAll('input, select, textarea').forEach(field => {
            field.disabled = true;
        });
        
        if (elements.btnSave) {
            elements.btnSave.disabled = true;
        }
        
        // Si hay un paciente, cargar sus datos
        if (state.patientId) {
            await loadPatientData(state.patientId);
        } else {
            // Calcular valores iniciales para nuevo paciente
            calcularEdad();
        }
        
        console.log('✅ Patient File COMPLETE V3.2 FIXED inicializado correctamente');
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

// ============================================
// ESTILOS DE ANIMACIÓN
// ============================================
const patientFileStyles = document.createElement('style');
patientFileStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    }
    
    .cantidad-select {
        font-weight: 600 !important;
        border: 2px solid #10b981 !important;
        color: #059669 !important;
    }
    
    .cantidad-select:focus {
        border-color: #059669 !important;
        box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25) !important;
    }
    
    .view-mode input:not([type="hidden"]),
    .view-mode select,
    .view-mode textarea {
        background-color: #f8f9fa !important;
        border-color: #dee2e6 !important;
        cursor: not-allowed;
        opacity: 0.7;
    }
    
    .edit-mode input:not([type="hidden"]),
    .edit-mode select,
    .edit-mode textarea {
        background-color: white !important;
        border-color: #10b981 !important;
        border-width: 2px !important;
    }
    
    .save-status {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .save-status.saved {
        background: #d1fae5;
        color: #065f46;
    }
    
    .save-status.saving {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .save-status.pending {
        background: #fef3c7;
        color: #92400e;
        animation: pulse 1.5s infinite;
    }
`;
document.head.appendChild(patientFileStyles);

console.log('✅ Módulo Patient File COMPLETE V3.2 FIXED cargado correctamente');