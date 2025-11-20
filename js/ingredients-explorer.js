/* ============================================
   INGREDIENTS EXPLORER JS
   Lógica para el explorador de superalimentos
   ============================================ */

// Variables globales
let allIngredients = [];
let displayedIngredients = [];
let currentPage = 1;
const itemsPerPage = 12;

// Mapeo de categorías
const categoryNames = {
    '1': 'Algas y Microalgas',
    '2': 'Semillas y Frutos Secos',
    '3': 'Cereales y Pseudocereales',
    '4': 'Frutas y Bayas',
    '5': 'Vegetales y Hojas Verdes',
    '6': 'Raíces y Tubérculos',
    '7': 'Hongos Medicinales',
    '8': 'Alimentos Fermentados',
    '9': 'Cacao y Derivados',
    '10': 'Endulzantes Naturales'
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ingredients Explorer iniciado');
    
    // Cargar datos
    loadIngredients();
    
    // Event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(filterIngredients, 300));
    document.getElementById('categoryFilter').addEventListener('change', filterIngredients);
    document.getElementById('loadMoreBtn').addEventListener('click', loadMore);
});

// Función para cargar ingredientes desde la API
async function loadIngredients() {
    try {
        showLoadingState();
        
        const response = await fetch('/api/superfoods?category=all');
        const data = await response.json();
        
        if (data.success) {
            allIngredients = data.data;
            displayedIngredients = allIngredients;
            
            console.log(`✅ Cargados ${allIngredients.length} superalimentos`);
            
            // Actualizar contador
            document.getElementById('totalCount').textContent = allIngredients.length;
            
            // Mostrar resultados
            displayIngredients();
        } else {
            showError('Error al cargar los ingredientes');
        }
        
    } catch (error) {
        console.error('❌ Error cargando ingredientes:', error);
        showError('Error de conexión al cargar los datos');
    }
}

// Función para filtrar ingredientes
function filterIngredients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    
    console.log(`🔍 Filtrando: categoria="${category}", búsqueda="${searchTerm}"`);
    
    // Filtrar por categoría
    let filtered = allIngredients;
    
    if (category !== 'all') {
        filtered = filtered.filter(item => item.categoria_id == category);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(item => {
            const nombre = (item.nombre || '').toLowerCase();
            const cientifico = (item.nombre_cientifico || '').toLowerCase();
            const descripcion = (item.descripcion || '').toLowerCase();
            const funcion = (item.funcion_principal || '').toLowerCase();
            
            return nombre.includes(searchTerm) || 
                   cientifico.includes(searchTerm) || 
                   descripcion.includes(searchTerm) ||
                   funcion.includes(searchTerm);
        });
    }
    
    displayedIngredients = filtered;
    currentPage = 1;
    
    console.log(`📊 Resultados: ${filtered.length} ingredientes`);
    
    displayIngredients();
}

