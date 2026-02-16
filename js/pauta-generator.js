/**
 * pauta-generator.js - Generador de Pauta Alimentaria Semanal
 * Version: 3.0 - Vista semanal completa
 */

console.log('📦 pauta-generator.js v3.0 SEMANAL cargado');

(function() {
    'use strict';
    
    // Estado del generador
    const state = {
        currentStep: 1,
        selectedPatient: null,
        selectedPatientData: null,
        pauta: null,
        diaActivo: 'lunes'
    };
    
    const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    const DIAS_CONFIG = {
        lunes: { nombre: 'Lunes', icono: 'fa-calendar-day', color: '#3b82f6' },
        martes: { nombre: 'Martes', icono: 'fa-calendar-day', color: '#8b5cf6' },
        miercoles: { nombre: 'Miércoles', icono: 'fa-calendar-day', color: '#ec4899' },
        jueves: { nombre: 'Jueves', icono: 'fa-calendar-day', color: '#f59e0b' },
        viernes: { nombre: 'Viernes', icono: 'fa-calendar-day', color: '#10b981' },
        sabado: { nombre: 'Sábado', icono: 'fa-calendar-week', color: '#06b6d4' },
        domingo: { nombre: 'Domingo', icono: 'fa-calendar-week', color: '#ef4444' }
    };
    
    const TIEMPO_ICONS = {
        desayuno: { icon: 'fa-sun', color: '#f59e0b', bg: '#fef3c7' },
        colacion_am: { icon: 'fa-apple-alt', color: '#10b981', bg: '#d1fae5' },
        almuerzo: { icon: 'fa-utensils', color: '#ef4444', bg: '#fee2e2' },
        colacion_pm: { icon: 'fa-cookie', color: '#8b5cf6', bg: '#ede9fe' },
        cena: { icon: 'fa-moon', color: '#3b82f6', bg: '#dbeafe' }
    };
    
    // Formatear porción: "4 1 taza" → "4 tazas"
    function formatPorcion(cantidad, medidaCasera) {
        if (!medidaCasera) return `${cantidad} porción`;

        // Remove leading "1 " from medida_casera if cantidad > 1
        // e.g. cantidad=4, medida="1 taza" → "4 tazas"
        const medida = medidaCasera.trim();
        const match = medida.match(/^1\s+(.+)$/);

        if (match && cantidad !== 1) {
            const unidad = match[1];
            // Simple Spanish pluralization
            let unidadPlural = unidad;
            if (!unidad.endsWith('s') && cantidad > 1) {
                if (unidad.endsWith('z')) {
                    unidadPlural = unidad.slice(0, -1) + 'ces';
                } else if (unidad.endsWith('ón')) {
                    unidadPlural = unidad.slice(0, -2) + 'ones';
                } else {
                    unidadPlural = unidad + 's';
                }
            }
            return `${cantidad} ${unidadPlural}`;
        }

        // For fractions like "½ taza", show as "cantidad × ½ taza"
        if (cantidad > 1 && /^[½¼¾⅓⅔]/.test(medida)) {
            return `${cantidad} × ${medida}`;
        }

        // Handle medida that already starts with a number (e.g. "2 tazas", "3 cdas")
        const matchNum = medida.match(/^\d+(\.\d+)?\s+/);
        if (matchNum) return medida;

        // Default: just combine
        if (cantidad === 1) return medida;
        return `${cantidad} ${medida}`;
    }

    // Inicialización
    function init() {
        console.log('🍽️ Inicializando Generador de Pauta Semanal...');
        
        const modal = document.getElementById('pautaGeneratorModal');
        if (!modal) {
            console.warn('⚠️ Modal no encontrado');
            return;
        }
        
        // Event listeners del modal
        modal.addEventListener('show.bs.modal', () => {
            console.log('📂 Modal abriendo...');
        });
        
        modal.addEventListener('shown.bs.modal', () => {
            console.log('📂 Modal ABIERTO');
            resetState();
            loadPatients();
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            console.log('📂 Modal cerrado');
            resetState();
        });
        
        // Search input
        const searchInput = document.getElementById('pautaPatientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterPatients(e.target.value);
            });
        }
        
        console.log('✅ Generador de Pauta Semanal inicializado');
    }
    
    function resetState() {
        state.currentStep = 1;
        state.selectedPatient = null;
        state.selectedPatientData = null;
        state.pauta = null;
        state.diaActivo = 'lunes';
        updateStepUI();
    }
    
    function updateStepUI() {
        // Actualizar indicadores de paso
        for (let i = 1; i <= 3; i++) {
            const stepEl = document.querySelector(`.pauta-step[data-step="${i}"]`);
            if (stepEl) {
                stepEl.classList.remove('active', 'completed');
                if (i < state.currentStep) {
                    stepEl.classList.add('completed');
                } else if (i === state.currentStep) {
                    stepEl.classList.add('active');
                }
            }
        }
        
        // Mostrar panel correcto
        document.querySelectorAll('.pauta-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const activePanel = document.getElementById(`pautaStep${state.currentStep}`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
        
        // Actualizar botones
        const prevBtn = document.getElementById('pautaPrevBtn');
        const nextBtn = document.getElementById('pautaNextBtn');
        const saveBtn = document.getElementById('pautaSaveBtn');
        
        if (prevBtn) prevBtn.style.display = state.currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.style.display = state.currentStep < 3 ? 'inline-flex' : 'none';
        if (saveBtn) saveBtn.style.display = state.currentStep === 3 ? 'inline-flex' : 'none';
        
        if (nextBtn) {
            if (state.currentStep === 1) {
                nextBtn.disabled = !state.selectedPatient;
                nextBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generar Pauta Semanal';
            } else {
                nextBtn.innerHTML = '<i class="fas fa-arrow-right me-2"></i>Siguiente';
            }
        }
    }
    
    // Cargar pacientes
    async function loadPatients() {
        const container = document.getElementById('pautaPatientList');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Cargando pacientes...</p>
            </div>
        `;
        
        try {
            const response = await fetch('/api/patients?per_page=100');
            const data = await response.json();
            
            if (data.patients && data.patients.length > 0) {
                renderPatientList(data.patients);
            } else {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p>No hay pacientes registrados</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error cargando pacientes:', error);
            container.innerHTML = `
                <div class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <p>Error al cargar pacientes</p>
                </div>
            `;
        }
    }
    
    function renderPatientList(patients) {
        const container = document.getElementById('pautaPatientList');
        if (!container) return;
        
        window._pautaPatients = patients;
        
        let html = '<div class="patient-grid">';
        
        patients.forEach(patient => {
            const objetivos = parseObjetivos(patient.objetivos);
            const hasFreqData = patient.frecuencia_consumo ? '✓' : '✗';
            const has24hData = patient.registro_24h ? '✓' : '✗';
            
            html += `
                <div class="patient-card ${state.selectedPatient === patient.id ? 'selected' : ''}" 
                     onclick="selectPautaPatient(${patient.id})"
                     data-patient-id="${patient.id}"
                     data-patient-name="${patient.nombre || ''}">
                    <div class="patient-card-header">
                        <div class="patient-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="patient-info">
                            <h5>${patient.nombre || 'Sin nombre'}</h5>
                            <span class="patient-id">Ficha #${patient.numero_ficha || patient.id}</span>
                        </div>
                    </div>
                    <div class="patient-stats">
                        <div class="stat">
                            <span class="stat-value" style="color: ${patient.get_kcal ? '#14b8a6' : '#9ca3af'};">${patient.get_kcal || 'N/C'}</span>
                            <span class="stat-label">GET kcal</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" style="color: ${patient.proteinas_g ? '#ef4444' : '#9ca3af'};">${patient.proteinas_g ? patient.proteinas_g + 'g' : 'N/C'}</span>
                            <span class="stat-label">Proteínas</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" style="color: #3b82f6;">${patient.imc ? patient.imc.toFixed(1) : '-'}</span>
                            <span class="stat-label">IMC</span>
                        </div>
                    </div>
                    <div class="patient-data-status">
                        <span class="data-badge ${patient.registro_24h ? 'has-data' : 'no-data'}">
                            <i class="fas ${patient.registro_24h ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            Registro 24h
                        </span>
                        <span class="data-badge ${patient.frecuencia_consumo ? 'has-data' : 'no-data'}">
                            <i class="fas ${patient.frecuencia_consumo ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            Frecuencia
                        </span>
                    </div>
                    ${objetivos.length > 0 ? `
                        <div class="patient-objetivos">
                            ${objetivos.slice(0, 2).map(obj => `
                                <span class="objetivo-badge">${obj}</span>
                            `).join('')}
                            ${objetivos.length > 2 ? `<span class="objetivo-badge more">+${objetivos.length - 2}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    function parseObjetivos(objetivos) {
        if (!objetivos) return [];
        if (Array.isArray(objetivos)) return objetivos;
        try {
            const parsed = JSON.parse(objetivos);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    
    function filterPatients(searchTerm) {
        const patients = window._pautaPatients || [];
        const filtered = patients.filter(p => 
            (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.numero_ficha || '').toString().includes(searchTerm)
        );
        renderPatientList(filtered);
    }
    
    // Seleccionar paciente
    window.selectPautaPatient = function(patientId) {
        state.selectedPatient = patientId;
        state.selectedPatientData = (window._pautaPatients || []).find(p => p.id === patientId);
        
        document.querySelectorAll('.patient-card').forEach(card => {
            card.classList.remove('selected');
            if (parseInt(card.dataset.patientId) === patientId) {
                card.classList.add('selected');
            }
        });
        
        updateStepUI();
        console.log('👤 Paciente seleccionado:', state.selectedPatientData?.nombre);
    };
    
    // Navegación
    window.pautaPrevStep = function() {
        if (state.currentStep > 1) {
            state.currentStep--;
            updateStepUI();
        }
    };
    
    window.pautaNextStep = async function() {
        if (state.currentStep === 1 && state.selectedPatient) {
            await generatePauta();
            state.currentStep = 2;
            updateStepUI();
        } else if (state.currentStep === 2) {
            state.currentStep = 3;
            updateStepUI();
            renderConfirmation();
        }
    };
    
    // Generar pauta
    async function generatePauta() {
        const container = document.getElementById('pautaEditorContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                <h5 class="mt-3">Generando Pauta Semanal...</h5>
                <p class="text-muted">Analizando preferencias, frecuencia de consumo y objetivos</p>
                <div class="progress mt-3" style="height: 6px; max-width: 300px; margin: 0 auto;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%;"></div>
                </div>
            </div>
        `;
        
        try {
            // Send patient allergy/intolerance data via POST for filtering
            const patientData = state.selectedPatientData || {};
            const response = await fetch(`/api/generar-pauta/${state.selectedPatient}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alergias: patientData.alergias || '',
                    intolerancias: patientData.intolerancias || '',
                    restricciones_alimentarias: patientData.restricciones_alimentarias || []
                })
            });
            const data = await response.json();
            
            if (data.success && data.pauta) {
                state.pauta = data.pauta;
                renderPautaSemanal();
            } else {
                throw new Error(data.error || 'Error generando pauta');
            }
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `
                <div class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-4x mb-3"></i>
                    <h5>Error al generar la pauta</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="pautaPrevStep()">
                        <i class="fas fa-arrow-left me-2"></i>Volver
                    </button>
                </div>
            `;
        }
    }
    
    // Renderizar pauta semanal
    function renderPautaSemanal() {
        const container = document.getElementById('pautaEditorContainer');
        if (!container || !state.pauta) return;
        
        const pauta = state.pauta;
        
        let html = `
            <!-- Header con info del paciente -->
            <div class="pauta-header-info">
                <div class="patient-summary">
                    <div class="patient-name-section">
                        <i class="fas fa-user-circle fa-2x" style="color: #14b8a6;"></i>
                        <div>
                            <h4 style="margin: 0;">${pauta.paciente?.nombre || 'Paciente'}</h4>
                            <small class="text-muted">Pauta Alimentaria Semanal</small>
                        </div>
                    </div>
                </div>
                
                <!-- Requerimientos -->
                <div class="requerimientos-row">
                    <div class="req-item">
                        <span class="req-value" style="color: #14b8a6;">${pauta.requerimientos?.get_kcal || 0}</span>
                        <span class="req-label">GET kcal</span>
                    </div>
                    <div class="req-item">
                        <span class="req-value" style="color: #ef4444;">${pauta.requerimientos?.proteinas_g || 0}g</span>
                        <span class="req-label">Proteínas</span>
                    </div>
                    <div class="req-item">
                        <span class="req-value" style="color: #3b82f6;">${pauta.requerimientos?.carbohidratos_g || 0}g</span>
                        <span class="req-label">Carbohidratos</span>
                    </div>
                    <div class="req-item">
                        <span class="req-value" style="color: #8b5cf6;">${pauta.requerimientos?.grasas_g || 0}g</span>
                        <span class="req-label">Grasas</span>
                    </div>
                </div>
                
                <!-- Análisis aplicado -->
                ${pauta.analisis_frecuencia?.consumo_alto?.length > 0 ? `
                    <div class="analisis-badge-row">
                        <small class="text-muted me-2"><i class="fas fa-chart-bar"></i> Consumo frecuente:</small>
                        ${pauta.analisis_frecuencia.consumo_alto.map(g => `
                            <span class="badge bg-success bg-opacity-10 text-success">${g}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <!-- Navegación de días -->
            <div class="dias-nav-container">
                <div class="dias-nav">
                    ${DIAS_SEMANA.map(dia => {
                        const config = DIAS_CONFIG[dia];
                        const diaData = pauta.dias?.[dia];
                        const cumplimiento = diaData?.cumplimiento_kcal || 0;
                        return `
                            <button class="dia-tab ${dia === state.diaActivo ? 'active' : ''}" 
                                    onclick="cambiarDia('${dia}')"
                                    data-dia="${dia}">
                                <span class="dia-nombre">${config.nombre}</span>
                                <span class="dia-kcal">${diaData?.totales?.kcal || 0} kcal</span>
                                <div class="dia-progress">
                                    <div class="dia-progress-bar" style="width: ${Math.min(cumplimiento, 100)}%; background: ${cumplimiento >= 95 ? '#10b981' : cumplimiento >= 80 ? '#f59e0b' : '#ef4444'};"></div>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Contenido del día seleccionado -->
            <div id="diaContenido" class="dia-contenido">
                ${renderDia(state.diaActivo)}
            </div>
            
            <!-- Resumen semanal -->
            <div class="resumen-semanal">
                <h6><i class="fas fa-chart-pie me-2"></i>Resumen Semanal</h6>
                <div class="resumen-stats">
                    <div class="resumen-stat">
                        <span class="resumen-value">${pauta.resumen_semanal?.promedio_diario?.kcal || 0}</span>
                        <span class="resumen-label">Promedio kcal/día</span>
                    </div>
                    <div class="resumen-stat">
                        <span class="resumen-value">${pauta.resumen_semanal?.promedio_diario?.proteinas || 0}g</span>
                        <span class="resumen-label">Proteínas/día</span>
                    </div>
                    <div class="resumen-stat">
                        <span class="resumen-value">${pauta.resumen_semanal?.cumplimiento_promedio || 0}%</span>
                        <span class="resumen-label">Cumplimiento</span>
                    </div>
                    <div class="resumen-stat">
                        <span class="resumen-value">${pauta.resumen_semanal?.total_semanal?.kcal || 0}</span>
                        <span class="resumen-label">Total semanal kcal</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    function renderDia(dia) {
        const pauta = state.pauta;
        if (!pauta || !pauta.dias || !pauta.dias[dia]) {
            return '<p class="text-center text-muted">No hay datos para este día</p>';
        }
        
        const diaData = pauta.dias[dia];
        const config = DIAS_CONFIG[dia];
        
        let html = `
            <div class="dia-header">
                <h5 style="color: ${config.color}; margin: 0;">
                    <i class="fas ${config.icono} me-2"></i>${config.nombre}
                </h5>
                <div class="dia-totales">
                    <span class="badge bg-warning text-dark">${diaData.totales?.kcal || 0} kcal</span>
                    <span class="badge bg-danger bg-opacity-75 text-white">${diaData.totales?.proteinas || 0}g prot</span>
                    <span class="badge bg-primary bg-opacity-75 text-white">${diaData.totales?.carbohidratos || 0}g carbs</span>
                </div>
            </div>
            
            <div class="tiempos-grid">
        `;
        
        const tiemposOrder = ['desayuno', 'colacion_am', 'almuerzo', 'colacion_pm', 'cena'];
        
        tiemposOrder.forEach(tiempoKey => {
            const tiempo = diaData.tiempos?.[tiempoKey];
            if (!tiempo) return;
            
            const tiempoConfig = TIEMPO_ICONS[tiempoKey];
            
            html += `
                <div class="tiempo-card">
                    <div class="tiempo-header" style="background: ${tiempoConfig.bg};">
                        <div class="tiempo-title">
                            <i class="fas ${tiempoConfig.icon}" style="color: ${tiempoConfig.color};"></i>
                            <span>${tiempo.nombre}</span>
                        </div>
                        <div class="tiempo-meta">
                            <span class="tiempo-hora"><i class="fas fa-clock"></i> ${tiempo.hora}</span>
                            <span class="tiempo-kcal">${tiempo.totales?.kcal || 0} kcal</span>
                        </div>
                    </div>
                    <div class="tiempo-body">
                        <table class="alimentos-table">
                            <thead>
                                <tr>
                                    <th>Alimento</th>
                                    <th>Cantidad</th>
                                    <th>Kcal</th>
                                    <th>Prot</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(tiempo.alimentos || []).map(a => `
                                    <tr${a.es_preferido ? ' style="background: rgba(16, 185, 129, 0.06);"' : ''}>
                                        <td>
                                            <span class="alimento-nombre">${a.nombre}${a.es_preferido ? ' ⭐' : ''}</span>
                                        </td>
                                        <td>${formatPorcion(a.cantidad, a.medida_casera)}</td>
                                        <td><strong>${Math.round(a.kcal)}</strong></td>
                                        <td>${a.proteinas}g</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="tiempo-footer">
                        <span><strong>${tiempo.totales?.proteinas || 0}g</strong> prot</span>
                        <span><strong>${tiempo.totales?.carbohidratos || 0}g</strong> carbs</span>
                        <span><strong>${tiempo.totales?.lipidos || 0}g</strong> grasas</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Cambiar día
    window.cambiarDia = function(dia) {
        state.diaActivo = dia;
        
        // Actualizar tabs
        document.querySelectorAll('.dia-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.dia === dia) {
                tab.classList.add('active');
            }
        });
        
        // Actualizar contenido
        const contenido = document.getElementById('diaContenido');
        if (contenido) {
            contenido.innerHTML = renderDia(dia);
        }
    };
    
    // Confirmación
    function renderConfirmation() {
        const container = document.getElementById('pautaConfirmContainer');
        if (!container || !state.pauta) return;
        
        const pauta = state.pauta;
        
        container.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle fa-4x" style="color: #10b981;"></i>
                </div>
                <h4>¡Pauta Semanal Lista para Guardar!</h4>
                <p class="text-muted">Se guardará la pauta alimentaria para <strong>${pauta.paciente?.nombre}</strong></p>
                
                <div class="confirmation-summary">
                    <div class="summary-row">
                        <span><i class="fas fa-calendar-week me-2"></i>Duración:</span>
                        <strong>7 días</strong>
                    </div>
                    <div class="summary-row">
                        <span><i class="fas fa-fire me-2"></i>Promedio diario:</span>
                        <strong>${pauta.resumen_semanal?.promedio_diario?.kcal || 0} kcal</strong>
                    </div>
                    <div class="summary-row">
                        <span><i class="fas fa-drumstick-bite me-2"></i>Proteínas/día:</span>
                        <strong>${pauta.resumen_semanal?.promedio_diario?.proteinas || 0}g</strong>
                    </div>
                    <div class="summary-row">
                        <span><i class="fas fa-bullseye me-2"></i>Cumplimiento:</span>
                        <strong style="color: ${pauta.resumen_semanal?.cumplimiento_promedio >= 95 ? '#10b981' : '#f59e0b'};">
                            ${pauta.resumen_semanal?.cumplimiento_promedio || 0}%
                        </strong>
                    </div>
                </div>
                
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    La pauta quedará guardada en la ficha del paciente y podrá visualizarse desde la lista de pacientes.
                </div>
            </div>
        `;
    }
    
    // Guardar pauta
    window.savePauta = async function() {
        if (!state.pauta || !state.selectedPatient) {
            alert('No hay pauta para guardar');
            return;
        }
        
        const saveBtn = document.getElementById('pautaSaveBtn');
        const prevBtn = document.getElementById('pautaPrevBtn');
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        }
        
        try {
            const response = await fetch(`/api/guardar-pauta/${state.selectedPatient}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pauta: state.pauta })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Ocultar botones del footer
                if (saveBtn) saveBtn.style.display = 'none';
                if (prevBtn) prevBtn.style.display = 'none';
                
                // Ocultar botón cancelar también
                const cancelBtns = document.querySelectorAll('[data-bs-dismiss="modal"]');
                cancelBtns.forEach(btn => {
                    if (btn.classList.contains('btn-secondary')) {
                        btn.style.display = 'none';
                    }
                });
                
                // Mostrar éxito
                const container = document.getElementById('pautaConfirmContainer');
                if (container) {
                    container.innerHTML = `
                        <div class="confirmation-content">
                            <div class="confirmation-icon success-animation">
                                <i class="fas fa-check-circle fa-5x" style="color: #10b981;"></i>
                            </div>
                            <h4 style="color: #10b981;">¡Pauta Guardada Exitosamente!</h4>
                            <p class="text-muted">La pauta semanal ha sido guardada en la ficha del paciente.</p>
                            <button class="btn btn-success btn-lg mt-3" data-bs-dismiss="modal">
                                <i class="fas fa-check me-2"></i>Cerrar
                            </button>
                        </div>
                    `;
                }
            } else {
                throw new Error(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error guardando pauta:', error);
            alert('Error al guardar: ' + error.message);
            
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Pauta';
            }
        }
    };
    
    // Inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();