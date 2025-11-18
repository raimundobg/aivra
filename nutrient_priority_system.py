"""
Sistema de Priorización de Nutrientes por Objetivo
Mapea cada objetivo a sus nutrientes clave y umbrales mínimos
"""

def get_nutrient_priorities(objective: str) -> dict:
    """
    Retorna la configuración de priorización de nutrientes para un objetivo dado.
    
    Returns:
        dict: {
            'primary_nutrient': str,  # Nutriente principal a maximizar
            'min_threshold': float,   # Umbral mínimo por 100g
            'secondary_nutrients': list,  # Nutrientes secundarios
            'scoring_weights': dict   # Pesos para scoring
        }
    """
    
    # 🎯 SISTEMA DE PRIORIZACIÓN REPLICABLE
    nutrient_priority_map = {
        # MASA MUSCULAR → Proteína alta
        'aumentar_masa_muscular': {
            'primary_nutrient': 'proteina',
            'min_threshold': 15.0,  # Mínimo 15g/100g
            'secondary_nutrients': ['omega_3', 'calorias'],
            'scoring_weights': {
                'proteina': 10.0,      # Peso máximo
                'omega_3': 2.0,
                'calorias': 1.0
            }
        },
        'muscle': {
            'primary_nutrient': 'proteina',
            'min_threshold': 15.0,
            'secondary_nutrients': ['omega_3', 'calorias'],
            'scoring_weights': {
                'proteina': 10.0,
                'omega_3': 2.0,
                'calorias': 1.0
            }
        },
        
        # ENERGÍA → Calorías y carbohidratos
        'aumentar_energia': {
            'primary_nutrient': 'calorias',
            'min_threshold': 300.0,  # Mínimo 300 kcal/100g
            'secondary_nutrients': ['carbohidratos', 'hierro'],
            'scoring_weights': {
                'calorias': 5.0,
                'carbohidratos': 3.0,
                'hierro': 2.0
            }
        },
        'energy': {
            'primary_nutrient': 'calorias',
            'min_threshold': 300.0,
            'secondary_nutrients': ['carbohidratos', 'hierro'],
            'scoring_weights': {
                'calorias': 5.0,
                'carbohidratos': 3.0,
                'hierro': 2.0
            }
        },
        
        # SISTEMA INMUNE → Vitamina C y antioxidantes
        'mejorar_sistema_inmune': {
            'primary_nutrient': 'vitamina_c',
            'min_threshold': 20.0,  # Mínimo 20mg/100g
            'secondary_nutrients': ['capacidad_antioxidante_total', 'zinc'],
            'scoring_weights': {
                'vitamina_c': 8.0,
                'capacidad_antioxidante_total': 5.0,
                'zinc': 3.0
            }
        },
        'immune': {
            'primary_nutrient': 'vitamina_c',
            'min_threshold': 20.0,
            'secondary_nutrients': ['capacidad_antioxidante_total', 'zinc'],
            'scoring_weights': {
                'vitamina_c': 8.0,
                'capacidad_antioxidante_total': 5.0,
                'zinc': 3.0
            }
        },
        
        # CARDIOVASCULAR → Omega-3 y fibra
        'salud_cardiovascular': {
            'primary_nutrient': 'omega_3',
            'min_threshold': 1.0,  # Mínimo 1g/100g
            'secondary_nutrients': ['fibra', 'potasio'],
            'scoring_weights': {
                'omega_3': 10.0,
                'fibra': 5.0,
                'potasio': 2.0
            }
        },
        'cardiovascular': {
            'primary_nutrient': 'omega_3',
            'min_threshold': 1.0,
            'secondary_nutrients': ['fibra', 'potasio'],
            'scoring_weights': {
                'omega_3': 10.0,
                'fibra': 5.0,
                'potasio': 2.0
            }
        },
        
        # PIEL/BELLEZA → Antioxidantes y vitamina E
        'mejorar_piel': {
            'primary_nutrient': 'capacidad_antioxidante_total',
            'min_threshold': 10.0,  # Mínimo 10 unidades
            'secondary_nutrients': ['vitamina_e', 'vitamina_c'],
            'scoring_weights': {
                'capacidad_antioxidante_total': 8.0,
                'vitamina_e': 5.0,
                'vitamina_c': 3.0
            }
        },
        'beauty': {
            'primary_nutrient': 'capacidad_antioxidante_total',
            'min_threshold': 10.0,
            'secondary_nutrients': ['vitamina_e', 'vitamina_c'],
            'scoring_weights': {
                'capacidad_antioxidante_total': 8.0,
                'vitamina_e': 5.0,
                'vitamina_c': 3.0
            }
        },
        
        # COGNITIVO → Omega-3 y antioxidantes
        'mejorar_concentracion': {
            'primary_nutrient': 'omega_3',
            'min_threshold': 0.5,
            'secondary_nutrients': ['capacidad_antioxidante_total', 'hierro'],
            'scoring_weights': {
                'omega_3': 8.0,
                'capacidad_antioxidante_total': 5.0,
                'hierro': 3.0
            }
        },
        'cognitive': {
            'primary_nutrient': 'omega_3',
            'min_threshold': 0.5,
            'secondary_nutrients': ['capacidad_antioxidante_total', 'hierro'],
            'scoring_weights': {
                'omega_3': 8.0,
                'capacidad_antioxidante_total': 5.0,
                'hierro': 3.0
            }
        },
        
        # DIGESTIÓN → Fibra y probióticos
        'mejorar_digestion': {
            'primary_nutrient': 'fibra',
            'min_threshold': 5.0,  # Mínimo 5g/100g
            'secondary_nutrients': ['capacidad_antioxidante_total'],
            'scoring_weights': {
                'fibra': 10.0,
                'capacidad_antioxidante_total': 3.0
            }
        },
        'digestion': {
            'primary_nutrient': 'fibra',
            'min_threshold': 5.0,
            'secondary_nutrients': ['capacidad_antioxidante_total'],
            'scoring_weights': {
                'fibra': 10.0,
                'capacidad_antioxidante_total': 3.0
            }
        },
        
        # INFLAMACIÓN → Antioxidantes y omega-3
        'reducir_inflamacion': {
            'primary_nutrient': 'capacidad_antioxidante_total',
            'min_threshold': 15.0,
            'secondary_nutrients': ['omega_3', 'vitamina_e'],
            'scoring_weights': {
                'capacidad_antioxidante_total': 8.0,
                'omega_3': 6.0,
                'vitamina_e': 4.0
            }
        },
        'inflammation': {
            'primary_nutrient': 'capacidad_antioxidante_total',
            'min_threshold': 15.0,
            'secondary_nutrients': ['omega_3', 'vitamina_e'],
            'scoring_weights': {
                'capacidad_antioxidante_total': 8.0,
                'omega_3': 6.0,
                'vitamina_e': 4.0
            }
        },
        
        # CONTROL DE AZÚCAR → Fibra y cromo
        'control_azucar': {
            'primary_nutrient': 'fibra',
            'min_threshold': 8.0,
            'secondary_nutrients': ['capacidad_antioxidante_total'],
            'scoring_weights': {
                'fibra': 10.0,
                'capacidad_antioxidante_total': 4.0
            }
        },
        'blood_sugar': {
            'primary_nutrient': 'fibra',
            'min_threshold': 8.0,
            'secondary_nutrients': ['capacidad_antioxidante_total'],
            'scoring_weights': {
                'fibra': 10.0,
                'capacidad_antioxidante_total': 4.0
            }
        },
        
        # HUESOS → Calcio y vitamina D
        'salud_osea': {
            'primary_nutrient': 'calcio',
            'min_threshold': 100.0,  # Mínimo 100mg/100g
            'secondary_nutrients': ['vitamina_d', 'magnesio'],
            'scoring_weights': {
                'calcio': 10.0,
                'vitamina_d': 6.0,
                'magnesio': 4.0
            }
        },
        'bone_health': {
            'primary_nutrient': 'calcio',
            'min_threshold': 100.0,
            'secondary_nutrients': ['vitamina_d', 'magnesio'],
            'scoring_weights': {
                'calcio': 10.0,
                'vitamina_d': 6.0,
                'magnesio': 4.0
            }
        }
    }
    
    # Retornar configuración o None si no existe
    return nutrient_priority_map.get(objective, None)


def calculate_nutrient_score(food_data: dict, priority_config: dict) -> float:
    """
    Calcula el score de un alimento basado en la configuración de prioridad.
    
    Args:
        food_data: Diccionario con datos nutricionales del alimento
        priority_config: Configuración de prioridad del objetivo
    
    Returns:
        float: Score total del alimento
    """
    score = 0.0
    weights = priority_config.get('scoring_weights', {})
    
    for nutrient, weight in weights.items():
        nutrient_value = float(food_data.get(nutrient, 0) or 0)
        score += nutrient_value * weight
    
    return score
