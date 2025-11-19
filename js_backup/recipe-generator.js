// Actualizar el valor mostrado del número de ingredientes
document.getElementById('ingredientCount').addEventListener('input', function() {
    document.getElementById('ingredientCountValue').textContent = this.value;
});

// Función para generar una receta personalizada
document.getElementById('generateRecipeBtn').addEventListener('click', function() {
    console.log("DEBUG: Botón de generar receta clickeado");
    
    // Mostrar animación de carga
    document.getElementById('loadingRecipe').style.display = 'block';
    document.getElementById('recipeResult').style.display = 'none';
    
    // Simular tiempo de procesamiento
    setTimeout(function() {
        // Recopilar datos del formulario
        const mainObjective = document.getElementById('mainObjective').value;
        const secondaryObjective1 = document.getElementById('secondaryObjective1').value;
        const secondaryObjective2 = document.getElementById('secondaryObjective2').value;
        const isVegan = document.getElementById('vegan').checked;
        const isGlutenFree = document.getElementById('glutenFree').checked;
        const isNutFree = document.getElementById('nutFree').checked;
        const ingredientCount = parseInt(document.getElementById('ingredientCount').value);
        
        // Verificar fuentes de alimentos seleccionadas
        const selectedSources = {
            fungi: document.getElementById('foodSourceFungi').checked,
            berries: document.getElementById('foodSourceBerries').checked,
            nuts: document.getElementById('foodSourceNuts').checked,
            seafood: document.getElementById('foodSourceSeafood').checked,
            seeds: document.getElementById('foodSourceSeeds').checked,
            greens: document.getElementById('foodSourceGreens').checked
        };
        
        // Filtrar superalimentos según restricciones y preferencias
        let filteredSuperfoods = [...superfoods];
        
        // Filtrar por restricciones dietéticas
        if (isNutFree) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => 
                sf.category !== "Semillas y frutos secos" || 
                (sf.name !== "Nueces" && sf.name !== "Almendras")
            );
        }
        
        // Filtrar por fuentes de alimentos
        if (!selectedSources.fungi) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => sf.category !== "Hongos medicinales");
        }
        if (!selectedSources.berries) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => sf.category !== "Frutas y bayas");
        }
        if (!selectedSources.nuts) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => sf.category !== "Semillas y frutos secos");
        }
        if (!selectedSources.seafood) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => sf.category !== "Algas y microalgas");
        }
        if (!selectedSources.seeds) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => 
                !sf.name.toLowerCase().includes("semilla") && 
                !sf.name.toLowerCase().includes("chía") && 
                !sf.name.toLowerCase().includes("lino")
            );
        }
        if (!selectedSources.greens) {
            filteredSuperfoods = filteredSuperfoods.filter(sf => sf.category !== "Vegetales y hojas verdes");
        }
        
        // Priorizar superalimentos que coincidan con el objetivo principal
        filteredSuperfoods.sort((a, b) => {
            const aMatchesMain = a.benefits.includes(mainObjective) ? 1 : 0;
            const bMatchesMain = b.benefits.includes(mainObjective) ? 1 : 0;
            return bMatchesMain - aMatchesMain;
        });
        
        // Seleccionar superalimentos para la receta
        let selectedSuperfoods = [];
        
        // Asegurar que al menos un superalimento coincida con el objetivo principal
        const mainObjectiveSuperfoods = filteredSuperfoods.filter(sf => sf.benefits.includes(mainObjective));
        if (mainObjectiveSuperfoods.length > 0) {
            selectedSuperfoods.push(mainObjectiveSuperfoods[Math.floor(Math.random() * mainObjectiveSuperfoods.length)]);
        }
        
        // Añadir superalimentos para objetivos secundarios si están seleccionados
        if (secondaryObjective1) {
            const objective1Key = secondaryObjective1.split('_')[0];
            const objective1Superfoods = filteredSuperfoods.filter(
                sf => sf.benefits.includes(objective1Key) && !selectedSuperfoods.includes(sf)
            );
            if (objective1Superfoods.length > 0) {
                selectedSuperfoods.push(objective1Superfoods[Math.floor(Math.random() * objective1Superfoods.length)]);
            }
        }
        
        if (secondaryObjective2) {
            const objective2Key = secondaryObjective2.split('_')[0];
            const objective2Superfoods = filteredSuperfoods.filter(
                sf => sf.benefits.includes(objective2Key) && !selectedSuperfoods.includes(sf)
            );
            if (objective2Superfoods.length > 0) {
                selectedSuperfoods.push(objective2Superfoods[Math.floor(Math.random() * objective2Superfoods.length)]);
            }
        }
        
        // Completar con superalimentos aleatorios hasta alcanzar el número deseado
        const remainingSuperfoods = filteredSuperfoods.filter(sf => !selectedSuperfoods.includes(sf));
        while (selectedSuperfoods.length < ingredientCount && remainingSuperfoods.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingSuperfoods.length);
            selectedSuperfoods.push(remainingSuperfoods[randomIndex]);
            remainingSuperfoods.splice(randomIndex, 1);
        }
        
        // Generar detalles de la receta
        generateRecipeDetails(selectedSuperfoods, mainObjective, secondaryObjective1, secondaryObjective2);
        
        // Ocultar animación de carga y mostrar resultado
        document.getElementById('loadingRecipe').style.display = 'none';
        document.getElementById('recipeResult').style.display = 'block';
        
        // Desplazarse al resultado
        document.getElementById('recipeResult').scrollIntoView({ behavior: 'smooth' });
    }, 1500); // Simular 1.5 segundos de procesamiento
});
