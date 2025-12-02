/* ============================================
   PATIENT INTAKE FORM V3.1 - ZENLAB PRO
   CORREGIDO: Con multiplicadores de porción
   ============================================ */

   (function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_ENDPOINT: '/api/patients',
        ALIMENTOS_ENDPOINT: '/api/alimentos',
        DRAFT_ENDPOINT: '/api/patient/save-draft',
        IMC_CATEGORIES: {
            bajo: { min: 0, max: 18.5, label: 'Bajo peso', class: 'text-warning' },
            normal: { min: 18.5, max: 24.9, label: 'Peso normal', class: 'text-success' },
            sobrepeso: { min: 25, max: 29.9, label: 'Sobrepeso', class: 'text-warning' },
            obesidad1: { min: 30, max: 34.9, label: 'Obesidad I', class: 'text-danger' },
            obesidad2: { min: 35, max: 39.9, label: 'Obesidad II', class: 'text-danger' },
            obesidad3: { min: 40, max: 100, label: 'Obesidad III', class: 'text-danger' }
        }
    };
    
    // ============================================
    // OPCIONES DE MULTIPLICADORES
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
    // ELEMENTOS DEL DOM
    // ============================================
    const elements = {
        form: document.getElementById('patientIntakeForm'),
        patient_id: document.getElementById('patient_id'),
        fechaNacimiento: document.getElementById('fechaNacimiento'),
        edadCalculada: document.getElementById('edadCalculada'),
        sexo: document.getElementById('sexo'),
        objetivosBtns: document.querySelectorAll('.pill-btn[data-objetivo]'),
        objetivosHidden: document.getElementById('objetivos'),
        talla: document.getElementById('talla'),
        peso: document.getElementById('peso'),
        imcCalculado: document.getElementById('imcCalculado'),
        imcCategoria: document.getElementById('imcCategoria'),
        calidadSueno: document.getElementById('calidad_sueno'),
        calidadSuenoValue: document.getElementById('calidadSuenoValue'),
        nivelEstres: document.getElementById('nivel_estres'),
        estresValue: document.getElementById('estresValue'),
        formProgress: document.getElementById('formProgress'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        consumoAlcohol: document.getElementById('consumo_alcohol'),
        tipoAlcoholContainer: document.getElementById('tipoAlcoholContainer'),
        reflujo: document.getElementById('reflujo'),
        reflujoAlimentoContainer: document.getElementById('reflujoAlimentoContainer'),
        hinchazon: document.getElementById('hinchazon'),
        hinchazonAlimentoContainer: document.getElementById('hinchazonAlimentoContainer'),
        tieneAlergias: document.getElementById('tiene_alergias'),
        alergiasAlimentoContainer: document.getElementById('alergiasAlimentoContainer')
    };
    
    // ============================================
    // CARGAR BASE DE DATOS DE ALIMENTOS DESDE API
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
    // CALCULADORA DE EDAD
    // ============================================
    const AgeCalculator = {
        calculate: function(birthDate) {
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        },
        
        update: function() {
            const birthDate = elements.fechaNacimiento?.value;
            if (birthDate && elements.edadCalculada) {
                const age = this.calculate(birthDate);
                elements.edadCalculada.textContent = age;
                elements.edadCalculada.classList.add('fw-bold', 'text-primary');
            }
        }
    };
    
    // ============================================
    // CALCULADORA DE IMC
    // ============================================
    const IMCCalculator = {
        calculate: function(peso, talla) {
            if (!peso || !talla || talla <= 0) return null;
            return peso / (talla * talla);
        },
        
        getCategory: function(imc) {
            for (const [key, category] of Object.entries(CONFIG.IMC_CATEGORIES)) {
                if (imc >= category.min && imc < category.max) {
                    return category;
                }
            }
            return null;
        },
        
        update: function() {
            const peso = parseFloat(elements.peso?.value);
            const talla = parseFloat(elements.talla?.value);
            
            if (peso && talla && talla > 0) {
                const imc = this.calculate(peso, talla);
                const category = this.getCategory(imc);
                
                if (elements.imcCalculado) {
                    elements.imcCalculado.textContent = imc.toFixed(1);
                    elements.imcCalculado.classList.add('highlight');
                }
                
                if (category && elements.imcCategoria) {
                    elements.imcCategoria.textContent = category.label;
                    elements.imcCategoria.className = `text-muted text-center d-block ${category.class}`;
                }
            } else {
                if (elements.imcCalculado) {
                    elements.imcCalculado.textContent = '-';
                    elements.imcCalculado.classList.remove('highlight');
                }
                if (elements.imcCategoria) {
                    elements.imcCategoria.textContent = '';
                }
            }
        }
    };
    
    // ============================================
    // OBJETIVOS MANAGER
    // ============================================
    const ObjetivosManager = {
        selectedObjetivos: [],
        
        toggle: function(btn) {
            btn.classList.toggle('active');
            this.updateSelected();
        },
        
        updateSelected: function() {
            this.selectedObjetivos = Array.from(elements.objetivosBtns)
                .filter(btn => btn.classList.contains('active'))
                .map(btn => btn.dataset.objetivo);
            
            if (elements.objetivosHidden) {
                elements.objetivosHidden.value = this.selectedObjetivos.join(',');
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
    // PROGRESS BAR
    // ============================================
    const ProgressBar = {
        requiredFields: [],
        
        init: function() {
            if (elements.form) {
                this.requiredFields = elements.form.querySelectorAll('[required]');
                this.update();
            }
        },
        
        update: function() {
            let filled = 0;
            
            this.requiredFields.forEach(field => {
                if (field.type === 'hidden') {
                    if (field.value.trim() !== '') filled++;
                } else if (field.value.trim() !== '') {
                    filled++;
                }
            });
            
            const progress = (filled / this.requiredFields.length) * 100;
            if (elements.formProgress) {
                elements.formProgress.style.width = progress + '%';
            }
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
                });
            }
            
            if (elements.nivelEstres && elements.estresValue) {
                elements.nivelEstres.addEventListener('input', function() {
                    elements.estresValue.textContent = this.value;
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
                });
            }
            
            if (elements.reflujo) {
                elements.reflujo.addEventListener('change', function() {
                    const container = elements.reflujoAlimentoContainer;
                    container.style.display = this.value === 'si' ? 'block' : 'none';
                });
            }
            
            if (elements.hinchazon) {
                elements.hinchazon.addEventListener('change', function() {
                    const container = elements.hinchazonAlimentoContainer;
                    container.style.display = this.value === 'si' ? 'block' : 'none';
                });
            }
            
            if (elements.tieneAlergias) {
                elements.tieneAlergias.addEventListener('change', function() {
                    const container = elements.alergiasAlimentoContainer;
                    container.style.display = this.value === 'si' ? 'block' : 'none';
                });
            }
        }
    };
    
    // ============================================
    // FRECUENCIA DE CONSUMO
    // ============================================
    const FrequencyManager = {
        init: function() {
            document.querySelectorAll('.frequency-selector').forEach(selector => {
                const group = selector.dataset.group;
                const buttons = selector.querySelectorAll('.freq-btn');
                const parentTd = selector.closest('td');
                const hiddenInput = parentTd ? parentTd.parentElement.querySelector(`input[name="freq_${group}"]`) : null;
                
                buttons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        buttons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        if (hiddenInput) {
                            hiddenInput.value = btn.dataset.value;
                        }
                    });
                });
            });
        }
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
        porcionCell.innerHTML = '<span class="text-muted">-</span>';
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
        porcionCell.innerHTML = '<span class="text-muted">-</span>';
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
    
    // ============================================
    // FUNCIÓN CORREGIDA: loadPorcion con MULTIPLICADORES
    // ============================================
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
    
    // ============================================
    // FUNCIÓN NUEVA: Calcular nutrientes con multiplicador
    // ============================================
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
    
    // ============================================
    // AGREGAR FILA DE COMIDA
    // ============================================
    window.addMealRow = function(mealType) {
        const table = document.getElementById(`${mealType}Table`);
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
    // RECOLECCIÓN DE DATOS DEL FORMULARIO
    // ============================================
    const FormManager = {
        collectData: function() {
            const formData = new FormData(elements.form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            ['diagnosticos', 'medicamentos', 'suplementos', 'quien_cocina', 'con_quien_vive', 'donde_come', 'tipo_alcohol'].forEach(field => {
                const element = document.getElementById(field);
                if (element && element.multiple) {
                    data[field] = Array.from(element.selectedOptions).map(opt => opt.value);
                }
            });
            
            data.registro_24h = this.collect24hData();
            data.frecuencia_consumo = this.collectFrequencyData();
            
            return data;
        },
        
        collect24hData: function() {
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
            
            registro.totales = {
                kcal: parseFloat(document.getElementById('totalDiaKcal').textContent) || 0,
                proteinas: parseFloat(document.getElementById('totalDiaProt').textContent) || 0,
                carbohidratos: parseFloat(document.getElementById('totalDiaCarbs').textContent) || 0,
                lipidos: parseFloat(document.getElementById('totalDiaLipidos').textContent) || 0
            };
            
            return registro;
        },
        
        collectFrequencyData: function() {
            const frequency = {};
            
            document.querySelectorAll('.frequency-selector').forEach(selector => {
                const group = selector.dataset.group;
                const activeBtn = selector.querySelector('.freq-btn.active');
                frequency[group] = activeBtn ? parseInt(activeBtn.dataset.value) : 0;
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
                if (input) {
                    frequency[field] = input.value;
                }
            });
            
            return frequency;
        },
        
        showLoading: function() {
            elements.loadingOverlay?.classList.add('show');
        },
        
        hideLoading: function() {
            elements.loadingOverlay?.classList.remove('show');
        },
        
        showSuccess: function(message) {
            showNotification(message, 'success');
        },
        
        showError: function(message) {
            showNotification(message, 'error');
        },
        
        submit: async function(e) {
            e.preventDefault();
            
            const data = this.collectData();
            this.showLoading();
            
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
                    this.showSuccess(`¡Paciente registrado! Ficha #${result.ficha_numero}`);
                    
                    setTimeout(() => {
                        if (result.redirect_url) {
                            window.location.href = result.redirect_url;
                        } else if (result.patient_id) {
                            window.location.href = `/dashboard/nutritionist/patient/${result.patient_id}`;
                        } else {
                            window.location.href = '/dashboard/nutritionist/patients';
                        }
                    }, 1500);
                } else {
                    throw new Error(result.error || 'Error al guardar el paciente');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError(error.message || 'Ocurrió un error al guardar el paciente');
            } finally {
                this.hideLoading();
            }
        },
        
        init: function() {
            if (elements.form) {
                elements.form.addEventListener('submit', (e) => this.submit(e));
                elements.form.addEventListener('input', () => ProgressBar.update());
                elements.form.addEventListener('change', () => ProgressBar.update());
            }
        }
    };
    
    // ============================================
    // GUARDAR BORRADOR
    // ============================================
    window.guardarBorrador = function() {
        console.log('💾 Guardando borrador...');
        
        const form = elements.form;
        if (!form) {
            showNotification('❌ Error: Formulario no encontrado', 'error');
            return;
        }
        
        const formData = new FormData(form);
        
        // Agregar patient_id si existe
        if (elements.patient_id && elements.patient_id.value) {
            formData.append('patient_id', elements.patient_id.value);
        }
        
        showLoading();
        
        fetch(CONFIG.DRAFT_ENDPOINT, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification('✅ Borrador guardado exitosamente', 'success');
                
                // Guardar patient_id si es nuevo
                if (data.patient_id && elements.patient_id) {
                    elements.patient_id.value = data.patient_id;
                    console.log('✅ Patient ID guardado:', data.patient_id);
                }
            } else {
                showNotification('❌ Error: ' + (data.error || 'Error desconocido'), 'error');
            }
        })
        .catch(error => {
            hideLoading();
            showNotification('❌ Error de conexión', 'error');
            console.error('Error:', error);
        });
    };
    
    // ============================================
    // STICKY ACTIONS
    // ============================================
    let formModified = false;
    const stickyActions = document.getElementById('stickyActions');
    
    function initStickyActions() {
        if (!stickyActions) return;
        
        const allFields = document.querySelectorAll('input, select, textarea');
        
        allFields.forEach(field => {
            field.addEventListener('input', showStickyActions);
            field.addEventListener('change', showStickyActions);
        });
        
        document.querySelectorAll('.pill-btn, .freq-btn').forEach(btn => {
            btn.addEventListener('click', showStickyActions);
        });
    }
    
    function showStickyActions() {
        if (!formModified && stickyActions) {
            formModified = true;
            stickyActions.style.display = 'block';
            document.body.classList.add('sticky-active');
        }
    }
    
    // ============================================
    // UTILIDADES
    // ============================================
    function showLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.classList.add('show');
    }
    
    function hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.classList.remove('show');
    }
    
    function showNotification(message, type) {
        const prevNotification = document.querySelector('.notification');
        if (prevNotification) prevNotification.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            animation: slideInRight 0.3s ease;
            font-weight: 600;
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
        console.log('🚀 Inicializando Patient Intake Form V3.1 con multiplicadores...');
        
        // Cargar base de datos de alimentos desde API
        await loadAlimentosDatabase();
        
        // Inicializar módulos
        ObjetivosManager.init();
        ProgressBar.init();
        RangeManager.init();
        ConditionalFields.init();
        FrequencyManager.init();
        FormManager.init();
        initStickyActions();
        
        // Listeners para cálculos automáticos
        if (elements.fechaNacimiento) {
            elements.fechaNacimiento.addEventListener('change', () => AgeCalculator.update());
        }
        
        if (elements.talla && elements.peso) {
            elements.talla.addEventListener('input', () => IMCCalculator.update());
            elements.peso.addEventListener('input', () => IMCCalculator.update());
        }
        
        // Establecer fecha de atención actual
        const fechaAtencion = document.getElementById('fechaAtencion');
        if (fechaAtencion) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            fechaAtencion.value = now.toISOString().slice(0, 16);
        }
        
        console.log('✅ Patient Intake Form V3.1 inicializado con multiplicadores ✅');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

// Agregar estilos de animación
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
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
`;
document.head.appendChild(notificationStyles);

console.log('✅ Módulo Patient Intake V3.1 cargado con multiplicadores');