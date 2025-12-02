# ============================================
# API ENDPOINT PARA SERVIR ALIMENTOS DESDE CSV
# Agregar este código a app.py
# ============================================

import pandas as pd
import json
from flask import jsonify
from functools import lru_cache
import os

# ============================================
# CACHE DE ALIMENTOS (se carga una sola vez)
# ============================================
@lru_cache(maxsize=1)
def load_alimentos_database():
    """Cargar base de datos de alimentos desde CSV (con cache)"""
    try:
        # Ruta al CSV
        csv_path = os.path.join('data', 'base_alimentos_porciones.xlsx')
        
        # Leer Excel
        df = pd.read_excel(csv_path)
        
        # Limpiar nombres de columnas
        df.columns = df.columns.str.strip()
        
        # Crear estructura jerárquica
        database = {}
        
        # Agrupar por Grupo
        for grupo in df['Grupo'].unique():
            grupo_key = grupo.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
            database[grupo_key] = {}
            
            df_grupo = df[df['Grupo'] == grupo]
            
            # Agrupar por Subgrupo
            for subgrupo in df_grupo['Subgrupo'].unique():
                subgrupo_key = str(subgrupo).lower().replace(' ', '_').replace(',', '').replace('/', '_').replace('(', '').replace(')', '').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')[:50]
                
                df_subgrupo = df_grupo[df_grupo['Subgrupo'] == subgrupo]
                alimentos_list = []
                
                for _, row in df_subgrupo.iterrows():
                    alimento = {
                        'nombre': str(row['Alimento']),
                        'gramos': str(row['Gramos_por_porción']),
                        'medida_casera': str(row['Medida_casera']),
                        'kcal': float(row['Kcal_por_porción']) if pd.notna(row['Kcal_por_porción']) else 0,
                        'proteinas': float(row['Proteínas_g']) if pd.notna(row['Proteínas_g']) else 0,
                        'lipidos': float(row['Lípidos_g']) if pd.notna(row['Lípidos_g']) else 0,
                        'carbohidratos': float(row['Carbohidratos_g']) if pd.notna(row['Carbohidratos_g']) else 0
                    }
                    alimentos_list.append(alimento)
                
                database[grupo_key][subgrupo_key] = alimentos_list
        
        return database
    
    except Exception as e:
        print(f"Error cargando alimentos: {e}")
        return {}

# ============================================
# ENDPOINT: GET /api/alimentos
# ============================================
@app.route('/api/alimentos', methods=['GET'])
def get_alimentos():
    """
    Endpoint para obtener la base de datos completa de alimentos
    
    Retorna:
        JSON con estructura:
        {
            "success": true,
            "data": {
                "panes_y_cereales": {
                    "pan_cereales_desayuno": [
                        {
                            "nombre": "Avena",
                            "gramos": "40",
                            "medida_casera": "6 cucharadas o ½ taza",
                            "kcal": 140,
                            "proteinas": 3,
                            "lipidos": 1,
                            "carbohidratos": 30
                        },
                        ...
                    ],
                    ...
                },
                ...
            },
            "total_grupos": 9,
            "total_alimentos": 185
        }
    """
    try:
        database = load_alimentos_database()
        
        # Calcular estadísticas
        total_grupos = len(database)
        total_alimentos = sum(
            len(alimentos) 
            for subgrupos in database.values() 
            for alimentos in subgrupos.values()
        )
        
        return jsonify({
            'success': True,
            'data': database,
            'total_grupos': total_grupos,
            'total_alimentos': total_alimentos
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# ENDPOINT: GET /api/alimentos/grupos
# ============================================
@app.route('/api/alimentos/grupos', methods=['GET'])
def get_grupos():
    """
    Endpoint para obtener solo la lista de grupos
    
    Retorna:
        JSON con lista de grupos disponibles
    """
    try:
        database = load_alimentos_database()
        grupos = list(database.keys())
        
        return jsonify({
            'success': True,
            'grupos': grupos
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# ENDPOINT: GET /api/alimentos/<grupo>/<subgrupo>
# ============================================
@app.route('/api/alimentos/<grupo>/<subgrupo>', methods=['GET'])
def get_alimentos_by_subgrupo(grupo, subgrupo):
    """
    Endpoint para obtener alimentos de un subgrupo específico
    
    Parámetros:
        grupo: Key del grupo (ej: "panes_y_cereales")
        subgrupo: Key del subgrupo (ej: "pan_cereales_desayuno")
    
    Retorna:
        JSON con lista de alimentos del subgrupo
    """
    try:
        database = load_alimentos_database()
        
        if grupo not in database:
            return jsonify({
                'success': False,
                'error': 'Grupo no encontrado'
            }), 404
        
        if subgrupo not in database[grupo]:
            return jsonify({
                'success': False,
                'error': 'Subgrupo no encontrado'
            }), 404
        
        alimentos = database[grupo][subgrupo]
        
        return jsonify({
            'success': True,
            'grupo': grupo,
            'subgrupo': subgrupo,
            'alimentos': alimentos,
            'total': len(alimentos)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500