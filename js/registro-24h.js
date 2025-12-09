/* ============================================
   REGISTRO ALIMENTACIÓN 24 HORAS - JAVASCRIPT
   Archivo separado para mejor mantenibilidad
   ============================================ */

   (function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        ALIMENTOS_ENDPOINT: '/api/alimentos',
        MEALS: ['desayuno', 'colacion1', 'almuerzo', 'colacion2', 'cena'],
        MEAL_LABELS: {
            desayuno: 'Desayuno',
            colacion1: 'Colación AM',
            almuerzo: 'Almuerzo',
            colacion2: 'Colación PM',
            cena: 'Cena'
        }
    };
    
    // ============================================
    // MULTIPLICADORES DE PORCIONES
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
    // CACHE DE DATOS
    // ============================================
    let ALIMENTOS_DATABASE = {};
    let databaseLoaded = false;
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🍽️ Iniciando módulo Registro 24h...');
        initRegistro24h();
    });
    
    async function initRegistro24h() {
        // Verificar que existe el contenedor
        const container = document.getElementById('registro24hContainer');
        if (!container) {
            console.log('ℹ️ Contenedor Registro 24h no encontrado en esta página');
            return;
        }
        
        // Cargar base de datos
        const loaded = await loadAlimentosDatabase();
        if (!loaded) {
            console.error('❌ No se pudo cargar la base de datos de alimentos');
            return;
        }
        
        // Inicializar tabs
        initMealTabs();
        
        // Inicializar selects de grupo
        initGroupSelects();
        
        // Cargar datos existentes si hay
        loadExistingData();
        
        console.log('✅ Módulo Registro 24h inicializado');
    }
    
    // ============================================
    // CARGAR BASE DE DATOS DE ALIMENTOS
    // ============================================
    async function loadAlimentosDatabase() {
        if (databaseLoaded) {
            console.log('✅ Base de datos ya cargada desde cache');
            return true;
        }
        
        try {
            console.log('📡 Cargando base de datos de alimentos...');
            
            const response = await fetch(CONFIG.ALIMENTOS_ENDPOINT);
            const result = await response.json();
            
            if (result.success) {
                ALIMENTOS_DATABASE = result.data;
                databaseLoaded = true;
                console.log(`✅ BD cargada: ${result.total_grupos} grupos, ${result.total_alimentos} alimentos`);
                return true;
            } else {
                throw new Error(result.error || 'Error cargando alimentos');
            }
        } catch (error) {
            console.error('❌ Error cargando BD:', error);
            return false;
        }
    }
    
    // ============================================
    // TABS DE COMIDAS
    // ============================================
    function initMealTabs() {
        const tabs = document.querySelectorAll('.meal-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const meal = this.dataset.meal;
                
                // Desactivar todos los tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Activar este tab
                this.classList.add('active');
                
                // Mostrar panel correspondiente
                document.querySelectorAll('.meal-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(`panel-${meal}`).classList.add('active');
            });
        });
    }
    
    // ============================================
    // INICIALIZAR SELECTS DE GRUPO
    // ============================================
    function initGroupSelects() {
        document.querySelectorAll('.grupo-select').forEach(select => {
            populateGroupSelect(select);
        });
    }
    
    function populateGroupSelect(select) {
        select.innerHTML = '<option value="">Seleccionar grupo...</option>';
        
        Object.keys(ALIMENTOS_DATABASE).forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo;
            option.textContent = formatName(grupo);
            select.appendChild(option);
        });
    }
    
    // ============================================
    // MANEJAR CAMBIO DE GRUPO
    // ============================================
    window.onGrupoChange = function(selectElement) {
        const row = selectElement.closest('tr');
        const meal = row.dataset.meal;
        const grupo = selectElement.value;
        
        const subgrupoSelect = row.querySelector('.subgrupo-select');
        const alimentoSelect = row.querySelector('.alimento-select');
        const porcionCell = row.querySelector('.porcion-cell');
        
        // Reset
        subgrupoSelect.innerHTML = '<option value="">Subgrupo...</option>';
        alimentoSelect.innerHTML = '<option value="">Alimento...</option>';
        porcionCell.innerHTML = '<span class="text-muted">-</span>';
        subgrupoSelect.disabled = true;
        alimentoSelect.disabled = true;
        
        resetNutrientCells(row);
        
        if (!grupo || !ALIMENTOS_DATABASE[grupo]) return;
        
        // Cargar subgrupos
        const subgrupos = Object.keys(ALIMENTOS_DATABASE[grupo]);
        subgrupos.forEach(subgrupo => {
            const option = document.createElement('option');
            option.value = subgrupo;
            option.textContent = formatName(subgrupo);
            subgrupoSelect.appendChild(option);
        });
        
        subgrupoSelect.disabled = false;
    };
    
    // ============================================
    // MANEJAR CAMBIO DE SUBGRUPO
    // ============================================
    window.onSubgrupoChange = function(selectElement) {
        const row = selectElement.closest('tr');
        const grupoSelect = row.querySelector('.grupo-select');
        const grupo = grupoSelect.value;
        const subgrupo = selectElement.value;
        
        const alimentoSelect = row.querySelector('.alimento-select');
        const porcionCell = row.querySelector('.porcion-cell');
        
        // Reset
        alimentoSelect.innerHTML = '<option value="">Alimento...</option>';
        porcionCell.innerHTML = '<span class="text-muted">-</span>';
        alimentoSelect.disabled = true;
        
        resetNutrientCells(row);
        
        if (!subgrupo || !ALIMENTOS_DATABASE[grupo]?.[subgrupo]) return;
        
        // Cargar alimentos
        const alimentos = ALIMENTOS_DATABASE[grupo][subgrupo];
        alimentos.forEach((alimento, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = alimento.nombre;
            option.dataset.alimento = JSON.stringify(alimento);
            alimentoSelect.appendChild(option);
        });
        
        alimentoSelect.disabled = false;
    };
    
    // ============================================
    // MANEJAR CAMBIO DE ALIMENTO
    // ============================================
    window.onAlimentoChange = function(selectElement) {
        const row = selectElement.closest('tr');
        const meal = row.dataset.meal;
        const porcionCell = row.querySelector('.porcion-cell');
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        
        if (!selectElement.value) {
            porcionCell.innerHTML = '<span class="text-muted">-</span>';
            resetNutrientCells(row);
            updateMealTotals(meal);
            return;
        }
        
        const alimentoData = JSON.parse(selectedOption.dataset.alimento);
        
        // Crear selector de cantidad + medida casera
        porcionCell.innerHTML = `
            <div class="porcion-display">
                <select class="form-select cantidad-select" onchange="onCantidadChange(this)">
                    ${MULTIPLICADORES.map(m => 
                        `<option value="${m.value}" ${m.value === 1 ? 'selected' : ''}>${m.label}</option>`
                    ).join('')}
                </select>
                <span class="medida-casera">${alimentoData.medida_casera || '1 porción'}</span>
            </div>
        `;
        
        // Guardar datos del alimento en la fila
        row.dataset.alimentoData = JSON.stringify(alimentoData);
        
        // Calcular nutrientes
        calculateNutrients(row, alimentoData, 1);
        updateMealTotals(meal);
        saveAllData();
    };
    
    // ============================================
    // MANEJAR CAMBIO DE CANTIDAD
    // ============================================
    window.onCantidadChange = function(selectElement) {
        const row = selectElement.closest('tr');
        const meal = row.dataset.meal;
        const multiplier = parseFloat(selectElement.value);
        
        if (!row.dataset.alimentoData) return;
        
        const alimentoData = JSON.parse(row.dataset.alimentoData);
        calculateNutrients(row, alimentoData, multiplier);
        updateMealTotals(meal);
        saveAllData();
    };
    
    // ============================================
    // CALCULAR NUTRIENTES
    // ============================================
    function calculateNutrients(row, alimento, multiplier) {
        const kcal = Math.round((alimento.kcal || 0) * multiplier);
        const prot = ((alimento.proteinas || 0) * multiplier).toFixed(1);
        const carbs = ((alimento.carbohidratos || 0) * multiplier).toFixed(1);
        const lipidos = ((alimento.lipidos || 0) * multiplier).toFixed(1);
        
        row.querySelector('.kcal-cell').textContent = kcal;
        row.querySelector('.prot-cell').textContent = prot;
        row.querySelector('.carbs-cell').textContent = carbs;
        row.querySelector('.lipidos-cell').textContent = lipidos;
    }
    
    function resetNutrientCells(row) {
        row.querySelector('.kcal-cell').textContent = '-';
        row.querySelector('.prot-cell').textContent = '-';
        row.querySelector('.carbs-cell').textContent = '-';
        row.querySelector('.lipidos-cell').textContent = '-';
        delete row.dataset.alimentoData;
    }
    
    // ============================================
    // ACTUALIZAR TOTALES POR COMIDA
    // ============================================
    function updateMealTotals(meal) {
        const panel = document.getElementById(`panel-${meal}`);
        if (!panel) return;
        
        const rows = panel.querySelectorAll('tbody tr');
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        
        rows.forEach(row => {
            const kcal = parseFloat(row.querySelector('.kcal-cell')?.textContent) || 0;
            const prot = parseFloat(row.querySelector('.prot-cell')?.textContent) || 0;
            const carbs = parseFloat(row.querySelector('.carbs-cell')?.textContent) || 0;
            const lipidos = parseFloat(row.querySelector('.lipidos-cell')?.textContent) || 0;
            
            totalKcal += kcal;
            totalProt += prot;
            totalCarbs += carbs;
            totalLipidos += lipidos;
        });
        
        // Actualizar footer de la tabla
        const footer = panel.querySelector('tfoot');
        if (footer) {
            footer.querySelector('.total-kcal').textContent = Math.round(totalKcal);
            footer.querySelector('.total-prot').textContent = totalProt.toFixed(1);
            footer.querySelector('.total-carbs').textContent = totalCarbs.toFixed(1);
            footer.querySelector('.total-lipidos').textContent = totalLipidos.toFixed(1);
        }
        
        updateDailySummary();
    }
    
    // ============================================
    // ACTUALIZAR RESUMEN DIARIO
    // ============================================
    function updateDailySummary() {
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        
        CONFIG.MEALS.forEach(meal => {
            const panel = document.getElementById(`panel-${meal}`);
            if (!panel) return;
            
            const footer = panel.querySelector('tfoot');
            if (footer) {
                totalKcal += parseFloat(footer.querySelector('.total-kcal')?.textContent) || 0;
                totalProt += parseFloat(footer.querySelector('.total-prot')?.textContent) || 0;
                totalCarbs += parseFloat(footer.querySelector('.total-carbs')?.textContent) || 0;
                totalLipidos += parseFloat(footer.querySelector('.total-lipidos')?.textContent) || 0;
            }
        });
        
        // Actualizar cards de resumen
        const kcalEl = document.getElementById('summary-total-kcal');
        const protEl = document.getElementById('summary-total-prot');
        const carbsEl = document.getElementById('summary-total-carbs');
        const lipidosEl = document.getElementById('summary-total-lipidos');
        
        if (kcalEl) kcalEl.textContent = Math.round(totalKcal);
        if (protEl) protEl.textContent = totalProt.toFixed(1) + 'g';
        if (carbsEl) carbsEl.textContent = totalCarbs.toFixed(1) + 'g';
        if (lipidosEl) lipidosEl.textContent = totalLipidos.toFixed(1) + 'g';
    }
    
    // ============================================
    // AGREGAR FILA
    // ============================================
    window.addFoodRow = function(meal) {
        const panel = document.getElementById(`panel-${meal}`);
        const tbody = panel.querySelector('tbody');
        
        const newRow = document.createElement('tr');
        newRow.dataset.meal = meal;
        
        newRow.innerHTML = `
            <td>
                <select class="form-select form-select-sm grupo-select" onchange="onGrupoChange(this)">
                    <option value="">Grupo...</option>
                    ${Object.keys(ALIMENTOS_DATABASE).map(g => 
                        `<option value="${g}">${formatName(g)}</option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm subgrupo-select" onchange="onSubgrupoChange(this)" disabled>
                    <option value="">Subgrupo...</option>
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm alimento-select" onchange="onAlimentoChange(this)" disabled>
                    <option value="">Alimento...</option>
                </select>
            </td>
            <td class="porcion-cell">
                <span class="text-muted">-</span>
            </td>
            <td class="nutrient-cell kcal kcal-cell">-</td>
            <td class="nutrient-cell prot prot-cell">-</td>
            <td class="nutrient-cell carbs carbs-cell">-</td>
            <td class="nutrient-cell lipidos lipidos-cell">-</td>
            <td>
                <button type="button" class="btn-remove-row" onclick="removeFoodRow(this)">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(newRow);
        saveAllData();
    };
    
    // ============================================
    // ELIMINAR FILA
    // ============================================
    window.removeFoodRow = function(button) {
        const row = button.closest('tr');
        const meal = row.dataset.meal;
        const tbody = row.parentElement;
        
        // No eliminar si es la única fila
        if (tbody.querySelectorAll('tr').length > 1) {
            row.remove();
            updateMealTotals(meal);
            saveAllData();
        }
    };
    
    // ============================================
    // GUARDAR DATOS EN HIDDEN INPUT
    // ============================================
    function saveAllData() {
        const data = {};
        
        CONFIG.MEALS.forEach(meal => {
            data[meal] = [];
            const panel = document.getElementById(`panel-${meal}`);
            if (!panel) return;
            
            const rows = panel.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const grupoSelect = row.querySelector('.grupo-select');
                const subgrupoSelect = row.querySelector('.subgrupo-select');
                const alimentoSelect = row.querySelector('.alimento-select');
                const cantidadSelect = row.querySelector('.cantidad-select');
                
                if (grupoSelect?.value && subgrupoSelect?.value && alimentoSelect?.value) {
                    data[meal].push({
                        grupo: grupoSelect.value,
                        subgrupo: subgrupoSelect.value,
                        alimento_idx: alimentoSelect.value,
                        cantidad: cantidadSelect?.value || '1',
                        kcal: row.querySelector('.kcal-cell')?.textContent || '0',
                        prot: row.querySelector('.prot-cell')?.textContent || '0',
                        carbs: row.querySelector('.carbs-cell')?.textContent || '0',
                        lipidos: row.querySelector('.lipidos-cell')?.textContent || '0'
                    });
                }
            });
        });
        
        // Calcular totales
        let totalKcal = 0, totalProt = 0, totalCarbs = 0, totalLipidos = 0;
        Object.values(data).forEach(mealItems => {
            mealItems.forEach(item => {
                totalKcal += parseFloat(item.kcal) || 0;
                totalProt += parseFloat(item.prot) || 0;
                totalCarbs += parseFloat(item.carbs) || 0;
                totalLipidos += parseFloat(item.lipidos) || 0;
            });
        });
        
        data.totales = {
            kcal: Math.round(totalKcal),
            proteinas: parseFloat(totalProt.toFixed(1)),
            carbohidratos: parseFloat(totalCarbs.toFixed(1)),
            lipidos: parseFloat(totalLipidos.toFixed(1))
        };
        
        // Guardar en hidden input
        const hiddenInput = document.getElementById('registro_24h_data');
        if (hiddenInput) {
            hiddenInput.value = JSON.stringify(data);
        }
        
        console.log('💾 Datos guardados:', data);
    }
    
    // ============================================
    // CARGAR DATOS EXISTENTES
    // ============================================
    function loadExistingData() {
        const hiddenInput = document.getElementById('registro_24h_data');
        if (!hiddenInput) {
            console.log('ℹ️ No hay hidden input para registro 24h');
            return;
        }
        
        const rawValue = hiddenInput.value;
        console.log('📂 Valor raw del hidden input:', rawValue ? rawValue.substring(0, 100) + '...' : '(vacío)');
        
        // Si está vacío o es solo espacios, no hacer nada
        if (!rawValue || rawValue.trim() === '' || rawValue === '""' || rawValue === "''") {
            console.log('ℹ️ No hay datos previos de registro 24h');
            return;
        }
        
        try {
            const data = JSON.parse(rawValue);
            console.log('📂 Datos parseados correctamente:', data);
            
            // Verificar que tiene la estructura esperada
            if (typeof data !== 'object' || data === null) {
                console.log('ℹ️ Datos no tienen estructura de objeto');
                return;
            }
            
            CONFIG.MEALS.forEach(meal => {
                if (!data[meal] || !Array.isArray(data[meal]) || data[meal].length === 0) {
                    console.log(`ℹ️ No hay datos para ${meal}`);
                    return;
                }
                
                console.log(`🍽️ Cargando ${data[meal].length} items para ${meal}`);
                
                const panel = document.getElementById(`panel-${meal}`);
                if (!panel) {
                    console.log(`⚠️ Panel no encontrado: panel-${meal}`);
                    return;
                }
                
                const tbody = panel.querySelector('tbody');
                
                // Limpiar filas existentes excepto la primera
                const existingRows = tbody.querySelectorAll('tr');
                existingRows.forEach((row, idx) => {
                    if (idx > 0) row.remove();
                });
                
                // Cargar cada item
                data[meal].forEach((item, idx) => {
                    let row;
                    if (idx === 0) {
                        row = tbody.querySelector('tr');
                    } else {
                        // Crear nueva fila
                        addFoodRow(meal);
                        row = tbody.querySelector('tr:last-child');
                    }
                    
                    if (!row) {
                        console.log(`⚠️ No se encontró fila para item ${idx}`);
                        return;
                    }
                    
                    // Establecer grupo
                    const grupoSelect = row.querySelector('.grupo-select');
                    if (grupoSelect && item.grupo) {
                        grupoSelect.value = item.grupo;
                        onGrupoChange(grupoSelect);
                        
                        // Establecer subgrupo (con pequeño delay para que se carguen las opciones)
                        setTimeout(() => {
                            const subgrupoSelect = row.querySelector('.subgrupo-select');
                            if (subgrupoSelect && item.subgrupo) {
                                subgrupoSelect.value = item.subgrupo;
                                onSubgrupoChange(subgrupoSelect);
                                
                                // Establecer alimento
                                setTimeout(() => {
                                    const alimentoSelect = row.querySelector('.alimento-select');
                                    if (alimentoSelect && item.alimento_idx) {
                                        alimentoSelect.value = item.alimento_idx;
                                        onAlimentoChange(alimentoSelect);
                                        
                                        // Establecer cantidad
                                        setTimeout(() => {
                                            const cantidadSelect = row.querySelector('.cantidad-select');
                                            if (cantidadSelect && item.cantidad) {
                                                cantidadSelect.value = item.cantidad;
                                                onCantidadChange(cantidadSelect);
                                            }
                                        }, 50);
                                    }
                                }, 50);
                            }
                        }, 50);
                    }
                });
            });
            
            console.log('✅ Datos existentes cargados correctamente');
            
        } catch (error) {
            console.error('❌ Error parseando JSON:', error.message);
            console.error('   Valor que causó error:', rawValue.substring(0, 200));
        }
    }
    
    // ============================================
    // UTILIDADES
    // ============================================
    function formatName(str) {
        return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
})();