// Función para mostrar ingredientes
function displayIngredients() {
    const container = document.getElementById('resultsContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    // Ocultar estados
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    loadMoreBtn.style.display = 'none';
    
    // Si no hay resultados
    if (displayedIngredients.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    // Calcular ingredientes a mostrar
    const endIndex = currentPage * itemsPerPage;
    const ingredientsToShow = displayedIngredients.slice(0, endIndex);
    
    // Limpiar contenedor
    container.innerHTML = '';
    container.style.display = 'flex';
    
    // Crear cards
    ingredientsToShow.forEach((ingredient, index) => {
        const card = createIngredientCard(ingredient, index);
        container.appendChild(card);
    });
    
    // Mostrar botón "Cargar más" si hay más resultados
    if (endIndex < displayedIngredients.length) {
        loadMoreBtn.style.display = 'inline-block';
    }
}

// Función para crear card de ingrediente
function createIngredientCard(ingredient, index) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';
    col.style.animationDelay = `${(index % itemsPerPage) * 0.05}s`;
    
    // Obtener nutrientes destacados
    const nutrients = getHighlightedNutrients(ingredient);
    
    col.innerHTML = `
        <div class="card ingredient-card" onclick="showIngredientDetail(${ingredient.superalimento_id})">
            <div class="ingredient-header">
                <div class="ingredient-name">${ingredient.nombre}</div>
                <div class="ingredient-scientific">${ingredient.nombre_cientifico || ''}</div>
                <span class="category-badge" data-category="${ingredient.categoria_id}">
                    ${categoryNames[ingredient.categoria_id] || 'Otros'}
                </span>
            </div>
            <div class="ingredient-body">
                <p class="ingredient-description">
                    ${ingredient.descripcion || 'Sin descripción disponible'}
                </p>
                <div class="nutrient-highlights">
                    ${nutrients.map(n => `<span class="nutrient-tag">${n}</span>`).join('')}
                </div>
            </div>
            <div class="ingredient-footer">
                <div class="origin-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${ingredient.origen || 'Origen no especificado'}</span>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Función para obtener nutrientes destacados
function getHighlightedNutrients(ingredient) {
    const nutrients = [];
    
    // Verificar nutrientes principales
    if (ingredient.proteinas && parseFloat(ingredient.proteinas) > 10) {
        nutrients.push('Alto en Proteínas');
    }
    if (ingredient.omega_3 && parseFloat(ingredient.omega_3) > 0) {
        nutrients.push('Omega-3');
    }
    if (ingredient.fibra && parseFloat(ingredient.fibra) > 5) {
        nutrients.push('Alto en Fibra');
    }
    if (ingredient.vitamina_c && parseFloat(ingredient.vitamina_c) > 20) {
        nutrients.push('Vitamina C');
    }
    if (ingredient.hierro && parseFloat(ingredient.hierro) > 5) {
        nutrients.push('Hierro');
    }
    if (ingredient.capacidad_antioxidante_total && parseFloat(ingredient.capacidad_antioxidante_total) > 5000) {
        nutrients.push('Antioxidantes');
    }
    
    // Si no hay nutrientes destacados, usar función principal
    if (nutrients.length === 0 && ingredient.funcion_principal) {
        nutrients.push(ingredient.funcion_principal.substring(0, 30));
    }
    
    // Limitar a 3 nutrientes
    return nutrients.slice(0, 3);
}

// Función para mostrar detalle de ingrediente
async function showIngredientDetail(id) {
    console.log(`📋 Mostrando detalle de ingrediente ID: ${id}`);
    
    const ingredient = allIngredients.find(i => i.superalimento_id == id);
    
    if (!ingredient) {
        alert('Ingrediente no encontrado');
        return;
    }
    
    // Construir contenido del modal
    const modalBody = document.getElementById('ingredientModalBody');
    const modalTitle = document.getElementById('ingredientModalTitle');
    
    modalTitle.innerHTML = `<i class="fas fa-leaf"></i> ${ingredient.nombre}`;
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h6><i class="fas fa-info-circle"></i> Información General</h6>
            <p><strong>Nombre Científico:</strong> ${ingredient.nombre_cientifico || 'N/A'}</p>
            <p><strong>Categoría:</strong> ${categoryNames[ingredient.categoria_id] || 'N/A'}</p>
            <p><strong>Origen:</strong> ${ingredient.origen || 'N/A'}</p>
            <p><strong>Forma de Consumo:</strong> ${ingredient.forma_consumo || 'N/A'}</p>
            <p>${ingredient.descripcion || ''}</p>
        </div>
        
        <div class="detail-section">
            <h6><i class="fas fa-heartbeat"></i> Función Principal</h6>
            <p>${ingredient.funcion_principal || 'No especificada'}</p>
        </div>
        
        <div class="detail-section">
            <h6><i class="fas fa-chart-bar"></i> Información Nutricional (por 100g)</h6>
            <div class="nutrition-grid">
                <div class="nutrition-item">
                    <strong>${ingredient.calorias || '0'}</strong>
                    <small>Calorías</small>
                </div>
                <div class="nutrition-item">
                    <strong>${ingredient.proteinas || '0'}g</strong>
                    <small>Proteínas</small>
                </div>
                <div class="nutrition-item">
                    <strong>${ingredient.carbohidratos || '0'}g</strong>
                    <small>Carbohidratos</small>
                </div>
                <div class="nutrition-item">
                    <strong>${ingredient.grasas_totales || '0'}g</strong>
                    <small>Grasas</small>
                </div>
                <div class="nutrition-item">
                    <strong>${ingredient.fibra || '0'}g</strong>
                    <small>Fibra</small>
                </div>
                <div class="nutrition-item">
                    <strong>${ingredient.omega_3 || '0'}g</strong>
                    <small>Omega-3</small>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h6><i class="fas fa-pills"></i> Vitaminas y Minerales</h6>
            <div class="nutrition-grid">
                ${ingredient.vitamina_c ? `
                <div class="nutrition-item">
                    <strong>${ingredient.vitamina_c}mg</strong>
                    <small>Vitamina C</small>
                </div>` : ''}
                ${ingredient.vitamina_a ? `
                <div class="nutrition-item">
                    <strong>${ingredient.vitamina_a}µg</strong>
                    <small>Vitamina A</small>
                </div>` : ''}
                ${ingredient.calcio ? `
                <div class="nutrition-item">
                    <strong>${ingredient.calcio}mg</strong>
                    <small>Calcio</small>
                </div>` : ''}
                ${ingredient.hierro ? `
                <div class="nutrition-item">
                    <strong>${ingredient.hierro}mg</strong>
                    <small>Hierro</small>
                </div>` : ''}
                ${ingredient.magnesio ? `
                <div class="nutrition-item">
                    <strong>${ingredient.magnesio}mg</strong>
                    <small>Magnesio</small>
                </div>` : ''}
                ${ingredient.zinc ? `
                <div class="nutrition-item">
                    <strong>${ingredient.zinc}mg</strong>
                    <small>Zinc</small>
                </div>` : ''}
            </div>
        </div>
        
        ${ingredient.precauciones ? `
        <div class="detail-section">
            <h6><i class="fas fa-exclamation-triangle"></i> Precauciones</h6>
            <p class="text-warning">${ingredient.precauciones}</p>
        </div>` : ''}
        
        ${ingredient.biodisponibilidad_porcentaje ? `
        <div class="detail-section">
            <h6><i class="fas fa-percentage"></i> Biodisponibilidad</h6>
            <div class="progress" style="height: 25px;">
                <div class="progress-bar bg-success" role="progressbar" 
                     style="width: ${ingredient.biodisponibilidad_porcentaje}%"
                     aria-valuenow="${ingredient.biodisponibilidad_porcentaje}" 
                     aria-valuemin="0" aria-valuemax="100">
                    ${ingredient.biodisponibilidad_porcentaje}%
                </div>
            </div>
        </div>` : ''}
    `;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('ingredientModal'));
    modal.show();
}

// Función para cargar más resultados
function loadMore() {
    currentPage++;
    displayIngredients();
}

// Función para mostrar estado de carga
function showLoadingState() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

// Función para mostrar error
function showError(message) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
            <h4>Error</h4>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary" onclick="loadIngredients()">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    container.style.display = 'block';
}

// Utilidad: Debounce para búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones para uso global
window.showIngredientDetail = showIngredientDetail;