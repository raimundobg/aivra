/* ============================================
   PATIENT FILE EXPANDED - ZENLAB PRO V4.0
   CON TODAS LAS FUNCIONALIDADES DE PATIENT-INTAKE
   - Cálculos automáticos en tiempo real
   - Registro 24h completo
   - Frecuencia de consumo
   - Actualización automática al guardar
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
    // ESTADO GLOBAL
    // ============================================
    let state = {
        isEditMode: false,
        hasChanges: false,
        patientId: null,
        autoCalculateEnabled: true
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
        
        // Pliegues cutáneos (4 principales)
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
        
        // Macronutrientes (porcentajes)
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
            showNotification('Error cargando base de datos de alimentos', 'danger');
            return false;
        }
    }
    
    // ============================================
    // MODO EDICIÓN / VISUALIZACIÓN
    // ============================================
    window.toggleEditMode = function() {
        state.isEditMode = !state.isEditMode;
        
        if (state.isEditMode) {
            // ACTIVAR MODO EDICIÓN
            elements.form.classList.remove('view-mode');
            elements.form.classList.add('edit-mode');
            
            // Habilitar todos los campos
            elements.form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(field => {
                field.disabled = false;
            });
            
            // Cambiar botón Editar a Cancelar
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
            // DESACTIVAR MODO EDICIÓN
            elements.form.classList.remove('edit-mode');
            elements.form.classList.add('view-mode');
            
            // Deshabilitar todos los campos
            elements.form.querySelectorAll('input, select, textarea').forEach(field => {
                field.disabled = true;
            });
            
            // Cambiar botón Cancelar a Editar
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
    // CÁLCULOS ANTROPOMÉTRICOS - VERSIÓN EXPANDIDA
    // ============================================
    
    /**
     * Calcular edad a partir de fecha de nacimiento
     */
    window.calcularEdad = function() {
        const fechaNac = elements.fechaNacimiento?.value;
        if (!fechaNac) {
            console.log('⚠️ No hay fecha de nacimiento');
            return null;
        }
        
        const birth = new Date(fechaNac);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        console.log(`📅 Edad calculada: ${age} años`);
        
        // Actualizar UI
        const summaryEdad = document.getElementById('summaryEdad');
        if (summaryEdad) summaryEdad.textContent = age;
        
        return age;
    };
    
    /**
     * Calcular IMC (Índice de Masa Corporal)
     */
    window.calcularIMC = function() {
        const peso = parseFloat(elements.peso?.value);
        const talla = parseFloat(elements.talla?.value);
        
        if (!peso || !talla || talla <= 0) {
            console.log('⚠️ Faltan datos para calcular IMC');
            return null;
        }
        
        const imc = peso / (talla * talla);
        const imcRounded = Math.round(imc * 10) / 10;
        
        console.log(`📊 IMC calculado: ${imcRounded}`);
        
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
        
        console.log(`📊 Categoría IMC: ${categoria}`);
        
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
    };
    
    /**
     * Calcular % de Grasa Corporal (Durnin-Womersley)
     */
    window.calcularGrasa = function() {
        const pliegues = [
            parseFloat(elements.pliegues.bicipital?.value),
            parseFloat(elements.pliegues.tricipital?.value),
            parseFloat(elements.pliegues.subescapular?.value),
            parseFloat(elements.pliegues.supracrestideo?.value)
        ];
        
        // Verificar que todos los pliegues estén presentes
        if (pliegues.some(p => isNaN(p) || p <= 0)) {
            console.log('⚠️ Faltan datos de pliegues para calcular % grasa');
            return null;
        }
        
        const sumaPliegues = pliegues.reduce((a, b) => a + b, 0);
        const logPliegues = Math.log10(sumaPliegues);
        
        const edad = calcularEdad() || 30;
        const sexo = elements.sexo?.value;
        
        // Coeficientes Durnin-Womersley según edad y sexo
        let c, m;
        
        if (sexo === 'Masculino' || sexo === 'masculino') {
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
        
        console.log(`📊 % Grasa calculado: ${porcentajeGrasa}%`);
        
        // Actualizar UI
        const grasaValue = document.getElementById('grasaValue');
        const summaryGrasa = document.getElementById('summaryGrasa');
        
        if (grasaValue) grasaValue.textContent = porcentajeGrasa + '%';
        if (summaryGrasa) summaryGrasa.textContent = porcentajeGrasa + '%';
        
        markAsChanged();
        return porcentajeGrasa;
    };
    
    /**
     * Calcular ICC (Índice Cintura-Cadera)
     */
    window.calcularICC = function() {
        const cintura = parseFloat(elements.perimetroCintura?.value);
        const cadera = parseFloat(elements.perimetroCadera?.value);
        const sexo = elements.sexo?.value;
        
        if (!cintura || !cadera || cadera <= 0) {
            console.log('⚠️ Faltan datos para calcular ICC');
            return null;
        }
        
        const icc = Math.round((cintura / cadera) * 100) / 100;
        
        console.log(`📊 ICC calculado: ${icc}`);
        
        // Determinar riesgo cardiovascular
        let riesgo = 'Bajo';
        let cssClass = '';
        
        if (sexo === 'Masculino' || sexo === 'masculino') {
            if (icc >= 1.0) { riesgo = 'Alto'; cssClass = 'danger'; }
            else if (icc >= 0.95) { riesgo = 'Moderado'; cssClass = 'warning'; }
        } else {
            if (icc >= 0.85) { riesgo = 'Alto'; cssClass = 'danger'; }
            else if (icc >= 0.80) { riesgo = 'Moderado'; cssClass = 'warning'; }
        }
        
        console.log(`📊 Riesgo CV: ${riesgo}`);
        
        // Actualizar UI
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
    };
    
    // ============================================
    // CONTINÚA EN MENSAJE 2...
    // ============================================
    // ============================================
    // CÁLCULOS NUTRICIONALES
    // ============================================
    
    /**
     * Calcular GEB (Gasto Energético Basal) - Harris-Benedict
     */
    window.calcularGEB = function() {
        const peso = parseFloat(elements.peso?.value);
        const talla = parseFloat(elements.talla?.value);
        const sexo = elements.sexo?.value;
        const edad = calcularEdad();
        
        if (!peso || !talla || !sexo || !edad) {
            console.log('⚠️ Faltan datos para calcular GEB');
            return null;
        }
        
        const alturaCm = talla * 100;
        let geb;
        
        // Harris-Benedict revisada
        if (sexo === 'Masculino' || sexo === 'masculino') {
            geb = 88.362 + (13.397 * peso) + (4.799 * alturaCm) - (5.677 * edad);
        } else {
            geb = 447.593 + (9.247 * peso) + (3.098 * alturaCm) - (4.330 * edad);
        }
        
        geb = Math.round(geb);
        
        console.log(`🔥 GEB calculado: ${geb} kcal`);
        
        // Actualizar UI
        const gebValue = document.getElementById('gebValue');
        if (gebValue) gebValue.textContent = geb;
        
        return geb;
    };
    
    /**
     * Calcular GET (Gasto Energético Total)
     */
    window.calcularGET = function() {
        const geb = calcularGEB();
        if (!geb) {
            console.log('⚠️ No se puede calcular GET sin GEB');
            return null;
        }
        
        const actividad = elements.actividadFisica?.value;
        const factorActividad = CONFIG.FACTORES_ACTIVIDAD[actividad] || 1.2;
        
        const get = Math.round(geb * factorActividad);
        
        console.log(`🔥 GET calculado: ${get} kcal (factor: ${factorActividad})`);
        
        // Actualizar UI
        const getValue = document.getElementById('getValue');
        const summaryGET = document.getElementById('summaryGET');
        
        if (getValue) getValue.textContent = get;
        if (summaryGET) summaryGET.textContent = get;
        
        // Recalcular macros con nuevo GET
        calcularMacros();
        
        markAsChanged();
        return get;
    };
    
    /**
     * Calcular distribución de Macronutrientes
     */
    window.calcularMacros = function() {
        const getEl = document.getElementById('getValue');
        const get = parseFloat(getEl?.textContent);
        
        if (!get || isNaN(get)) {
            console.log('⚠️ No hay GET para calcular macros');
            return null;
        }
        
        const protPct = parseFloat(elements.proteinasPct?.value) || 20;
        const carbPct = parseFloat(elements.carbohidratosPct?.value) || 50;
        const grasPct = parseFloat(elements.grasasPct?.value) || 30;
        
        console.log(`🍽️ Distribución: P:${protPct}% C:${carbPct}% G:${grasPct}%`);
        
        // Validar que sumen 100%
        const total = protPct + carbPct + grasPct;
        const totalBadge = document.getElementById('totalPorcentaje');
        if (totalBadge) {
            totalBadge.textContent = total + '%';
            totalBadge.className = total === 100 ? 'badge bg-success' : 'badge bg-danger';
        }
        
        // Calcular gramos (4 kcal/g para P y C, 9 kcal/g para G)
        const proteinasG = Math.round((get * protPct / 100) / 4);
        const carbohidratosG = Math.round((get * carbPct / 100) / 4);
        const grasasG = Math.round((get * grasPct / 100) / 9);
        const fibraG = Math.round(get * 14 / 1000); // 14g por cada 1000 kcal
        
        console.log(`🍽️ Macros: ${proteinasG}g P, ${carbohidratosG}g C, ${grasasG}g G, ${fibraG}g Fibra`);
        
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
    
    /**
     * Recalcular TODOS los requerimientos
     */
    window.calcularRequerimientos = function() {
        console.log('🔄 Recalculando todos los requerimientos...');
        
        calcularEdad();
        calcularIMC();
        calcularGrasa();
        calcularICC();
        calcularGEB();
        calcularGET();
        calcularMacros();
        
        showNotification('✅ Cálculos actualizados', 'success');
    };
    
    // ============================================
    // REGISTRO 24 HORAS - FUNCIONES GLOBALES
    // ============================================
    
    /**
     * Cargar subgrupos según grupo seleccionado
     */
    window.loadSubgrupos = function(selectElement, mealType, rowIndex) {
        const grupo = selectElement.value;
        const row = selectElement.closest('tr');
        const subgrupoSelect = row.querySelector('.subgrupo-select');
        const alimentoSelect = row.querySelector('.alimento-select');
        const porcionCell = row.querySelector('.porcion-cell');
        
        // Resetear campos dependientes
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
    
    /**
     * Cargar alimentos según subgrupo seleccionado
     */
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
        
        // Cargar opciones de alimentos
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
    
    /**
     * Cargar porción y crear selector de multiplicador
     */
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
    
    /**
     * Calcular nutrientes con multiplicador
     */
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
    
    /**
     * Agregar fila de comida
     */
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
    
    /**
     * Eliminar fila de comida
     */
    window.removeRow = function(button) {
        const row = button.closest('tr');
        const mealType = row.dataset.meal;
        const tbody = row.parentElement;
        
        if (tbody.querySelectorAll('tr').length > 1) {
            row.remove();
            updateMealTotals(mealType);
        }
    };
    
    /**
     * Actualizar totales de una comida
     */
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
    
    /**
     * Actualizar resumen diario
     */
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
    
    /**
     * Inicializar dropdowns de grupos
     */
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
    // CONTINÚA EN MENSAJE 3...
    // ============================================
    // ============================================
    // RECOLECCIÓN DE DATOS DEL FORMULARIO
    // ============================================
    
    /**
     * Recolectar datos del registro 24h
     */
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
        
        // Agregar totales del día
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
    
    /**
     * Recolectar datos de frecuencia de consumo
     */
    function collectFrequencyData() {
        const frequency = {};
        
        // Capturar botones de frecuencia
        document.querySelectorAll('.frequency-selector').forEach(selector => {
            const group = selector.dataset.group;
            const activeBtn = selector.querySelector('.freq-btn.active');
            frequency[group] = activeBtn ? parseInt(activeBtn.dataset.value) : 0;
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
    // GUARDAR PACIENTE - VERSIÓN EXPANDIDA
    // ============================================
    window.savePatient = async function() {
        if (!state.isEditMode) {
            console.warn('❌ No estás en modo edición');
            return;
        }
        
        const patientId = document.getElementById('patientId').value;
        const form = document.getElementById('patientFileForm');
        const formData = new FormData(form);
        const data = {};
        
        console.log('🔍 ========== INICIANDO GUARDADO ==========');
        console.log('📋 Patient ID:', patientId);
        
        // ============================================
        // 1. CAMPOS BÁSICOS DEL FORMULARIO
        // ============================================
        console.log('\n📥 PASO 1: Recolectando campos básicos...');
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
            if (value) {
                console.log(`  ✓ ${key}: ${value}`);
            }
        }
        
        console.log(`✅ Total campos básicos: ${Object.keys(data).length}`);
        
        // ============================================
        // 2. CAMPOS DE SELECCIÓN MÚLTIPLE
        // ============================================
        console.log('\n📥 PASO 2: Capturando campos de selección múltiple...');
        
        const multipleSelectFields = [
            'diagnosticos', 'medicamentos', 'suplementos', 
            'quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol'
        ];
        
        multipleSelectFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.multiple) {
                const selectedValues = Array.from(element.selectedOptions).map(opt => opt.value);
                if (selectedValues.length > 0) {
                    data[fieldName] = selectedValues;
                    console.log(`  ✓ ${fieldName}: [${selectedValues.join(', ')}]`);
                } else {
                    console.log(`  ℹ️ ${fieldName}: sin selecciones`);
                }
            }
        });
        
        // ============================================
        // 3. PLIEGUES CUTÁNEOS
        // ============================================
        console.log('\n📥 PASO 3: Capturando pliegues cutáneos...');
        
        const plieguesFields = [
            'pliegue_bicipital', 'pliegue_tricipital',
            'pliegue_subescapular', 'pliegue_supracrestideo',
            'pliegue_abdominal', 'pliegue_muslo', 'pliegue_pantorrilla'
        ];
        
        plieguesFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.value) {
                data[fieldName] = parseFloat(element.value);
                console.log(`  ✓ ${fieldName}: ${element.value}`);
            }
        });
        
        // ============================================
        // 4. PERÍMETROS
        // ============================================
        console.log('\n📥 PASO 4: Capturando perímetros...');
        
        const perimetrosFields = [
            'perimetro_brazo', 'perimetro_brazo_contraido',
            'perimetro_cintura', 'perimetro_cadera',
            'perimetro_muslo', 'perimetro_pantorrilla', 'perimetro_muneca'
        ];
        
        perimetrosFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.value) {
                data[fieldName] = parseFloat(element.value);
                console.log(`  ✓ ${fieldName}: ${element.value}`);
            }
        });
        
        // ============================================
        // 5. DIÁMETROS ÓSEOS
        // ============================================
        console.log('\n📥 PASO 5: Capturando diámetros óseos...');
        
        const diametrosFields = [
            'diametro_humero', 'diametro_femur', 'diametro_muneca'
        ];
        
        diametrosFields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && element.value) {
                data[fieldName] = parseFloat(element.value);
                console.log(`  ✓ ${fieldName}: ${element.value}`);
            }
        });
        
        // ============================================
        // 6. REGISTRO 24H Y FRECUENCIA
        // ============================================
        console.log('\n📥 PASO 6: Capturando registro 24h y frecuencia...');
        
        data.registro_24h = collect24hData();
        data.frecuencia_consumo = collectFrequencyData();
        
        console.log(`  ✓ Registro 24h: ${JSON.stringify(data.registro_24h).length} caracteres`);
        console.log(`  ✓ Frecuencia consumo: ${Object.keys(data.frecuencia_consumo).length} campos`);
        
        // ============================================
        // 7. ENVIAR AL BACKEND
        // ============================================
        console.log('\n🌐 ========== ENVIANDO AL SERVIDOR ==========');
        showLoading();
        updateSaveStatus('saving');
        
        try {
            console.log(`📤 PUT /api/patients/${patientId}`);
            
            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            console.log(`📥 Respuesta recibida: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Respuesta exitosa:', result);
                
                // Actualizar valores calculados
                if (result.patient) {
                    updateCalculatedFields(result.patient);
                    updatePatientSummary(result.patient);
                }
                
                state.hasChanges = false;
                updateSaveStatus('saved');
                showNotification('✅ Ficha guardada exitosamente', 'success');
                
                // Salir del modo edición después de 1 segundo
                setTimeout(() => {
                    toggleEditMode();
                }, 1000);
                
            } else {
                const errorData = await response.json();
                console.error('❌ Error del servidor:', errorData);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error en el guardado:', error);
            updateSaveStatus('pending');
            showNotification('❌ Error al guardar: ' + error.message, 'danger');
        } finally {
            hideLoading();
            console.log('🔍 ========== FIN DEL GUARDADO ==========\n');
        }
    };
    
    // ============================================
    // CARGAR DATOS DEL PACIENTE
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
            
            // Llenar todos los campos
            fillBasicFields(patient);
            fillMultipleSelects(patient);
            fillAnthropometry(patient);
            fillGastroFields(patient);
            fillFoodData(patient);
            
            // Actualizar valores calculados
            updateCalculatedFields(patient);
            updatePatientSummary(patient);
            
            console.log('✅ Todos los datos cargados correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando datos del paciente:', error);
            showNotification('❌ Error al cargar los datos del paciente', 'danger');
        }
    }
    
    /**
     * Llenar campos básicos de texto y numéricos
     */
    function fillBasicFields(patient) {
        console.log('🔄 Llenando campos básicos...');
        
        const textFields = [
            'nombre', 'fecha_nacimiento', 'sexo', 'email', 'telefono',
            'direccion', 'ocupacion', 'motivo_consulta', 'profesion',
            'teletrabajo', 'horas_sueno', 'observaciones_sueno',
            'gatillantes_estres', 'manejo_estres', 'consumo_alcohol',
            'tabaco', 'drogas', 'actividad_fisica', 'tipo_ejercicio',
            'objetivos', 'fecha_atencion', 'reflujo_alimento', 
            'hinchazon_alimento', 'alergias_alimento', 'frecuencia_evacuacion'
        ];
        
        textFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field] !== null && patient[field] !== undefined) {
                element.value = patient[field];
            }
        });
        
        // Campos numéricos
        const numericFields = [
            'talla_m', 'peso_kg', 'calidad_sueno', 'nivel_estres', 
            'duracion_ejercicio', 'peso_ideal'
        ];
        
        numericFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field] !== null && patient[field] !== undefined) {
                element.value = patient[field];
            }
        });
        
        console.log('✅ Campos básicos llenados');
    }
    
    /**
     * Llenar campos de selección múltiple
     */
    function fillMultipleSelects(patient) {
        console.log('🔄 Llenando campos de selección múltiple...');
        
        const multipleSelectFields = [
            'diagnosticos', 'medicamentos', 'suplementos',
            'quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol'
        ];
        
        multipleSelectFields.forEach(fieldName => {
            const selectElement = document.getElementById(fieldName);
            
            if (!selectElement) {
                console.warn(`  ⚠️ Campo ${fieldName} no encontrado en el DOM`);
                return;
            }
            
            let savedValues = patient[fieldName];
            
            if (!savedValues) {
                return;
            }
            
            // Si es string, parsear como JSON
            if (typeof savedValues === 'string') {
                try {
                    savedValues = JSON.parse(savedValues);
                } catch (e) {
                    console.warn(`  ⚠️ Error parseando ${fieldName}:`, e);
                    return;
                }
            }
            
            // Si no es array, salir
            if (!Array.isArray(savedValues)) {
                console.warn(`  ⚠️ ${fieldName} no es un array`);
                return;
            }
            
            // Marcar opciones como seleccionadas
            Array.from(selectElement.options).forEach(option => {
                option.selected = savedValues.includes(option.value);
            });
            
            console.log(`  ✓ ${fieldName}: ${savedValues.length} opciones seleccionadas`);
        });
        
        console.log('✅ Selecciones múltiples llenadas');
    }
    
    /**
     * Llenar datos antropométricos
     */
    function fillAnthropometry(patient) {
        console.log('🔄 Llenando antropometría...');
        
        // Pliegues cutáneos
        const plieguesFields = [
            'pliegue_bicipital', 'pliegue_tricipital',
            'pliegue_subescapular', 'pliegue_supracrestideo',
            'pliegue_abdominal', 'pliegue_muslo', 'pliegue_pantorrilla'
        ];
        
        plieguesFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field] !== null && patient[field] !== undefined) {
                element.value = patient[field];
            }
        });
        
        // Perímetros
        const perimetrosFields = [
            'perimetro_brazo', 'perimetro_brazo_contraido',
            'perimetro_cintura', 'perimetro_cadera',
            'perimetro_muslo', 'perimetro_pantorrilla', 'perimetro_muneca'
        ];
        
        perimetrosFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field] !== null && patient[field] !== undefined) {
                element.value = patient[field];
            }
        });
        
        console.log('✅ Antropometría llenada');
    }
    
    /**
     * Llenar campos gastrointestinales
     */
    function fillGastroFields(patient) {
        const gastroFields = [
            'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento',
            'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento'
        ];
        
        gastroFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && patient[field] !== null && patient[field] !== undefined) {
                element.value = patient[field];
            }
        });
    }
    
    /**
     * Llenar datos de alimentos (registro 24h y frecuencia)
     */
    function fillFoodData(patient) {
        // TODO: Implementar carga de registro 24h y frecuencia de consumo
        // cuando se tenga la estructura de tablas en el HTML
        console.log('ℹ️ Carga de datos de alimentos pendiente de implementar');
    }
    
    // ============================================
    // CONTINÚA EN MENSAJE 4...
    // ============================================
    // ============================================
    // ACTUALIZAR UI CON VALORES CALCULADOS
    // ============================================
    
    /**
     * Actualizar campos calculados en la UI
     */
    function updateCalculatedFields(patient) {
        console.log('🔄 Actualizando campos calculados...');
        
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
        
        console.log('✅ Campos calculados actualizados');
    }
    
    /**
     * Actualizar resumen del paciente (header)
     */
    function updatePatientSummary(patient) {
        console.log('🔄 Actualizando resumen del paciente...');
        
        if (patient.edad) {
            const summaryEdad = document.getElementById('summaryEdad');
            if (summaryEdad) summaryEdad.textContent = patient.edad;
        }
        
        if (patient.imc) {
            const summaryIMC = document.getElementById('summaryIMC');
            if (summaryIMC) summaryIMC.textContent = patient.imc.toFixed(1);
        }
        
        if (patient.porcentaje_grasa) {
            const summaryGrasa = document.getElementById('summaryGrasa');
            if (summaryGrasa) summaryGrasa.textContent = patient.porcentaje_grasa.toFixed(1) + '%';
        }
        
        if (patient.get_kcal) {
            const summaryGET = document.getElementById('summaryGET');
            if (summaryGET) summaryGET.textContent = Math.round(patient.get_kcal);
        }
        
        if (patient.proteinas_g) {
            const summaryProteinas = document.getElementById('summaryProteinas');
            if (summaryProteinas) summaryProteinas.textContent = Math.round(patient.proteinas_g) + 'g';
        }
        
        console.log('✅ Resumen del paciente actualizado');
    }
    
    // ============================================
    // UI HELPERS
    // ============================================
    
    /**
     * Actualizar estado de guardado
     */
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
    
    /**
     * Marcar que hay cambios sin guardar
     */
    function markAsChanged() {
        if (state.isEditMode) {
            state.hasChanges = true;
            updateSaveStatus('pending');
        }
    }
    
    /**
     * Mostrar overlay de carga
     */
    function showLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('show');
        }
    }
    
    /**
     * Ocultar overlay de carga
     */
    function hideLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('show');
        }
    }
    
    /**
     * Mostrar notificación toast
     */
    function showNotification(message, type = 'success') {
        const prevNotification = document.querySelector('.toast-notification');
        if (prevNotification) prevNotification.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
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
    // NAVEGACIÓN Y SCROLL
    // ============================================
    
    /**
     * Scroll a una sección específica
     */
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Abrir el acordeón si está cerrado
        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
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
    // INICIALIZACIÓN DE SLIDERS
    // ============================================
    
    function initSliders() {
        console.log('🎚️ Inicializando sliders...');
        
        // Calidad del sueño
        if (elements.calidadSueno) {
            const calidadSuenoValue = document.getElementById('calidadSuenoValue');
            
            elements.calidadSueno.addEventListener('input', function() {
                if (calidadSuenoValue) calidadSuenoValue.textContent = this.value;
                markAsChanged();
            });
            
            // Establecer valor inicial
            if (calidadSuenoValue) {
                calidadSuenoValue.textContent = elements.calidadSueno.value;
            }
        }
        
        // Nivel de estrés
        if (elements.nivelEstres) {
            const estresValue = document.getElementById('estresValue');
            
            elements.nivelEstres.addEventListener('input', function() {
                if (estresValue) estresValue.textContent = this.value;
                markAsChanged();
            });
            
            // Establecer valor inicial
            if (estresValue) {
                estresValue.textContent = elements.nivelEstres.value;
            }
        }
        
        console.log('✅ Sliders inicializados');
    }
    
    // ============================================
    // INICIALIZACIÓN DE FRECUENCIA DE CONSUMO
    // ============================================
    
    function initFrequencyButtons() {
        console.log('🔘 Inicializando botones de frecuencia...');
        
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
        
        console.log('✅ Botones de frecuencia inicializados');
    }
    
    // ============================================
    // LISTENERS DE CAMPOS DE CÁLCULO
    // ============================================
    
    function initFormListeners() {
        console.log('👂 Inicializando listeners del formulario...');
        
        if (!elements.form) {
            console.warn('⚠️ Formulario no encontrado');
            return;
        }
        
        // Escuchar cambios en cualquier campo
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
        
        // Prevenir envío del formulario
        elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            savePatient();
        });
        
        // ============================================
        // LISTENERS PARA CÁLCULOS AUTOMÁTICOS
        // ============================================
        
        // Peso y Talla → IMC, GEB, GET
        if (elements.peso) {
            elements.peso.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando por cambio en peso...');
                    calcularIMC();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        if (elements.talla) {
            elements.talla.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando por cambio en talla...');
                    calcularIMC();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        // Fecha de Nacimiento → Edad, GEB, GET
        if (elements.fechaNacimiento) {
            elements.fechaNacimiento.addEventListener('change', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando por cambio en fecha de nacimiento...');
                    calcularEdad();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        // Sexo → Grasa, GEB, GET
        if (elements.sexo) {
            elements.sexo.addEventListener('change', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando por cambio en sexo...');
                    calcularGrasa();
                    calcularGEB();
                    calcularGET();
                }
            });
        }
        
        // Actividad Física → GET
        if (elements.actividadFisica) {
            elements.actividadFisica.addEventListener('change', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando GET por cambio en actividad física...');
                    calcularGET();
                }
            });
        }
        
        // Pliegues cutáneos → % Grasa
        Object.values(elements.pliegues).forEach(pliegue => {
            if (pliegue) {
                pliegue.addEventListener('input', () => {
                    if (state.isEditMode && state.autoCalculateEnabled) {
                        console.log('📊 Recalculando % grasa por cambio en pliegues...');
                        calcularGrasa();
                    }
                });
            }
        });
        
        // Perímetros → ICC
        if (elements.perimetroCintura) {
            elements.perimetroCintura.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando ICC por cambio en cintura...');
                    calcularICC();
                }
            });
        }
        
        if (elements.perimetroCadera) {
            elements.perimetroCadera.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando ICC por cambio en cadera...');
                    calcularICC();
                }
            });
        }
        
        // Porcentajes de macros → Gramos
        if (elements.proteinasPct) {
            elements.proteinasPct.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando macros por cambio en % proteínas...');
                    calcularMacros();
                }
            });
        }
        
        if (elements.carbohidratosPct) {
            elements.carbohidratosPct.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando macros por cambio en % carbohidratos...');
                    calcularMacros();
                }
            });
        }
        
        if (elements.grasasPct) {
            elements.grasasPct.addEventListener('input', () => {
                if (state.isEditMode && state.autoCalculateEnabled) {
                    console.log('📊 Recalculando macros por cambio en % grasas...');
                    calcularMacros();
                }
            });
        }
        
        console.log('✅ Listeners del formulario inicializados');
    }
    
    // ============================================
    // INICIALIZACIÓN PRINCIPAL
    // ============================================
    
    async function init() {
        console.log('🚀 ========================================');
        console.log('🚀 PATIENT FILE EXPANDED V4.0 - INICIANDO');
        console.log('🚀 ========================================');
        
        // Obtener ID del paciente
        state.patientId = elements.patientId?.value;
        
        if (!state.patientId) {
            console.warn('⚠️ No se encontró ID de paciente');
            return;
        }
        
        console.log('📋 Patient ID:', state.patientId);
        
        // Cargar base de datos de alimentos
        await loadAlimentosDatabase();
        
        // Inicializar módulos
        initSliders();
        initFrequencyButtons();
        initFormListeners();
        
        // Inicializar en modo visualización
        if (elements.form) {
            elements.form.classList.add('view-mode');
            elements.form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(field => {
                field.disabled = true;
            });
        }
        
        if (elements.btnSave) {
            elements.btnSave.disabled = true;
        }
        
        // Cargar datos del paciente
        await loadPatientData(state.patientId);
        
        // Calcular valores iniciales
        calcularEdad();
        
        console.log('✅ ========================================');
        console.log('✅ PATIENT FILE EXPANDED V4.0 - LISTO');
        console.log('✅ ========================================');
    }
    
    // ============================================
    // EJECUTAR CUANDO EL DOM ESTÉ LISTO
    // ============================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ============================================
    // CONTINÚA EN MENSAJE 5...
    // ============================================
    // ============================================
    // ESTILOS CSS INLINE
    // ============================================
    
    const patientFileStyles = document.createElement('style');
    patientFileStyles.textContent = `
        /* Animaciones */
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
        
        /* Selector de cantidad (multiplicador) */
        .cantidad-select {
            font-weight: 600 !important;
            border: 2px solid #10b981 !important;
            color: #059669 !important;
            transition: all 0.2s ease;
        }
        
        .cantidad-select:focus {
            border-color: #059669 !important;
            box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25) !important;
        }
        
        .cantidad-select:hover {
            background-color: #f0fdf4 !important;
        }
        
        /* Modo visualización */
        .view-mode input:not([type="hidden"]),
        .view-mode select,
        .view-mode textarea {
            background-color: #f8f9fa !important;
            border-color: #dee2e6 !important;
            cursor: not-allowed;
            opacity: 0.7;
        }
        
        .view-mode .btn:not(.btn-edit):not(.btn-print) {
            pointer-events: none;
            opacity: 0.5;
        }
        
        /* Modo edición */
        .edit-mode input:not([type="hidden"]):not([disabled]),
        .edit-mode select:not([disabled]),
        .edit-mode textarea:not([disabled]) {
            background-color: white !important;
            border-color: #10b981 !important;
            border-width: 2px !important;
            transition: all 0.2s ease;
        }
        
        .edit-mode input:focus,
        .edit-mode select:focus,
        .edit-mode textarea:focus {
            border-color: #059669 !important;
            box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.15) !important;
        }
        
        /* Estado de guardado */
        .save-status {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            font-size: 0.875rem;
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
        
        /* Campos calculados */
        .calculated-field {
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 2px solid #e5e7eb;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            transition: all 0.3s ease;
        }
        
        .calculated-field.warning {
            border-color: #fbbf24;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }
        
        .calculated-field.danger {
            border-color: #ef4444;
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }
        
        .calculated-field .calculated-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
        }
        
        .calculated-field .calculated-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            font-weight: 600;
        }
        
        /* Loading overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-overlay.show {
            display: flex;
        }
        
        .loading-spinner {
            width: 3rem;
            height: 3rem;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Tablas de registro 24h */
        .meal-row {
            transition: background-color 0.2s ease;
        }
        
        .meal-row:hover {
            background-color: #f9fafb;
        }
        
        .nutrient-cell {
            font-weight: 600;
            color: #059669;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        /* Botones de frecuencia */
        .freq-btn {
            transition: all 0.2s ease;
            border: 2px solid #e5e7eb;
            background: white;
        }
        
        .freq-btn:hover:not(.active) {
            border-color: #10b981;
            background: #f0fdf4;
        }
        
        .freq-btn.active {
            border-color: #10b981;
            background: #10b981;
            color: white;
            font-weight: 600;
        }
        
        /* Quick navigation */
        .quick-nav-item {
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
            padding-left: 1rem;
        }
        
        .quick-nav-item:hover {
            border-left-color: #10b981;
            background-color: #f0fdf4;
        }
        
        .quick-nav-item.active {
            border-left-color: #059669;
            background-color: #d1fae5;
            font-weight: 600;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .calculated-field .calculated-value {
                font-size: 1.25rem;
            }
            
            .save-status {
                font-size: 0.75rem;
                padding: 0.375rem 0.75rem;
            }
        }
    `;
    document.head.appendChild(patientFileStyles);
    
    // ============================================
    // LOG DE INICIALIZACIÓN
    // ============================================
    
    console.log('%c✅ PATIENT FILE EXPANDED V4.0 CARGADO', 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.log('%c📊 Cálculos automáticos: ACTIVADOS', 'color: #3b82f6; font-weight: bold;');
    console.log('%c🍎 Base de datos de alimentos: LISTA', 'color: #f59e0b; font-weight: bold;');
    console.log('%c💾 Sistema de guardado: LISTO', 'color: #8b5cf6; font-weight: bold;');
    
})();

// ============================================
// FIN DEL MÓDULO
// ============================================