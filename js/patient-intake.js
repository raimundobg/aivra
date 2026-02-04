/* ============================================
   PATIENT INTAKE FORM - ZENLAB PRO V3.4
   Version con validacion, toggle y restricciones
   ============================================ */

   (function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_ENDPOINT: '/api/patient/save',
        ALIMENTOS_ENDPOINT: '/api/alimentos',
        DRAFT_ENDPOINT: '/api/patient/save-draft',
        IMC_CATEGORIES: {
            bajo: { min: 0, max: 18.5, label: 'Bajo peso', class: 'text-warning' },
            normal: { min: 18.5, max: 24.9, label: 'Peso normal', class: 'text-success' },
            sobrepeso: { min: 25, max: 29.9, label: 'Sobrepeso', class: 'text-warning' },
            obesidad1: { min: 30, max: 34.9, label: 'Obesidad I', class: 'text-danger' },
            obesidad2: { min: 35, max: 39.9, label: 'Obesidad II', class: 'text-danger' },
            obesidad3: { min: 40, max: 100, label: 'Obesidad III', class: 'text-danger' }
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
    // ESTADO GLOBAL
    // ============================================
    let state = {
        currentMode: 'create',
        hasChanges: false,
        patientId: null
    };
    
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================
    const elements = {
        body: document.body,
        form: document.getElementById('patientIntakeForm'),
        patient_id: document.getElementById('patient_id'),
        
        // Campos básicos
        fechaNacimiento: document.getElementById('fecha_nacimiento'),
        edadCalculada: document.getElementById('edadCalculada'),
        sexo: document.getElementById('sexo'),
        objetivosBtns: document.querySelectorAll('.pill-btn[data-objetivo]'),
        objetivosHidden: document.getElementById('objetivos'),
        
        // Antropometría
        talla: document.getElementById('talla'),
        peso: document.getElementById('peso'),
        imcCalculado: document.getElementById('imcCalculado'),
        imcCategoria: document.getElementById('imcCategoria'),
        
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
        calidadSuenoValue: document.getElementById('calidadSuenoValue'),
        nivelEstres: document.getElementById('nivel_estres'),
        estresValue: document.getElementById('estresValue'),
        
        // Progress bar
        formProgress: document.getElementById('formProgress'),
        
        // Loading
        loadingOverlay: document.getElementById('loadingOverlay'),
        
        // Campos condicionales
        consumoAlcohol: document.getElementById('consumo_alcohol'),
        tipoAlcoholContainer: document.getElementById('tipoAlcoholContainer'),
        reflujo: document.getElementById('reflujo'),
        reflujoAlimentoContainer: document.getElementById('reflujoAlimentoContainer'),
        hinchazon: document.getElementById('hinchazon'),
        hinchazonAlimentoContainer: document.getElementById('hinchazonAlimentoContainer'),
        tieneAlergias: document.getElementById('tiene_alergias'),
        alergiasAlimentoContainer: document.getElementById('alergiasAlimentoContainer'),
        
        // Sticky actions
        stickyActions: document.getElementById('stickyActions'),
        
        // Actividad física
        actividadFisica: document.getElementById('actividad_fisica')
    };
    
    // ============================================
    // DETECCIÓN DE MODO
    // ============================================
    function detectInitialMode() {
        const modeAttr = elements.body?.dataset.mode;
        const patientId = elements.patient_id?.value;
        
        if (modeAttr) {
            state.currentMode = modeAttr;
        } else if (patientId && patientId !== '') {
            state.currentMode = 'view';
        } else {
            state.currentMode = 'create';
        }
        
        state.patientId = patientId;
        console.log(`🎯 Modo: ${state.currentMode.toUpperCase()}`);
        
        return state.currentMode;
    }
    
    // ============================================
    // MARCAR CAMBIOS Y MOSTRAR STICKY BUTTONS
    // ============================================
    function markAsChanged() {
        if (!state.hasChanges) {
            state.hasChanges = true;
            showStickyActions();
            console.log('✅ Formulario modificado - Mostrando botones sticky');
        }
    }
    
    function showStickyActions() {
        if (elements.stickyActions) {
            elements.stickyActions.style.display = 'block';
            document.body.classList.add('sticky-active');
            console.log('✅ Sticky actions mostrados');
        }
    }
    
    function hideStickyActions() {
        if (elements.stickyActions) {
            elements.stickyActions.style.display = 'none';
            document.body.classList.remove('sticky-active');
            state.hasChanges = false;
        }
    }
    
    // ============================================
    // CARGAR BASE DE DATOS DE ALIMENTOS
    // ============================================
    async function loadAlimentosDatabase() {
        if (databaseLoaded) return true;
        
        try {
            console.log('📡 Cargando base de datos de alimentos...');
            
            const response = await fetch(CONFIG.ALIMENTOS_ENDPOINT);
            const result = await response.json();
            
            if (result.success) {
                ALIMENTOS_DATABASE = result.data;
                databaseLoaded = true;
                console.log(`✅ Base de datos cargada: ${result.total_grupos} grupos, ${result.total_alimentos} alimentos`);
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
    // CALCULADORAS
    // ============================================
    window.calcularEdad = function() {
        const birthDate = elements.fechaNacimiento?.value;
        if (!birthDate || !elements.edadCalculada) return null;
        
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        elements.edadCalculada.textContent = age;
        elements.edadCalculada.classList.add('fw-bold', 'text-primary');
        
        const summaryEdad = document.getElementById('summaryEdad');
        if (summaryEdad) summaryEdad.textContent = age;
        
        markAsChanged();
        return age;
    };
    
    window.calcularIMC = function() {
        const peso = parseFloat(elements.peso?.value);
        const talla = parseFloat(elements.talla?.value);
        
        if (peso && talla && talla > 0) {
            const imc = peso / (talla * talla);
            
            if (elements.imcCalculado) {
                elements.imcCalculado.textContent = imc.toFixed(1);
                elements.imcCalculado.classList.add('highlight');
            }
            
            for (const [key, category] of Object.entries(CONFIG.IMC_CATEGORIES)) {
                if (imc >= category.min && imc < category.max) {
                    if (elements.imcCategoria) {
                        elements.imcCategoria.textContent = category.label;
                        elements.imcCategoria.className = `text-muted text-center d-block ${category.class}`;
                    }
                    break;
                }
            }
            
            const summaryIMC = document.getElementById('summaryIMC');
            if (summaryIMC) summaryIMC.textContent = imc.toFixed(1);
            
            markAsChanged();
            return imc.toFixed(1);
        }
        
        return null;
    };
    
    window.calcularGrasa = function() {
        const pliegues = [
            parseFloat(elements.pliegues.bicipital?.value),
            parseFloat(elements.pliegues.tricipital?.value),
            parseFloat(elements.pliegues.subescapular?.value),
            parseFloat(elements.pliegues.supracrestideo?.value)
        ];
        
        if (pliegues.some(p => isNaN(p) || p <= 0)) return null;
        
        const sumaPliegues = pliegues.reduce((a, b) => a + b, 0);
        const logPliegues = Math.log10(sumaPliegues);
        const edad = calcularEdad() || 30;
        const sexo = elements.sexo?.value;
        
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
            
            if (sexo === 'Masculino') {
                if (icc >= 1.0) riesgo = 'Alto';
                else if (icc >= 0.95) riesgo = 'Moderado';
            } else {
                if (icc >= 0.85) riesgo = 'Alto';
                else if (icc >= 0.80) riesgo = 'Moderado';
            }
            
            const iccValue = document.getElementById('iccValue');
            const riesgoCV = document.getElementById('riesgoCV');
            
            if (iccValue) iccValue.textContent = icc;
            if (riesgoCV) riesgoCV.textContent = riesgo;
            
            markAsChanged();
            return icc;
        }
        return null;
    };
    
    window.calcularGEB = function() {
        const peso = parseFloat(elements.peso?.value);
        const talla = parseFloat(elements.talla?.value);
        const sexo = elements.sexo?.value;
        const edad = calcularEdad();
        
        if (!peso || !talla || !sexo || !edad) return null;
        
        const alturaCm = talla * 100;
        let geb;
        
        if (sexo === 'Masculino') {
            geb = 88.362 + (13.397 * peso) + (4.799 * alturaCm) - (5.677 * edad);
        } else {
            geb = 447.593 + (9.247 * peso) + (3.098 * alturaCm) - (4.330 * edad);
        }
        
        geb = Math.round(geb);
        
        const gebValue = document.getElementById('gebValue');
        if (gebValue) gebValue.textContent = geb;
        
        markAsChanged();
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
        
        markAsChanged();
        return get;
    };
    
    window.calcularMacros = function() {
        const get = parseFloat(document.getElementById('getValue')?.textContent) || 0;
        if (get === 0) return;
        
        const protPct = parseFloat(document.getElementById('proteinas_porcentaje')?.value) || 20;
        const carbsPct = parseFloat(document.getElementById('carbohidratos_porcentaje')?.value) || 50;
        const grasasPct = parseFloat(document.getElementById('grasas_porcentaje')?.value) || 20;
        const liquidosPct = parseFloat(document.getElementById('liquidos_porcentaje')?.value) || 10;
        
        const total = protPct + carbsPct + grasasPct + liquidosPct;
        const totalEl = document.getElementById('totalPorcentaje');
        
        if (totalEl) {
            totalEl.textContent = total + '%';
            totalEl.className = total === 100 ? 'badge bg-success' : 'badge bg-danger';
        }
        
        const protG = Math.round((get * protPct / 100) / 4);
        const carbsG = Math.round((get * carbsPct / 100) / 4);
        const grasasG = Math.round((get * grasasPct / 100) / 9);
        const fibraG = Math.round(14 * (get / 1000));
        
        document.getElementById('proteinasG').textContent = protG + 'g';
        document.getElementById('carbohidratosG').textContent = carbsG + 'g';
        document.getElementById('grasasG').textContent = grasasG + 'g';
        document.getElementById('fibraG').textContent = fibraG + 'g';
        
        markAsChanged();
    };
    
    window.calcularRequerimientos = function() {
        calcularGEB();
        calcularGET();
        calcularMacros();
    };
    
    // ============================================
    // OBJETIVOS MANAGER
    // ============================================
    const ObjetivosManager = {
        toggle: function(btn) {
            btn.classList.toggle('active');
            this.updateSelected();
            markAsChanged();
        },
        
        updateSelected: function() {
            const selected = Array.from(elements.objetivosBtns)
                .filter(btn => btn.classList.contains('active'))
                .map(btn => btn.dataset.objetivo);
            
            if (elements.objetivosHidden) {
                elements.objetivosHidden.value = selected.join(',');
            }
        },
        
        init: function() {
            elements.objetivosBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggle(btn);
                });
            });
        }
    };
    
    // ============================================
    // RANGE SLIDERS
    // ============================================
    const RangeManager = {
        init: function() {
            if (elements.calidadSueno && elements.calidadSuenoValue) {
                elements.calidadSueno.addEventListener('input', function() {
                    elements.calidadSuenoValue.textContent = this.value;
                    markAsChanged();
                });
            }
            
            if (elements.nivelEstres && elements.estresValue) {
                elements.nivelEstres.addEventListener('input', function() {
                    elements.estresValue.textContent = this.value;
                    markAsChanged();
                });
            }
        }
    };
    
    // ============================================
    // CAMPOS CONDICIONALES
    // ============================================
    const ConditionalFields = {
        init: function() {
            if (elements.consumoAlcohol) {
                elements.consumoAlcohol.addEventListener('change', function() {
                    const container = elements.tipoAlcoholContainer;
                    if (this.value && this.value !== 'nunca') {
                        container.style.display = 'block';
                    } else {
                        container.style.display = 'none';
                    }
                    markAsChanged();
                });
            }
            
            if (elements.reflujo) {
                elements.reflujo.addEventListener('change', function() {
                    elements.reflujoAlimentoContainer.style.display = this.value === 'si' ? 'block' : 'none';
                    markAsChanged();
                });
            }
            
            if (elements.hinchazon) {
                elements.hinchazon.addEventListener('change', function() {
                    elements.hinchazonAlimentoContainer.style.display = this.value === 'si' ? 'block' : 'none';
                    markAsChanged();
                });
            }
            
            if (elements.tieneAlergias) {
                elements.tieneAlergias.addEventListener('change', function() {
                    elements.alergiasAlimentoContainer.style.display = this.value === 'si' ? 'block' : 'none';
                    markAsChanged();
                });
            }
        }
    };
    
    // ============================================
    // FRECUENCIA DE CONSUMO - CORREGIDO CON TOGGLE
    // ============================================
    const FrequencyManager = {
        init: function() {
            document.querySelectorAll('.frequency-selector').forEach(selector => {
                const group = selector.dataset.group;
                const buttons = selector.querySelectorAll('.freq-btn');
                const hiddenInput = selector.parentElement?.querySelector(`input[name="freq_${group}"]`);

                buttons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();

                        // Toggle: si ya esta activo, deseleccionar
                        if (btn.classList.contains('active')) {
                            btn.classList.remove('active');
                            if (hiddenInput) hiddenInput.value = '0';
                            console.log(`Frecuencia ${group}: deseleccionado`);
                        } else {
                            // Deseleccionar todos y seleccionar el clickeado
                            buttons.forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            if (hiddenInput) hiddenInput.value = btn.dataset.value;
                            console.log(`Frecuencia ${group}: ${btn.dataset.value}`);
                        }

                        markAsChanged();
                    });
                });
            });

            console.log('FrequencyManager inicializado con toggle');
        }
    };

    // ============================================
    // RESTRICCIONES ALIMENTARIAS MANAGER
    // ============================================
    const RestriccionesManager = {
        init: function() {
            const checkboxes = document.querySelectorAll('.restriccion-check');
            const hiddenInput = document.getElementById('restricciones_alimentarias');

            if (checkboxes.length === 0) return;

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateSelected();
                    markAsChanged();
                });
            });

            console.log('RestriccionesManager inicializado');
        },

        updateSelected: function() {
            const checkboxes = document.querySelectorAll('.restriccion-check:checked');
            const hiddenInput = document.getElementById('restricciones_alimentarias');

            const selected = Array.from(checkboxes).map(cb => cb.value);

            if (hiddenInput) {
                hiddenInput.value = selected.join(',');
            }
        }
    };

    // ============================================
    // REGISTRO 24 HORAS - FUNCIONES GLOBALES
    // ============================================
    
    window.loadSubgrupos = function(selectElement, mealType) {
        const grupo = selectElement.value;
        const row = selectElement.closest('tr');
        const subgrupoSelect = row.querySelector('.subgrupo-select');
        const alimentoSelect = row.querySelector('.alimento-select');
        const porcionCell = row.querySelector('.porcion-cell');
        
        subgrupoSelect.innerHTML = '<option value="">Subgrupo</option>';
        alimentoSelect.innerHTML = '<option value="">Alimento</option>';
        porcionCell.innerHTML = '<span class="text-muted">-</span>';
        
        row.querySelector('.kcal-cell').textContent = '-';
        row.querySelector('.prot-cell').textContent = '-';
        row.querySelector('.carbs-cell').textContent = '-';
        row.querySelector('.lipidos-cell').textContent = '-';
        
        if (!grupo || !ALIMENTOS_DATABASE[grupo]) {
            subgrupoSelect.disabled = true;
            alimentoSelect.disabled = true;
            return;
        }
        
        const subgrupos = Object.keys(ALIMENTOS_DATABASE[grupo]);
        subgrupos.forEach(subgrupo => {
            const option = document.createElement('option');
            option.value = subgrupo;
            option.textContent = subgrupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            subgrupoSelect.appendChild(option);
        });
        
        subgrupoSelect.disabled = false;
        subgrupoSelect.onchange = function() {
            loadAlimentos(this, mealType, grupo);
        };
        
        markAsChanged();
    };
    
    function loadAlimentos(subgrupoSelect, mealType, grupo) {
        const subgrupo = subgrupoSelect.value;
        const row = subgrupoSelect.closest('tr');
        const alimentoSelect = row.querySelector('.alimento-select');
        
        alimentoSelect.innerHTML = '<option value="">Alimento</option>';
        
        if (!subgrupo) {
            alimentoSelect.disabled = true;
            return;
        }
        
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
        
        markAsChanged();
    }
    
    function loadPorcion(alimentoSelect, mealType) {
        const row = alimentoSelect.closest('tr');
        const porcionCell = row.querySelector('.porcion-cell');
        const selectedOption = alimentoSelect.options[alimentoSelect.selectedIndex];
        
        if (!alimentoSelect.value) {
            porcionCell.innerHTML = '<span class="text-muted">-</span>';
            row.querySelector('.kcal-cell').textContent = '-';
            row.querySelector('.prot-cell').textContent = '-';
            row.querySelector('.carbs-cell').textContent = '-';
            row.querySelector('.lipidos-cell').textContent = '-';
            updateMealTotals(mealType);
            return;
        }
        
        const alimentoData = JSON.parse(selectedOption.dataset.alimento);
        
        porcionCell.innerHTML = `
            <div class="d-flex gap-2 align-items-center">
                <select class="form-select form-select-sm cantidad-select" style="width: 80px; font-weight: 600; border: 2px solid #10b981;">
                    ${MULTIPLICADORES.map(m => 
                        `<option value="${m.value}" ${m.value === 1 ? 'selected' : ''}>${m.label}</option>`
                    ).join('')}
                </select>
                <span class="form-control form-control-sm border-0 bg-light flex-grow-1">
                    ${alimentoData.medida_casera}
                </span>
            </div>
        `;
        
        const cantidadSelect = porcionCell.querySelector('.cantidad-select');
        cantidadSelect.addEventListener('change', function() {
            const multiplier = parseFloat(this.value);
            calculateNutrients(row, alimentoData, multiplier, mealType);
        });
        
        calculateNutrients(row, alimentoData, 1, mealType);
        markAsChanged();
    }
    
    function calculateNutrients(row, alimentoData, multiplier, mealType) {
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
        const tbody = table.querySelector('tbody');
        
        const newRow = document.createElement('tr');
        newRow.className = 'meal-row';
        newRow.dataset.meal = mealType;
        
        newRow.innerHTML = `
            <td>
                <select class="form-select form-select-sm grupo-select" onchange="window.loadSubgrupos(this, '${mealType}')">
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
        markAsChanged();
    };
    
    window.removeRow = function(button) {
        const row = button.closest('tr');
        const mealType = row.dataset.meal;
        const tbody = row.parentElement;
        
        if (tbody.querySelectorAll('tr').length > 1) {
            row.remove();
            updateMealTotals(mealType);
            markAsChanged();
        }
    };
    
    function updateMealTotals(mealType) {
        const table = document.getElementById(`${mealType}Table`);
        const rows = table.querySelectorAll('tbody tr.meal-row');
        
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        
        rows.forEach(row => {
            totalKcal += parseFloat(row.querySelector('.kcal-cell').textContent) || 0;
            totalProt += parseFloat(row.querySelector('.prot-cell').textContent) || 0;
            totalCarbs += parseFloat(row.querySelector('.carbs-cell').textContent) || 0;
            totalLipidos += parseFloat(row.querySelector('.lipidos-cell').textContent) || 0;
        });
        
        const footer = table.querySelector('tfoot');
        footer.querySelector('.total-kcal').textContent = Math.round(totalKcal);
        footer.querySelector('.total-prot').textContent = totalProt.toFixed(1);
        footer.querySelector('.total-carbs').textContent = totalCarbs.toFixed(1);
        footer.querySelector('.total-lipidos').textContent = totalLipidos.toFixed(1);
        
        updateDailySummary();
    }
    
    function updateDailySummary() {
        const meals = ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena'];
        
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        
        meals.forEach(meal => {
            const table = document.getElementById(`${meal}Table`);
            if (table) {
                const footer = table.querySelector('tfoot');
                totalKcal += parseFloat(footer.querySelector('.total-kcal').textContent) || 0;
                totalProt += parseFloat(footer.querySelector('.total-prot').textContent) || 0;
                totalCarbs += parseFloat(footer.querySelector('.total-carbs').textContent) || 0;
                totalLipidos += parseFloat(footer.querySelector('.total-lipidos').textContent) || 0;
            }
        });
        
        document.getElementById('totalDiaKcal').textContent = Math.round(totalKcal);
        document.getElementById('totalDiaProt').textContent = totalProt.toFixed(1) + 'g';
        document.getElementById('totalDiaCarbs').textContent = totalCarbs.toFixed(1) + 'g';
        document.getElementById('totalDiaLipidos').textContent = totalLipidos.toFixed(1) + 'g';
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
    
    // ============================================
    // RECOLECCIÓN DE DATOS - CORREGIDO
    // ============================================
    function collectFormData() {
        const formData = new FormData(elements.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Multi-selects - CORREGIDO
        ['diagnosticos', 'medicamentos', 'suplementos', 'quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol'].forEach(field => {
            const element = document.getElementById(field);
            if (element && element.multiple) {
                data[field] = Array.from(element.selectedOptions).map(opt => opt.value);
            }
        });
        
        // Registro 24h
        data.registro_24h = collect24hData();
        
        // Frecuencia de consumo
        data.frecuencia_consumo = collectFrequencyData();
        
        // Diagnóstico y Plan Nutricional
        data.diagnostico_nutricional = document.getElementById('diagnostico_nutricional')?.value || '';
        data.objetivos_nutricionales = document.getElementById('objetivos_nutricionales')?.value || '';
        data.indicaciones = document.getElementById('indicaciones')?.value || '';
        data.meta_peso = document.getElementById('meta_peso')?.value || '';
        data.fecha_meta = document.getElementById('fecha_meta')?.value || '';
        data.fecha_proxima_cita = document.getElementById('fecha_proxima_cita')?.value || '';
        data.notas_seguimiento = document.getElementById('notas_seguimiento')?.value || '';
        
        return data;
    }
    
    function collect24hData() {
        const meals = ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena'];
        const registro = {};
        
        meals.forEach(meal => {
            const table = document.getElementById(`${meal}Table`);
            const rows = table.querySelectorAll('tbody tr.meal-row');
            registro[meal] = [];
            
            rows.forEach(row => {
                const grupoSelect = row.querySelector('.grupo-select');
                const subgrupoSelect = row.querySelector('.subgrupo-select');
                const alimentoSelect = row.querySelector('.alimento-select');
                const porcionCell = row.querySelector('.porcion-cell');
                const cantidadSelect = porcionCell.querySelector('.cantidad-select');
                
                if (grupoSelect.value && subgrupoSelect.value && alimentoSelect.value && cantidadSelect) {
                    const selectedOption = alimentoSelect.options[alimentoSelect.selectedIndex];
                    const alimentoData = JSON.parse(selectedOption.dataset.alimento);
                    
                    registro[meal].push({
                        grupo: grupoSelect.value,
                        subgrupo: subgrupoSelect.value,
                        alimento: alimentoSelect.value,
                        alimento_nombre: alimentoSelect.options[alimentoSelect.selectedIndex].textContent,
                        porcion: alimentoData.medida_casera,
                        cantidad: parseFloat(cantidadSelect.value),
                        kcal: parseFloat(row.querySelector('.kcal-cell').textContent) || 0,
                        proteinas: parseFloat(row.querySelector('.prot-cell').textContent) || 0,
                        carbohidratos: parseFloat(row.querySelector('.carbs-cell').textContent) || 0,
                        lipidos: parseFloat(row.querySelector('.lipidos-cell').textContent) || 0
                    });
                }
            });
        });
        
        registro.totales = {
            kcal: parseFloat(document.getElementById('totalDiaKcal').textContent) || 0,
            proteinas: parseFloat(document.getElementById('totalDiaProt').textContent) || 0,
            carbohidratos: parseFloat(document.getElementById('totalDiaCarbs').textContent) || 0,
            lipidos: parseFloat(document.getElementById('totalDiaLipidos').textContent) || 0
        };
        
        return registro;
    }
    
    function collectFrequencyData() {
        const frequency = {};
        
        document.querySelectorAll('.frequency-selector').forEach(selector => {
            const group = selector.dataset.group;
            const activeBtn = selector.querySelector('.freq-btn.active');
            frequency[group] = activeBtn ? parseInt(activeBtn.dataset.value) : 0;
        });
        
        const textFields = ['tipo_pan', 'cuales_frutas', 'cuales_frutos_secos'];
        textFields.forEach(field => {
            const input = document.querySelector(`input[name="${field}"]`);
            if (input) {
                frequency[field] = input.value;
            }
        });
        
        return frequency;
    }
    
    // ============================================
    // VALIDACION DE CAMPOS REQUERIDOS
    // ============================================
    const REQUIRED_FIELDS = [
        { id: 'nombre', label: 'Nombre Completo' },
        { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
        { id: 'sexo', label: 'Sexo' },
        { id: 'motivo_consulta', label: 'Motivo de Consulta' }
    ];

    function validateRequiredFields() {
        const missingFields = [];

        // Limpiar errores previos
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.field-error-label').forEach(el => {
            el.remove();
        });

        REQUIRED_FIELDS.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                const value = element.value?.trim();
                if (!value || value === '') {
                    missingFields.push(field);
                    // Agregar clase de error visual
                    element.classList.add('is-invalid');
                    // Agregar borde rojo al contenedor padre si es necesario
                    const parent = element.closest('.col-md-6, .col-md-3, .col-md-4');
                    if (parent) {
                        const errorLabel = document.createElement('div');
                        errorLabel.className = 'field-error-label text-danger small mt-1';
                        errorLabel.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i>Campo requerido';
                        if (!parent.querySelector('.field-error-label')) {
                            parent.appendChild(errorLabel);
                        }
                    }
                }
            }
        });

        return missingFields;
    }

    function showValidationModal(missingFields) {
        const modal = document.getElementById('validationModal');
        const list = document.getElementById('missingFieldsList');

        if (modal && list) {
            list.innerHTML = missingFields.map(field =>
                `<li class="mb-2">
                    <i class="fas fa-times-circle text-danger me-2"></i>
                    <strong>${field.label}</strong>
                </li>`
            ).join('');

            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } else {
            // Fallback si no existe el modal
            const fieldNames = missingFields.map(f => f.label).join(', ');
            showNotification(`Campos faltantes: ${fieldNames}`, 'error');
        }

        // Scroll al primer campo con error
        const firstError = document.querySelector('.is-invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    // ============================================
    // GUARDAR FORMULARIO
    // ============================================
    async function handleFormSubmit(e) {
        e.preventDefault();

        // Validar campos requeridos
        const missingFields = validateRequiredFields();
        if (missingFields.length > 0) {
            showValidationModal(missingFields);
            return;
        }

        const data = collectFormData();

        showLoading();
        
        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                state.hasChanges = false;
                showNotification(`¡Paciente guardado! Ficha #${result.ficha_numero || result.patient_id}`, 'success');
                
                setTimeout(() => {
                    if (result.redirect_url) {
                        window.location.href = result.redirect_url;
                    } else {
                        window.location.href = `/dashboard/nutritionist/patients`;
                    }
                }, 1500);
                
            } else {
                throw new Error(result.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message || 'Error al guardar', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // ============================================
    // GUARDAR BORRADOR
    // ============================================
    window.guardarBorrador = function() {
        console.log('💾 Guardando borrador...');
        
        const data = collectFormData();
        
        showLoading();
        
        fetch(CONFIG.DRAFT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.success) {
                showNotification('✅ Borrador guardado', 'success');
                if (result.patient_id && !state.patientId) {
                    state.patientId = result.patient_id;
                }
            } else {
                showNotification('❌ Error: ' + result.error, 'error');
            }
        })
        .catch(error => {
            hideLoading();
            showNotification('❌ Error de conexión', 'error');
            console.error('Error:', error);
        });
    };
    
    // ============================================
    // UTILIDADES
    // ============================================
    function showLoading() {
        elements.loadingOverlay?.classList.add('show');
    }
    
    function hideLoading() {
        elements.loadingOverlay?.classList.remove('show');
    }
    
    function showNotification(message, type = 'success') {
        const prevNotification = document.querySelector('.notification');
        if (prevNotification) prevNotification.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white; padding: 1rem 1.5rem; border-radius: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999;
            display: flex; align-items: center; gap: 0.75rem;
            animation: slideInRight 0.3s ease; font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    async function init() {
        console.log('Inicializando Patient Intake Form V3.4...');
        
        detectInitialMode();
        await loadAlimentosDatabase();
        
        ObjetivosManager.init();
        RangeManager.init();
        ConditionalFields.init();
        FrequencyManager.init();
        RestriccionesManager.init();
        
        // Listeners de formulario
        if (elements.form) {
            elements.form.addEventListener('submit', handleFormSubmit);
            
            // DETECTAR CAMBIOS EN TODO EL FORMULARIO
            elements.form.addEventListener('input', markAsChanged);
            elements.form.addEventListener('change', markAsChanged);
        }
        
        // Listeners para cálculos
        if (elements.fechaNacimiento) {
            elements.fechaNacimiento.addEventListener('change', () => {
                calcularEdad();
                calcularGEB();
                calcularGET();
            });
        }
        
        if (elements.talla) {
            elements.talla.addEventListener('input', () => {
                calcularIMC();
                calcularGEB();
                calcularGET();
            });
        }
        
        if (elements.peso) {
            elements.peso.addEventListener('input', () => {
                calcularIMC();
                calcularGEB();
                calcularGET();
            });
        }
        
        if (elements.actividadFisica) {
            elements.actividadFisica.addEventListener('change', () => {
                calcularGET();
            });
        }
        
        // Listeners para pliegues
        Object.values(elements.pliegues).forEach(pliegue => {
            if (pliegue) {
                pliegue.addEventListener('input', () => calcularGrasa());
            }
        });
        
        // Listeners para perímetros
        if (elements.perimetroCintura) {
            elements.perimetroCintura.addEventListener('input', () => calcularICC());
        }
        
        if (elements.perimetroCadera) {
            elements.perimetroCadera.addEventListener('input', () => calcularICC());
        }
        
        // Listeners para macros
        ['proteinas_porcentaje', 'carbohidratos_porcentaje', 'grasas_porcentaje', 'liquidos_porcentaje'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => calcularMacros());
            }
        });
        
        // Establecer fecha de atención
        const fechaAtencion = document.getElementById('fecha_atencion');
        if (fechaAtencion && !fechaAtencion.value) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            fechaAtencion.value = now.toISOString().slice(0, 16);
        }
        
        console.log('Patient Intake Form V3.4 inicializado correctamente');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

// Estilos
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }

    /* Estilos para campos con error */
    .is-invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25) !important;
    }

    .field-error-label {
        color: #dc3545;
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }

    /* Estilos para restricciones alimentarias */
    .restricciones-group .form-check {
        padding: 0.5rem 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        border: 1px solid #dee2e6;
        transition: all 0.2s ease;
    }

    .restricciones-group .form-check:hover {
        background: #e9ecef;
        border-color: #adb5bd;
    }

    .restricciones-group .form-check-input:checked + .form-check-label {
        font-weight: 600;
    }

    .restricciones-group .form-check:has(.form-check-input:checked) {
        background: #d1e7dd;
        border-color: #0f5132;
    }

    /* Modal de validacion */
    #validationModal .modal-header {
        border-bottom: none;
    }

    #validationModal .modal-footer {
        border-top: none;
    }

    #missingFieldsList li {
        padding: 0.5rem;
        background: #fff5f5;
        border-radius: 0.375rem;
        border-left: 3px solid #dc3545;
    }
`;
document.head.appendChild(styles);

console.log('Patient Intake Form V3.4 cargado con validacion y toggle');