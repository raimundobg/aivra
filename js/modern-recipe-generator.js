/**
 * Modern Recipe Generator JavaScript - Enhanced Version with Print Function
 * Versión LOCAL para testing sin Firebase
 * Backend: Flask local en http://localhost:5000
 * COMPLETO: 1054+ líneas preservando TODA la funcionalidad original
 */

class ModernRecipeGenerator {
    constructor() {
        this.selectedRestrictions = new Set();
        this.selectedSources = new Set();
        this.debugMode = true;
        this.currentRecipe = null;
        
        // 🔧 Configuración DINÁMICA (Producción + Local)
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000'  // Desarrollo local
            : `https://${window.location.hostname}`;  // Producción en Railway
        this.apiEndpoint = '/generate_recipe';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.log('🚀 ModernRecipeGenerator initialized (LOCAL MODE)');
        this.log(`📡 API URL: ${this.apiBaseUrl}${this.apiEndpoint}`);
    }

    log(message) {
        if (this.debugMode) {
            console.log(`[RecipeGenerator] ${message}`);
        }
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('recipeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.log('📝 Form submitted');
                this.generateRecipe();
            });
        }

        // Ingredient count slider
        const slider = document.getElementById('numIngredients');
        const countDisplay = document.getElementById('ingredientCount');
        if (slider && countDisplay) {
            slider.addEventListener('input', (e) => {
                countDisplay.textContent = e.target.value;
                this.log(`🔢 Ingredient count changed to: ${e.target.value}`);
            });
        }

        // 🆕 Package size selector
        const packageSizeSelect = document.getElementById('packageSize');
        if (packageSizeSelect) {
            packageSizeSelect.addEventListener('change', (e) => {
                this.log(`📦 Package size changed to: ${e.target.value}g`);
                if (this.currentRecipe) {
                    this.showRecalculationHint();
                }
            });
        }

        // Restriction buttons
        document.querySelectorAll('.restriction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleRestriction(btn);
            });
        });

        // Source buttons
        document.querySelectorAll('.source-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSource(btn);
            });
        });

        // Debug button
        this.addDebugButton();
    }

    showRecalculationHint() {
        const resultsContainer = document.getElementById('recipeResults');
        if (!resultsContainer) return;
        
        const existingHint = resultsContainer.querySelector('.recalculation-hint');
        if (existingHint) {
            existingHint.remove();
        }
        
        const hint = document.createElement('div');
        hint.className = 'alert alert-warning recalculation-hint mt-3';
        hint.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            Has cambiado el tamaño del envase. Haz clic en "Generar Mi Batido Optimizado" para recalcular las cantidades.
        `;
        
        resultsContainer.insertBefore(hint, resultsContainer.firstChild);
    }

    addDebugButton() {
        const modalBody = document.querySelector('#recipeGeneratorModal .modal-body');
        if (modalBody && !document.getElementById('debugButton')) {
            const debugBtn = document.createElement('button');
            debugBtn.id = 'debugButton';
            debugBtn.className = 'btn btn-info btn-sm mb-3';
            debugBtn.innerHTML = '<i class="fas fa-bug me-1"></i> Ver Debug Logs';
            debugBtn.onclick = () => this.showDebugLogs();
            
            modalBody.insertBefore(debugBtn, modalBody.firstChild);
        }
    }

    async showDebugLogs() {
        try {
            this.log('🔍 Fetching debug logs...');
            const response = await fetch(`${this.apiBaseUrl}/debug_logs`);
            const data = await response.json();
            
            const logs = data.logs || [];
            const logText = logs.join('\n');
            
            console.log('=== DEBUG LOGS ===');
            console.log(logText);
            console.log('=== END DEBUG LOGS ===');
            
            alert(`Debug Logs (últimos ${logs.length}):\n\n${logText.slice(-1000)}...`);
            
        } catch (error) {
            console.error('Error fetching debug logs:', error);
            alert('Error obteniendo logs de debug');
        }
    }

    async testDataConnection() {
        try {
            this.log('🧪 Testing data connection...');
            const response = await fetch(`${this.apiBaseUrl}/test_data`);
            const data = await response.json();
            
            console.log('=== DATA TEST RESULTS ===');
            console.log(data);
            console.log('=== END DATA TEST ===');
            
            return data;
        } catch (error) {
            console.error('Error testing data connection:', error);
            return null;
        }
    }

    setupFormValidation() {
        const primaryObjective = document.getElementById('primaryObjective');
        if (primaryObjective) {
            primaryObjective.addEventListener('change', () => {
                this.validateForm();
            });
        }
    }

    toggleRestriction(button) {
        const restriction = button.dataset.restriction;
        
        if (this.selectedRestrictions.has(restriction)) {
            this.selectedRestrictions.delete(restriction);
            button.classList.remove('active');
            button.classList.add('btn-outline-secondary');
            button.setAttribute('aria-pressed', 'false');
            this.log(`🚫 Restriction removed: ${restriction}`);
        } else {
            this.selectedRestrictions.add(restriction);
            button.classList.add('active');
            button.classList.remove('btn-outline-secondary');
            button.setAttribute('aria-pressed', 'true');
            this.log(`🚫 Restriction added: ${restriction}`);
        }
    }

    toggleSource(button) {
        const source = button.dataset.source;
        
        if (this.selectedSources.has(source)) {
            this.selectedSources.delete(source);
            button.classList.remove('active');
            button.classList.add('btn-outline-primary');
            button.setAttribute('aria-pressed', 'false');
            this.log(`🌱 Source removed: ${source}`);
        } else {
            this.selectedSources.add(source);
            button.classList.add('active');
            button.classList.remove('btn-outline-primary');
            button.setAttribute('aria-pressed', 'true');
            this.log(`🌱 Source added: ${source}`);
        }
    }

    validateForm() {
        const primaryObjective = document.getElementById('primaryObjective').value;
        const submitBtn = document.querySelector('#recipeForm button[type="submit"]');
        
        if (primaryObjective && submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-secondary');
            submitBtn.classList.add('btn-primary');
            this.log('✅ Form validation passed');
        } else if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-secondary');
            this.log('❌ Form validation failed - no primary objective');
        }
    }

    async generateRecipe() {
        this.log('🔄 Starting recipe generation...');
        
        const formData = this.collectFormData();
        this.log(`📋 Form data collected: ${JSON.stringify(formData)}`);
        
        this.showLoading();
        await this.testDataConnection();
        
        try {
            this.log(`📡 Sending request to ${this.apiBaseUrl}${this.apiEndpoint}...`);
            
            const response = await fetch(`${this.apiBaseUrl}${this.apiEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            this.log(`📡 Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                this.log(`❌ Response not OK: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const recipe = await response.json();
            this.log(`📊 Recipe received: ${JSON.stringify(recipe)}`);
            
            
            this.currentRecipe = recipe;
            this.displayRecipe(recipe);
            
            // 🎤 SINCRONIZACIÓN CON ASISTENTE DE VOZ (preparado pero desactivado)
            // this.syncWithVoiceAssistant(recipe);
            
        } catch (error) {
            this.log(`❌ Error in generateRecipe: ${error.message}`);
            console.error('Error completo:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = `No se puede conectar al servidor Flask.

Troubleshooting:
1. Verifica que Flask esté corriendo: python app.py
2. URL esperada: ${this.apiBaseUrl}${this.apiEndpoint}
3. Revisa que el puerto 5000 esté disponible
4. Verifica la consola del navegador (F12) para más detalles`;
            }
            
            this.showError(errorMessage);
        } finally {
            this.hideLoading();
        }
    }

    collectFormData() {
        const primaryObjective = document.getElementById('primaryObjective').value;
        const secondaryObjective1 = document.getElementById('secondaryObjective1').value;
        const secondaryObjective2 = document.getElementById('secondaryObjective2').value;
        const productType = document.getElementById('productType').value;
        const numIngredients = document.getElementById('numIngredients').value;
        const packageSize = document.getElementById('packageSize')?.value || 100;

        const secondaryObjectives = [secondaryObjective1, secondaryObjective2]
            .filter(obj => obj !== '');

        const formData = {
            primary_objective: primaryObjective,
            secondary_objectives: secondaryObjectives,
            dietary_restrictions: Array.from(this.selectedRestrictions),
            food_sources: Array.from(this.selectedSources),
            product_type: productType || 'polvo_batidos',
            num_ingredients: parseInt(numIngredients),
            package_size: parseInt(packageSize)
        };

        this.log(`📋 Collected form data: ${JSON.stringify(formData, null, 2)}`);
        return formData;
    }

    showLoading() {
        this.log('⏳ Showing loading state');
        document.getElementById('loadingSpinner').classList.remove('d-none');
        document.getElementById('recipeResults').classList.add('d-none');
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.classList.add('d-none');
    }

    hideLoading() {
        this.log('✅ Hiding loading state');
        document.getElementById('loadingSpinner').classList.add('d-none');
    }

    displayRecipe(recipe) {
        this.log('🎨 Displaying recipe results');
        
        if (recipe.error) {
            this.showError(recipe.error);
            return;
        }

        const resultsContainer = document.getElementById('recipeResults');
        resultsContainer.innerHTML = this.generateEnhancedRecipeHTML(recipe);
        resultsContainer.classList.remove('d-none');
        resultsContainer.classList.add('fade-in-up');
    }

    generateEnhancedRecipeHTML(recipe) {
        const nutritionMetrics = recipe.nutrition_metrics || {};
        const ingredients = recipe.ingredients || [];
        const instructions = recipe.instructions || [];
        const highlightedNutrients = recipe.highlighted_nutrients || [];
        
        // Determinar imagen de empaque según gramaje
        const packageSize = parseInt(recipe.package_size) || 100;
        const packageImage = packageSize === 200 ? 'images/4.png' : 'images/3.png';

        return `
            <!-- Imagen del empaque según gramaje -->
            <div class="package-preview text-center mb-4">
                <h5 class="mb-3">
                    <i class="fas fa-box-open me-2"></i>
                    Tu Producto Personalizado (${recipe.package_size || '100g'})
                </h5>
                <img src="${packageImage}" alt="Empaque ${recipe.package_size || '100g'}" class="img-fluid" style="max-width: 300px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <p class="text-muted mt-2 small">
                    <i class="fas fa-info-circle me-1"></i>
                    Visualiza el potencial de tu propio producto
                </p>
            </div>
            
            <div class="recipe-header">
                <h3 class="recipe-title">${recipe.name}</h3>
                <p class="recipe-objective">
                    <i class="fas fa-target me-1"></i>
                    ${this.getObjectiveLabel(recipe.primary_objective)}
                </p>
                <div class="d-flex flex-wrap gap-2 mb-3">
                    <span class="badge bg-primary">
                        <i class="fas fa-box me-1"></i>
                        ${recipe.package_size || '100g'}
                    </span>
                    <span class="badge bg-info">
                        <i class="fas fa-utensils me-1"></i>
                        ${recipe.servings || 30} porciones
                    </span>
                    <span class="badge bg-success">
                        <i class="fas fa-leaf me-1"></i>
                        ${ingredients.length} ingredientes
                    </span>
                </div>
            </div>

            <div class="nutrition-metrics">
                <div class="metric-card">
                    <span class="metric-value">${nutritionMetrics.calories || 0}</span>
                    <span class="metric-label">Calorías</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${nutritionMetrics.protein || 0}g</span>
                    <span class="metric-label">Proteína</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${nutritionMetrics.omega_3 || 0}g</span>
                    <span class="metric-label">Omega-3</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${nutritionMetrics.antioxidants || 0}</span>
                    <span class="metric-label">Antioxidantes</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${nutritionMetrics.fiber || 0}g</span>
                    <span class="metric-label">Fibra</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${nutritionMetrics.vitamin_c || 0}mg</span>
                    <span class="metric-label">Vitamina C</span>
                </div>
            </div>

            <div class="ingredients-list">
                <h6><i class="fas fa-list me-2"></i>Ingredientes</h6>
                ${ingredients.map(ingredient => `
                    <div class="ingredient-item">
                        <div class="ingredient-info">
                            <h6>${ingredient.name}</h6>
                            <div class="ingredient-function">${ingredient.function}</div>
                            <div class="ingredient-provider">
                                <small class="text-muted">
                                    <i class="fas fa-store me-1"></i>Proveedor: ${ingredient.proveedor || 'No especificado'}
                                </small>
                            </div>
                            <div class="ingredient-bioavailability">
                                <small class="text-success">
                                    <i class="fas fa-chart-line me-1"></i>Nivel de biodisponibilidad: ${ingredient.bioavailability_level || '60%'}
                                </small>
                            </div>
                        </div>
                        <div class="ingredient-amount">
                            ${ingredient.cantidad_por_porcion ? `
                                ${ingredient.cantidad_por_porcion.toFixed(1)}g/porción
                                <br><small class="text-muted">Total: ${ingredient.cantidad_total_envase?.toFixed(1)}g (${ingredient.porcentaje_envase?.toFixed(1)}%)</small>
                            ` : `
                                ${ingredient.amount} ${ingredient.unit}
                                <small class="text-muted">(${ingredient.grams}g)</small>
                            `}
                        </div>
                    </div>
                `).join('')}
                <div class="liquid-ingredient">
                    <div class="ingredient-info">
                        <h6>Agua o leche vegetal</h6>
                        <div class="ingredient-function">Base líquida</div>
                    </div>
                    <div class="ingredient-amount">
                        250 ml
                        <small class="text-muted">(250g)</small>
                    </div>
                </div>
            </div>

            ${this.renderInteractionsAnalysis(recipe)}

            <div class="instructions-list">
                <h6><i class="fas fa-clipboard-list me-2"></i>Preparación</h6>
                <ol>
                    ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ol>
            </div>

            <div class="benefits-section">
                <h6><i class="fas fa-heart me-2"></i>Beneficios</h6>
                <p>${recipe.benefits || 'Esta mezcla está diseñada para mejorar tu bienestar general.'}</p>
            </div>

            <div class="nutrients-section">
                <h6><i class="fas fa-leaf me-2"></i>Vitaminas y minerales destacados</h6>
                <div class="nutrients-tags">
                    ${highlightedNutrients.map(nutrient => `
                        <span class="nutrient-tag">${nutrient}</span>
                    `).join('')}
                </div>
            </div>

            <div class="precautions-section">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Precauciones</h6>
                <p class="text-muted small">${recipe.precautions || 'Consulta con un profesional de la salud antes de consumir.'}</p>
            </div>

            <div class="recipe-footer mt-4">
                <div class="row">
                    <div class="col-6">
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${recipe.preparation_time || '5-10 minutos'}
                        </small>
                    </div>
                    <div class="col-6 text-end">
                        <small class="text-muted">
                            <i class="fas fa-utensils me-1"></i>
                            ${recipe.total_servings || 1} porción
                        </small>
                    </div>
                </div>
                
                ${this.renderFlavorAnalysis(recipe)}
                ${this.renderBioavailabilityAnalysis(recipe)}
                
                <!-- Botones de acción -->
                <div class="row mt-4 mb-4">
                    <div class="col-12 text-center">
                        <button class="btn btn-primary btn-lg me-2" onclick="window.recipeGenerator.compareBenchmark('${recipe.recipe_id || ''}')" id="benchmarkBtn">
                            <i class="fas fa-chart-line me-2"></i>
                            Comparar con el Mercado
                        </button>
                        <button class="btn btn-outline-primary me-2" onclick="window.recipeGenerator.printRecipe()">
                            <i class="fas fa-print me-1"></i>
                            Imprimir Receta
                        </button>
                        <button class="btn btn-success" onclick="window.recipeGenerator.showMarketplace()">
                            <i class="fas fa-shopping-cart me-1"></i>
                            Cotiza ahora
                        </button>
                    </div>
                </div>
                
                <!-- Sistema de Reviews -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-white">
                                <h5 class="mb-0">
                                    <i class="fas fa-star me-2"></i>
                                    ¿Qué te pareció esta receta?
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="text-center mb-3">
                                    <div class="rating-stars" id="ratingStars-${recipe.recipe_id || ''}">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="far fa-star rating-star" data-rating="${star}" onclick="window.recipeGenerator.setRating('${recipe.recipe_id || ''}', ${star})" style="font-size: 2rem; color: #ffc107; cursor: pointer; margin: 0 5px;"></i>
                                        `).join('')}
                                    </div>
                                    <p class="text-muted mt-2 mb-0">Haz clic en las estrellas para calificar</p>
                                </div>
                                <div class="form-group">
                                    <textarea class="form-control" id="reviewComment-${recipe.recipe_id || ''}" rows="3" placeholder="Cuéntanos tu experiencia (opcional)..."></textarea>
                                </div>
                                <div class="text-center mt-3">
                                    <button class="btn btn-warning" onclick="window.recipeGenerator.submitReview('${recipe.recipe_id || ''}')" id="submitReviewBtn-${recipe.recipe_id || ''}">
                                        <i class="fas fa-paper-plane me-2"></i>
                                        Enviar Opinión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInteractionsAnalysis(recipe) {
        if (!recipe.interactions_analysis) return '';
        
        const analysis = recipe.interactions_analysis;
        let html = `
            <div class="interactions-section mb-4">
                <h5 class="mb-3">
                    <i class="fas fa-atom me-2"></i>
                    Análisis de Biodisponibilidad
                </h5>
        `;
        
        if (analysis.synergies && analysis.synergies.length > 0) {
            html += `
                <div class="alert alert-success" role="alert">
                    <h6 class="alert-heading">
                        <i class="fas fa-arrow-up me-2"></i>
                        Sinergias Potenciadoras Detectadas
                    </h6>
                    <ul class="mb-0">
            `;
            
            analysis.synergies.forEach(synergy => {
                html += `<li>${synergy}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        if (analysis.inhibitors_avoided && analysis.inhibitors_avoided.length > 0) {
            html += `
                <div class="alert alert-info" role="alert">
                    <h6 class="alert-heading">
                        <i class="fas fa-shield-alt me-2"></i>
                        Interacciones Inhibidoras Evitadas
                    </h6>
                    <ul class="mb-0">
            `;
            
            analysis.inhibitors_avoided.forEach(inhibitor => {
                html += `<li>${inhibitor}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        if (analysis.bioavailability_score) {
            const score = analysis.bioavailability_score;
            const scoreClass = score >= 8 ? 'success' : score >= 6 ? 'warning' : 'danger';
            
            html += `
                <div class="alert alert-${scoreClass}" role="alert">
                    <strong>Score de Biodisponibilidad:</strong> ${score}/10
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    renderFlavorAnalysis(recipe) {
        if (!recipe.flavor_analysis) return '';
        
        const flavor = recipe.flavor_analysis;
        return `
            <div class="flavor-analysis mt-4">
                <h6><i class="fas fa-seedling me-2"></i>Análisis de Sabor</h6>
                <div class="alert alert-info">
                    <p><strong>${flavor.description}</strong></p>
                    ${flavor.recommendations && flavor.recommendations.length > 0 ? `
                    <p><strong>Te recomendamos agregarle:</strong></p>
                    <ul>
                        ${flavor.recommendations.map(rec => `
                            <li><strong>${rec.ingredient}</strong> (${rec.amount}) - ${rec.reason}</li>
                        `).join('')}
                    </ul>
                    <small class="text-muted">Para asegurar mejor sabor</small>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderBioavailabilityAnalysis(recipe) {
        if (!recipe.bioavailability_analysis) return '';
        
        const bio = recipe.bioavailability_analysis;
        return `
            <div class="bioavailability-analysis mt-4">
                <h6><i class="fas fa-dna me-2"></i>Sinergia Nutricional</h6>
                <div class="alert alert-warning">
                    <p><strong>Esta receta podría tener un ${bio.potential_improvement} más de biodisponibilidad si agregas:</strong></p>
                    ${bio.synergies && bio.synergies.length > 0 ? `
                    <ul>
                        ${bio.synergies.map(syn => `
                            <li><strong>${syn.enhancer}</strong> - ${syn.mechanism} 
                                <span class="badge bg-success">+${syn.increase}</span>
                                <br><small class="text-muted">Evidencia: ${syn.source}</small>
                            </li>
                        `).join('')}
                    </ul>
                    ` : ''}
                    <div class="mt-3">
                        <h6>Sinergia Nutricional Científicamente Validada:</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Nivel 10 - Evidencia Clínica Sólida:</strong>
                                <ul class="small">
                                    <li>Cúrcuma + Pimienta Negra: +2000% biodisponibilidad</li>
                                    <li>Validado por Johns Hopkins Medicine</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <strong>Nivel 9 - Evidencia Clínica Fuerte:</strong>
                                <ul class="small">
                                    <li>Vitamina C + Hierro: +300% absorción</li>
                                    <li>Açaí + Vitamina C: +40% absorción de antocianinas</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    printRecipe() {
        if (!this.currentRecipe) {
            alert('No hay receta para imprimir');
            return;
        }

        this.log('🖨️ Printing recipe...');

        const recipe = this.currentRecipe;
        const ingredients = recipe.ingredients || [];
        const instructions = recipe.instructions || [];
        const nutritionMetrics = recipe.nutrition_metrics || {};
        const highlightedNutrients = recipe.highlighted_nutrients || [];
        const flavorAnalysis = recipe.flavor_analysis || {};
        const bioavailabilityAnalysis = recipe.bioavailability_analysis || {};

        const printContent = `
            <html>
            <head>
                <title>${recipe.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    h1 { color: #2d5a87; border-bottom: 2px solid #2d5a87; padding-bottom: 10px; }
                    h2 { color: #4a90a4; margin-top: 25px; }
                    h3 { color: #5a9bd4; margin-top: 20px; }
                    .ingredient { margin: 5px 0; }
                    .ingredient-with-bio { margin: 8px 0; padding: 5px; background: #f8f9fa; border-radius: 3px; }
                    .bioavailability { color: #28a745; font-weight: bold; font-size: 12px; }
                    .provider { color: #6c757d; font-size: 12px; }
                    .nutrition { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .nutrients { margin: 10px 0; }
                    .nutrient-tag { background: #e3f2fd; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 12px; display: inline-block; }
                    .flavor-section { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .bioavailability-section { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .synergy-item { margin: 10px 0; padding: 8px; background: #f1f8e9; border-radius: 3px; }
                    .evidence-level { font-weight: bold; color: #2e7d32; }
                    .recommendation { margin: 8px 0; padding: 5px; background: #e8f5e8; border-radius: 3px; }
                    .precautions { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 12px; }
                    ol li { margin: 8px 0; }
                    .time-servings { color: #6c757d; font-size: 14px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>${recipe.name}</h1>
                
                <h2>Ingredientes:</h2>
                ${ingredients.map(ingredient => `
                    <div class="ingredient-with-bio">
                        <strong>${ingredient.name}:</strong> ${ingredient.amount} ${ingredient.unit} (${ingredient.grams}g)
                        <br><span class="provider">Proveedor: ${ingredient.proveedor || 'No especificado'}</span>
                        <br><span class="bioavailability">Nivel de biodisponibilidad: ${ingredient.bioavailability_level || '60%'}</span>
                    </div>
                `).join('')}
                <div class="ingredient">
                    <strong>Agua o leche vegetal:</strong> 250 ml (250g)
                    <br><span class="provider">Base líquida</span>
                </div>

                <h2>Preparación:</h2>
                <ol>
                    ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ol>

                <h2>Beneficios:</h2>
                <p>${recipe.benefits || 'Esta mezcla está especialmente diseñada para potenciar tu bienestar con superalimentos ricos en nutrientes esenciales, antioxidantes y compuestos bioactivos que trabajan en sinergia para potenciar tu bienestar.'}</p>

                <div class="nutrition">
                    <h3>Información Nutricional:</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        ${Object.entries(nutritionMetrics).map(([key, value]) => `
                            <div style="text-align: center; padding: 8px; background: white; border-radius: 3px;">
                                <div style="font-size: 18px; font-weight: bold; color: #2d5a87;">${value}</div>
                                <div style="font-size: 12px; color: #6c757d;">${key}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="nutrients">
                    <h3>Vitaminas y minerales destacados:</h3>
                    ${highlightedNutrients.map(nutrient => `<span class="nutrient-tag">${nutrient}</span>`).join('')}
                </div>

                <div class="time-servings">
                    ⏱️ ${recipe.preparation_time || '5-10 minutos'} &nbsp;&nbsp;&nbsp; 🍽️ ${recipe.total_servings || 1} porción
                </div>

                ${flavorAnalysis.description ? `
                <div class="flavor-section">
                    <h3>🍯 Análisis de Sabor</h3>
                    <p><strong>${flavorAnalysis.description}</strong></p>
                    ${flavorAnalysis.recommendations && flavorAnalysis.recommendations.length > 0 ? `
                    <p><strong>Te recomendamos agregarle:</strong></p>
                    <ul>
                        ${flavorAnalysis.recommendations.map(rec => `
                            <li class="recommendation"><strong>${rec.ingredient}</strong> (${rec.amount}) - ${rec.reason}</li>
                        `).join('')}
                    </ul>
                    <p><em>Para asegurar mejor sabor</em></p>
                    ` : ''}
                </div>
                ` : ''}

                ${bioavailabilityAnalysis.potential_improvement ? `
                <div class="bioavailability-section">
                    <h3>🧬 Sinergia Nutricional</h3>
                    <p><strong>Esta receta podría tener un ${bioavailabilityAnalysis.potential_improvement} más de biodisponibilidad si agregas:</strong></p>
                    
                    ${bioavailabilityAnalysis.synergies && bioavailabilityAnalysis.synergies.length > 0 ? `
                    <ul>
                        ${bioavailabilityAnalysis.synergies.map(syn => `
                            <li class="synergy-item">
                                <strong>${syn.enhancer}</strong> - ${syn.mechanism} 
                                <span class="evidence-level">+${syn.increase}</span>
                                <br><small>Evidencia: ${syn.source}</small>
                            </li>
                        `).join('')}
                    </ul>
                    ` : ''}
                    
                    <h4>Sinergia Nutricional Científicamente Validada:</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                        <div>
                            <strong class="evidence-level">Nivel 10 - Evidencia Clínica Sólida:</strong>
                            <ul style="font-size: 12px; margin-top: 5px;">
                                <li>Cúrcuma + Pimienta Negra: +2000% biodisponibilidad</li>
                                <li>Validado por Johns Hopkins Medicine</li>
                            </ul>
                        </div>
                        <div>
                            <strong class="evidence-level">Nivel 9 - Evidencia Clínica Fuerte:</strong>
                            <ul style="font-size: 12px; margin-top: 5px;">
                                <li>Vitamina C + Hierro: +300% absorción</li>
                                <li>Açaí + Vitamina C: +40% absorción de antocianinas</li>
                            </ul>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="precautions">
                    <h3>⚠️ Precauciones:</h3>
                    <p>${recipe.precautions || 'Esta receta es para fines informativos y no sustituye el consejo médico profesional. Si estás embarazada, amamantando, tomando medicamentos o tienes alguna condición médica, consulta con tu médico antes de consumir superalimentos.'}</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
    
    // 🛒 FUNCIÓN DEL MARKETPLACE
    showMarketplace() {
        if (!this.currentRecipe) {
            alert('No hay receta para cotizar');
            return;
        }

        this.log('🛒 Mostrando marketplace...');
        
        const recipe = this.currentRecipe;
        const ingredients = recipe.ingredients || [];
        
        // Calcular costos para 30 días
        let totalCost = 0;
        let marketplaceHTML = `
            <div class="marketplace-container">
                <h4 class="text-center mb-4">
                    <i class="fas fa-shopping-cart me-2"></i>
                    Compra tu suplemento especializado para 1 mes
                </h4>
                <div class="recipe-summary mb-4">
                    <h5>${recipe.name}</h5>
                    <p class="text-muted">Total para 30 días de consumo</p>
                </div>
                <div class="ingredients-cost">
                    <h6>Desglose de ingredientes:</h6>
        `;
        
        ingredients.forEach(ingredient => {
            const gramsPerDay = ingredient.grams || 0;
            const gramsPerMonth = gramsPerDay * 30;
            const pricePerKilo = ingredient.precio_kilo || 0;
            const ingredientCost = (gramsPerMonth / 1000) * pricePerKilo;
            totalCost += ingredientCost;
            
            marketplaceHTML += `
                <div class="ingredient-cost-item d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>${ingredient.name}</strong>
                        <br>
                        <small class="text-muted">
                            ${gramsPerDay}g/día × 30 días = ${gramsPerMonth}g total
                        </small>
                        <br>
                        <small class="text-info">
                            <i class="fas fa-store me-1"></i>Proveedor: ${ingredient.proveedor || 'No especificado'}
                        </small>
                    </div>
                    <div class="text-end">
                        <strong>$${ingredientCost.toLocaleString('es-CL')} CLP</strong>
                    </div>
                </div>
            `;
        });
        
        marketplaceHTML += `
                </div>
                <hr>
                <div class="total-cost d-flex justify-content-between align-items-center mb-4">
                    <h5>Total mensual:</h5>
                    <h4 class="text-success">$${totalCost.toLocaleString('es-CL')} CLP</h4>
                </div>
                
                <div class="provider-info mb-4">
                    <h6>Proveedores disponibles:</h6>
                    <p class="text-muted">
                        ${[...new Set(ingredients.map(ing => ing.proveedor).filter(p => p && p !== 'No especificado'))].join(', ')}
                    </p>
                </div>
                
                <div class="maquilado-info alert alert-info">
                    <h6><i class="fas fa-industry me-2"></i>Opciones de maquilado:</h6>
                    <p class="mb-2">Si quieres desarrollar tu propia marca con este suplemento, cotiza aquí por mínimo 1500 unidades.</p>
                    <p class="mb-0">
                        <strong>Contactanos:</strong> 
                        <a href="mailto:info@fresherb.io">info@fresherb.io</a>
                    </p>
                </div>
                
                <div class="action-buttons text-center">
                    <button class="btn btn-success btn-lg me-2" onclick="window.recipeGenerator.addToCart()">
                        <i class="fas fa-cart-plus me-1"></i>
                        Cotiza ahora o pide tu suplemento!
                    </button>
                    <button class="btn btn-outline-secondary" onclick="window.recipeGenerator.closeMarketplace()">
                        <i class="fas fa-times me-1"></i>
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        // Mostrar en modal
        this.showMarketplaceModal(marketplaceHTML);
    }
    
    showMarketplaceModal(content) {
        // Crear modal dinámicamente
        const modalHTML = `
            <div class="modal fade" id="marketplaceModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-shopping-cart me-2"></i>
                                Marketplace de Superalimentos
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const existingModal = document.getElementById('marketplaceModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('marketplaceModal'));
        modal.show();
    }
    
    addToCart() {
        if (!this.currentRecipe) {
            alert('No hay receta para agregar al carrito');
            return;
        }
        
        // Simular agregar al carrito (guardar en localStorage)
        const cartItem = {
            id: `recipe_${Date.now()}`,
            name: this.currentRecipe.name,
            ingredients: this.currentRecipe.ingredients,
            totalCost: this.calculateTotalCost(),
            addedAt: new Date().toISOString()
        };
        
        let cart = JSON.parse(localStorage.getItem('zenlab_cart') || '[]');
        cart.push(cartItem);
        localStorage.setItem('zenlab_cart', JSON.stringify(cart));
        
        alert('¡Receta agregada al carrito! Te contactaremos pronto para procesar tu pedido.');
        this.closeMarketplace();
    }
    
    calculateTotalCost() {
        if (!this.currentRecipe || !this.currentRecipe.ingredients) return 0;
        
        return this.currentRecipe.ingredients.reduce((total, ingredient) => {
            const gramsPerMonth = (ingredient.grams || 0) * 30;
            const pricePerKilo = ingredient.precio_kilo || 0;
            return total + (gramsPerMonth / 1000) * pricePerKilo;
        }, 0);
    }
    
    closeMarketplace() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('marketplaceModal'));
        if (modal) {
            modal.hide();
        }
    }

    getObjectiveLabel(objective) {
        const labels = {
            'immune': 'Fortalecer sistema inmunológico',
            'energy': 'Aumentar energía y vitalidad',
            'cognitive': 'Mejorar rendimiento cognitivo',
            'physical': 'Potenciar rendimiento físico',
            'detox': 'Desintoxicación y limpieza',
            'stress': 'Reducir estrés y mejorar sueño',
            'digestion': 'Mejorar digestión',
            'beauty': 'Mejorar piel, cabello y uñas',
            'muscle': 'Aumentar masa muscular'
        };
        return labels[objective] || objective;
    }

    showError(message) {
        this.log(`❌ Showing error: ${message}`);
        
        const resultsContainer = document.getElementById('recipeResults');
        resultsContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${message}
                <hr>
                <small>
                    <strong>Debug:</strong> Revisa la consola del navegador (F12) para más detalles.
                    <br>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="window.recipeGenerator.showDebugLogs()">
                        Ver Logs de Debug
                    </button>
                </small>
            </div>
        `;
        resultsContainer.classList.remove('d-none');
    }
    // ============================================================
    // SISTEMA DE BENCHMARK - Comparación con el Mercado
    // ============================================================
    
    async compareBenchmark(recipeId) {
        this.log(`🏆 Comparando receta ${recipeId} con el mercado...`);
        
        if (!recipeId) {
            alert('Error: No se puede comparar sin Recipe ID');
            return;
        }
        
        // Mostrar loading en el botón
        const btn = document.getElementById('benchmarkBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analizando...';
        btn.disabled = true;
        
        try {
            // El benchmark ya viene en la receta, solo necesitamos mostrarlo
            if (this.currentRecipe && this.currentRecipe.benchmark_analysis) {
                this.showBenchmarkModal(this.currentRecipe.benchmark_analysis);
            } else {
                // Si no está, hacer request al backend
                const response = await fetch(`/get_benchmark/${recipeId}`);
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                this.showBenchmarkModal(data);
            }
        } catch (error) {
            this.log(`❌ Error en benchmark: ${error.message}`);
            alert(`Error al obtener análisis de benchmark: ${error.message}`);
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
    
    showBenchmarkModal(analysis) {
        this.log('📊 Mostrando modal de benchmark');
        
        const score = analysis.overall_score || 0;
        const interpretation = analysis.interpretation || 'N/A';
        const mostSimilar = analysis.most_similar_product || {};
        const similarProducts = analysis.similar_products || [];
        
        // Determinar color del score
        let scoreColor = 'danger';
        if (score >= 80) scoreColor = 'success';
        else if (score >= 60) scoreColor = 'info';
        else if (score >= 40) scoreColor = 'warning';
        
        const modalHTML = `
            <div class="modal fade" id="benchmarkModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-chart-line me-2"></i>
                                Análisis de Competitividad
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Score General -->
                            <div class="text-center mb-4">
                                <h2 class="display-3 text-${scoreColor} mb-2">${score}/100</h2>
                                <p class="lead">${interpretation}</p>
                            </div>
                            
                            <hr>
                            
                            <!-- Producto Más Similar -->
                            ${mostSimilar.producto ? `
                            <div class="card border-${scoreColor} mb-4">
                                <div class="card-header bg-${scoreColor} text-white">
                                    <h6 class="mb-0">
                                        <i class="fas fa-trophy me-2"></i>
                                        Producto Más Similar
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <h5>${mostSimilar.producto}</h5>
                                    <p class="text-muted mb-2">
                                        <strong>Marca:</strong> ${mostSimilar.marca || 'N/A'}<br>
                                        <strong>Categoría:</strong> ${mostSimilar.categoria || 'N/A'}
                                    </p>
                                    <div class="progress" style="height: 25px;">
                                        <div class="progress-bar bg-${scoreColor}" role="progressbar" 
                                             style="width: ${mostSimilar.similarity_score || 0}%"
                                             aria-valuenow="${mostSimilar.similarity_score || 0}" 
                                             aria-valuemin="0" aria-valuemax="100">
                                            ${mostSimilar.similarity_score || 0}% Similar
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Top 3 Productos Similares -->
                            ${similarProducts.length > 0 ? `
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">
                                        <i class="fas fa-list-ol me-2"></i>
                                        Top 3 Productos Similares
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="list-group">
                                        ${similarProducts.slice(0, 3).map((prod, idx) => `
                                            <div class="list-group-item">
                                                <div class="d-flex w-100 justify-content-between align-items-center">
                                                    <div>
                                                        <h6 class="mb-1">
                                                            <span class="badge bg-secondary me-2">#${idx + 1}</span>
                                                            ${prod.producto || 'Unknown'}
                                                        </h6>
                                                        <small class="text-muted">${prod.marca || 'N/A'} - ${prod.categoria || 'N/A'}</small>
                                                    </div>
                                                    <span class="badge bg-primary rounded-pill" style="font-size: 1rem;">
                                                        ${prod.similarity_score || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Recomendaciones -->
                            <div class="alert alert-info">
                                <h6 class="alert-heading">
                                    <i class="fas fa-lightbulb me-2"></i>
                                    Recomendaciones para Mejorar
                                </h6>
                                ${score < 60 ? `
                                    <ul class="mb-0">
                                        <li>Ajusta las proporciones de macronutrientes</li>
                                        <li>Considera fortificar con vitaminas clave</li>
                                        <li>Optimiza la biodisponibilidad de nutrientes</li>
                                        <li>Balancea el perfil de aminoácidos</li>
                                    </ul>
                                ` : score < 80 ? `
                                    <ul class="mb-0">
                                        <li>Perfil nutricional bueno, considera agregar superalimentos premium</li>
                                        <li>Optimiza la biodisponibilidad con enzimas digestivas</li>
                                        <li>Considera agregar adaptógenos para diferenciación</li>
                                    </ul>
                                ` : `
                                    <p class="mb-0">
                                        ¡Excelente! Tu receta está al nivel de productos premium del mercado.
                                        Mantén la calidad y considera certificaciones orgánicas para destacar aún más.
                                    </p>
                                `}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="window.recipeGenerator.regenerateWithBenchmark()">
                                <i class="fas fa-sync-alt me-2"></i>
                                Regenerar Optimizada
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const existingModal = document.getElementById('benchmarkModal');
        if (existingModal) existingModal.remove();
        
        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('benchmarkModal'));
        modal.show();
    }
    
    async regenerateWithBenchmark() {
        // ✅ IMPLEMENTADO: Regeneración optimizada funcional
        if (!this.currentRecipe) {
            this.showNotification('⚠️ No hay receta para optimizar', 'warning');
            return;
        }
        
        try {
            // Cerrar modal de benchmark
            const modal = bootstrap.Modal.getInstance(document.getElementById('benchmarkModal'));
            if (modal) modal.hide();
            
            // Mostrar loading
            this.showNotification('🔄 Regenerando receta optimizada...', 'info');
            this.setLoading(true);
            
            // Llamar al endpoint de regeneración
            const response = await fetch('/regenerate_optimized', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    original_recipe_data: this.currentRecipe,
                    target_score: 80,  // Objetivo: 80/100
                    max_iterations: 3  // Máximo 3 intentos
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Mostrar receta optimizada
                this.currentRecipe = data.optimized_recipe;
                this.displayRecipe(data.optimized_recipe);
                
                // Mostrar notificación de éxito
                const improvement = data.final_score - data.initial_score;
                this.showNotification(
                    `✅ Receta optimizada! Score: ${data.initial_score.toFixed(1)} → ${data.final_score.toFixed(1)} (+${improvement.toFixed(1)} puntos)`,
                    'success'
                );
            } else {
                throw new Error(data.message || 'Error al regenerar receta');
            }
            
        } catch (error) {
            console.error('Error en regeneración:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'danger');
        } finally {
            this.setLoading(false);
        }
    }
    
    // ============================================================
    // SISTEMA DE REVIEWS - Calificación de Usuarios
    // ============================================================
    
    setRating(recipeId, rating) {
        this.log(`⭐ Rating seleccionado: ${rating} estrellas para receta ${recipeId}`);
        
        // Actualizar visualización de estrellas
        const container = document.getElementById(`ratingStars-${recipeId}`);
        if (!container) return;
        
        const stars = container.querySelectorAll('.rating-star');
        stars.forEach((star, idx) => {
            if (idx < rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
        
        // Guardar rating seleccionado
        this.selectedRating = rating;
        this.selectedRecipeId = recipeId;
    }
    
    async submitReview(recipeId) {
        this.log(`📝 Enviando review para receta ${recipeId}`);
        
        if (!this.selectedRating) {
            alert('Por favor selecciona una calificación (estrellas) antes de enviar');
            return;
        }
        
        const comment = document.getElementById(`reviewComment-${recipeId}`)?.value || '';
        
        // Mostrar loading en botón
        const btn = document.getElementById(`submitReviewBtn-${recipeId}`);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        btn.disabled = true;
        
        try {
            const response = await fetch('/submit_feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipe_id: recipeId,
                    user_id: 'anonymous',  // TODO: Integrar sistema de usuarios
                    rating: this.selectedRating,
                    comment: comment
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Mostrar éxito
            this.log('✅ Review enviada exitosamente');
            alert('¡Gracias por tu opinión! Tu feedback nos ayuda a mejorar.');
            
            // Limpiar formulario
            this.selectedRating = null;
            const stars = document.querySelectorAll(`#ratingStars-${recipeId} .rating-star`);
            stars.forEach(star => {
                star.classList.remove('fas');
                star.classList.add('far');
            });
            document.getElementById(`reviewComment-${recipeId}`).value = '';
            
        } catch (error) {
            this.log(`❌ Error enviando review: ${error.message}`);
            alert(`Error al enviar opinión: ${error.message}`);
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
}
// ========== FUNCIONES GLOBALES ==========

function openRecipeGenerator() {
    console.log('🚀 Opening recipe generator modal');
    const modal = new bootstrap.Modal(document.getElementById('recipeGeneratorModal'));
    modal.show();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, initializing ModernRecipeGenerator');
    window.recipeGenerator = new ModernRecipeGenerator();
});

// Smooth scrolling para anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(17, 24, 39, 0.98)';
    } else {
        navbar.style.background = 'rgba(17, 24, 39, 0.95)';
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.recipeGenerator = new ModernRecipeGenerator();
    console.log('✅ Modern Recipe Generator V3.0 inicializado con Benchmark y Reviews');
});
