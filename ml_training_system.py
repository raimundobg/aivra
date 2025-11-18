"""
Sistema de Machine Learning para Optimización de Recetas
==========================================================

Este módulo implementa un sistema de ML que aprende de los ratings de usuarios
para predecir y optimizar futuras recetas.

Arquitectura:
1. Recopilación de datos (feedback de usuarios)
2. Feature engineering (extracción de características de recetas)
3. Entrenamiento de modelo (Random Forest / Gradient Boosting)
4. Predicción de ratings para nuevas recetas
5. Optimización basada en predicciones

Autor: ZenLab AI Team
Versión: 1.0
Fecha: 2025-01-09
"""

import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import json

# ML imports (instalar con: pip install scikit-learn)
try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
    import joblib
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("⚠️ scikit-learn no instalado. Instala con: pip install scikit-learn")


class RecipeMLSystem:
    """
    Sistema de Machine Learning para optimización de recetas basado en feedback de usuarios.
    """
    
    def __init__(self, feedback_db_path: str = 'user_feedback.db', 
                 model_path: str = 'models/recipe_predictor.pkl'):
        """
        Inicializa el sistema de ML.
        
        Args:
            feedback_db_path: Ruta a la base de datos de feedback
            model_path: Ruta donde guardar/cargar el modelo entrenado
        """
        self.feedback_db_path = feedback_db_path
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.feature_names = []
        
        if not ML_AVAILABLE:
            print("❌ ML no disponible. Instala scikit-learn para usar esta funcionalidad.")
    
    def extract_features_from_recipe(self, recipe: Dict) -> Dict[str, float]:
        """
        Extrae características (features) de una receta para ML.
        
        Features extraídos:
        - Métricas nutricionales (proteína, calorías, omega-3, etc.)
        - Número de ingredientes
        - Benchmark score
        - Biodisponibilidad score
        - Tipo de producto
        - Objetivo principal
        
        Args:
            recipe: Diccionario con datos de la receta
            
        Returns:
            Dict con features numéricos
        """
        features = {}
        
        # Métricas nutricionales
        nutrition = recipe.get('nutrition_metrics', {})
        features['protein'] = float(nutrition.get('protein', 0))
        features['calories'] = float(nutrition.get('calories', 0))
        features['omega_3'] = float(nutrition.get('omega_3', 0))
        features['fiber'] = float(nutrition.get('fiber', 0))
        features['antioxidants'] = float(nutrition.get('antioxidants', 0))
        features['vitamin_c'] = float(nutrition.get('vitamin_c', 0))
        features['carbs'] = float(nutrition.get('carbs', 0))
        features['fat'] = float(nutrition.get('fat', 0))
        
        # Características de la receta
        features['num_ingredients'] = len(recipe.get('ingredients', []))
        features['package_size'] = int(recipe.get('package_size', 100))
        features['servings'] = int(recipe.get('servings', 30))
        
        # Scores
        features['benchmark_score'] = float(recipe.get('benchmark_score', 0))
        
        bioavailability = recipe.get('bioavailability_analysis', {})
        features['bioavailability_score'] = float(bioavailability.get('bioavailability_score', 0))
        
        # Objetivo (one-hot encoding)
        objective = recipe.get('primary_objective', 'energy')
        objectives = ['energy', 'immune', 'cognitive', 'physical', 'detox', 
                     'stress', 'digestion', 'beauty', 'muscle']
        for obj in objectives:
            features[f'objective_{obj}'] = 1.0 if objective == obj else 0.0
        
        # Tipo de producto (one-hot encoding)
        product_type = recipe.get('product_type', 'polvo_batidos')
        product_types = ['polvo_batidos', 'jugo_funcional', 'capsula_suplemento',
                        'polvo_hidratacion', 'golden_milk', 'supergreens']
        for ptype in product_types:
            features[f'product_{ptype}'] = 1.0 if product_type == ptype else 0.0
        
        return features
    
    def load_training_data(self, min_samples: int = 100) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Carga datos de entrenamiento desde la base de datos de feedback.
        
        Args:
            min_samples: Número mínimo de muestras requeridas
            
        Returns:
            Tuple (X: features, y: ratings)
        """
        print(f"📊 Cargando datos de entrenamiento desde {self.feedback_db_path}...")
        
        try:
            conn = sqlite3.connect(self.feedback_db_path)
            
            # Cargar feedback con metadata de recetas
            query = """
                SELECT 
                    f.recipe_id,
                    f.rating,
                    f.comment,
                    f.timestamp,
                    r.recipe_data
                FROM feedback f
                LEFT JOIN generated_recipes r ON f.recipe_id = r.recipe_id
                WHERE f.rating IS NOT NULL
                ORDER BY f.timestamp DESC
            """
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            print(f"✅ {len(df)} registros de feedback cargados")
            
            if len(df) < min_samples:
                print(f"⚠️ Advertencia: Solo {len(df)} muestras disponibles (mínimo recomendado: {min_samples})")
                print(f"   El modelo puede no ser confiable con tan pocos datos.")
            
            # Extraer features de cada receta
            features_list = []
            ratings = []
            
            for idx, row in df.iterrows():
                try:
                    recipe_data = json.loads(row['recipe_data']) if row['recipe_data'] else {}
                    features = self.extract_features_from_recipe(recipe_data)
                    features_list.append(features)
                    ratings.append(row['rating'])
                except Exception as e:
                    print(f"⚠️ Error procesando receta {row['recipe_id']}: {e}")
                    continue
            
            X = pd.DataFrame(features_list)
            y = pd.Series(ratings)
            
            self.feature_names = list(X.columns)
            
            print(f"✅ Features extraídos: {len(self.feature_names)} características")
            print(f"✅ Dataset: {len(X)} muestras con {len(self.feature_names)} features")
            
            return X, y
            
        except Exception as e:
            print(f"❌ Error cargando datos: {e}")
            return pd.DataFrame(), pd.Series()
    
    def train_model(self, min_samples: int = 100, test_size: float = 0.2, 
                   model_type: str = 'random_forest') -> Dict:
        """
        Entrena el modelo de ML con datos de feedback.
        
        Args:
            min_samples: Número mínimo de muestras requeridas
            test_size: Proporción de datos para testing (0.2 = 20%)
            model_type: 'random_forest' o 'gradient_boosting'
            
        Returns:
            Dict con métricas de evaluación
        """
        if not ML_AVAILABLE:
            return {'error': 'scikit-learn no instalado'}
        
        print("=" * 80)
        print("🤖 ENTRENANDO MODELO DE ML")
        print("=" * 80)
        
        # Cargar datos
        X, y = self.load_training_data(min_samples=min_samples)
        
        if len(X) == 0:
            return {'error': 'No hay datos de entrenamiento disponibles'}
        
        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        print(f"\n📊 Dataset split:")
        print(f"   Training: {len(X_train)} muestras")
        print(f"   Testing: {len(X_test)} muestras")
        
        # Normalizar features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Seleccionar modelo
        if model_type == 'random_forest':
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            print(f"\n🌲 Modelo: Random Forest (100 árboles)")
        else:
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )
            print(f"\n🚀 Modelo: Gradient Boosting")
        
        # Entrenar
        print(f"\n⏳ Entrenando modelo...")
        self.model.fit(X_train_scaled, y_train)
        print(f"✅ Modelo entrenado")
        
        # Evaluar
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)
        
        metrics = {
            'train_r2': r2_score(y_train, y_pred_train),
            'test_r2': r2_score(y_test, y_pred_test),
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_pred_train)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred_test)),
            'train_mae': mean_absolute_error(y_train, y_pred_train),
            'test_mae': mean_absolute_error(y_test, y_pred_test),
            'n_samples': len(X),
            'n_features': len(self.feature_names),
            'model_type': model_type
        }
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, 
                                    cv=5, scoring='r2', n_jobs=-1)
        metrics['cv_r2_mean'] = cv_scores.mean()
        metrics['cv_r2_std'] = cv_scores.std()
        
        print(f"\n📊 MÉTRICAS DE EVALUACIÓN:")
        print(f"   R² (train): {metrics['train_r2']:.3f}")
        print(f"   R² (test): {metrics['test_r2']:.3f}")
        print(f"   RMSE (train): {metrics['train_rmse']:.3f}")
        print(f"   RMSE (test): {metrics['test_rmse']:.3f}")
        print(f"   MAE (train): {metrics['train_mae']:.3f}")
        print(f"   MAE (test): {metrics['test_mae']:.3f}")
        print(f"   CV R² (5-fold): {metrics['cv_r2_mean']:.3f} ± {metrics['cv_r2_std']:.3f}")
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            importances = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print(f"\n🔝 TOP 10 FEATURES MÁS IMPORTANTES:")
            for idx, row in importances.head(10).iterrows():
                print(f"   {row['feature']}: {row['importance']:.4f}")
            
            metrics['feature_importances'] = importances.to_dict('records')
        
        # Guardar modelo
        self.save_model()
        
        print(f"\n✅ Entrenamiento completado")
        print("=" * 80)
        
        return metrics
    
    def predict_rating(self, recipe: Dict) -> float:
        """
        Predice el rating que recibiría una receta.
        
        Args:
            recipe: Diccionario con datos de la receta
            
        Returns:
            Rating predicho (1-5)
        """
        if not ML_AVAILABLE or self.model is None:
            return 3.0  # Rating neutral por defecto
        
        try:
            # Extraer features
            features = self.extract_features_from_recipe(recipe)
            X = pd.DataFrame([features])
            
            # Asegurar que tenga todas las columnas del entrenamiento
            for col in self.feature_names:
                if col not in X.columns:
                    X[col] = 0.0
            
            X = X[self.feature_names]  # Reordenar columnas
            
            # Normalizar y predecir
            X_scaled = self.scaler.transform(X)
            prediction = self.model.predict(X_scaled)[0]
            
            # Clip a rango válido (1-5)
            prediction = np.clip(prediction, 1.0, 5.0)
            
            return float(prediction)
            
        except Exception as e:
            print(f"❌ Error prediciendo rating: {e}")
            return 3.0
    
    def save_model(self):
        """Guarda el modelo entrenado en disco."""
        if not ML_AVAILABLE or self.model is None:
            return
        
        try:
            import os
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'timestamp': datetime.now().isoformat()
            }
            
            joblib.dump(model_data, self.model_path)
            print(f"✅ Modelo guardado en: {self.model_path}")
            
        except Exception as e:
            print(f"❌ Error guardando modelo: {e}")
    
    def load_model(self) -> bool:
        """
        Carga un modelo previamente entrenado.
        
        Returns:
            True si se cargó exitosamente, False si no
        """
        if not ML_AVAILABLE:
            return False
        
        try:
            import os
            if not os.path.exists(self.model_path):
                print(f"⚠️ Modelo no encontrado en: {self.model_path}")
                return False
            
            model_data = joblib.load(self.model_path)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            
            print(f"✅ Modelo cargado desde: {self.model_path}")
            print(f"   Timestamp: {model_data.get('timestamp', 'N/A')}")
            print(f"   Features: {len(self.feature_names)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error cargando modelo: {e}")
            return False
    
    def get_training_stats(self) -> Dict:
        """
        Obtiene estadísticas sobre los datos de entrenamiento disponibles.
        
        Returns:
            Dict con estadísticas
        """
        try:
            conn = sqlite3.connect(self.feedback_db_path)
            
            # Total de feedback
            cursor = conn.execute("SELECT COUNT(*) FROM feedback")
            total_feedback = cursor.fetchone()[0]
            
            # Distribución de ratings
            cursor = conn.execute("""
                SELECT rating, COUNT(*) as count 
                FROM feedback 
                GROUP BY rating 
                ORDER BY rating
            """)
            rating_distribution = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Promedio de rating
            cursor = conn.execute("SELECT AVG(rating) FROM feedback")
            avg_rating = cursor.fetchone()[0] or 0
            
            # Recetas únicas con feedback
            cursor = conn.execute("SELECT COUNT(DISTINCT recipe_id) FROM feedback")
            unique_recipes = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'total_feedback': total_feedback,
                'unique_recipes': unique_recipes,
                'avg_rating': round(avg_rating, 2),
                'rating_distribution': rating_distribution,
                'ready_for_training': total_feedback >= 100
            }
            
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return {}


# ============================================================
# FUNCIONES DE UTILIDAD
# ============================================================

def train_model_cli():
    """Función CLI para entrenar el modelo."""
    print("🤖 Entrenador de Modelo ML - Recipe Optimizer")
    print("=" * 80)
    
    ml_system = RecipeMLSystem()
    
    # Verificar datos disponibles
    stats = ml_system.get_training_stats()
    print(f"\n📊 Datos disponibles:")
    print(f"   Total feedback: {stats.get('total_feedback', 0)}")
    print(f"   Recetas únicas: {stats.get('unique_recipes', 0)}")
    print(f"   Rating promedio: {stats.get('avg_rating', 0)}")
    print(f"   Distribución: {stats.get('rating_distribution', {})}")
    
    if not stats.get('ready_for_training', False):
        print(f"\n⚠️ Advertencia: Se recomienda al menos 100 muestras para entrenar.")
        print(f"   Actualmente tienes {stats.get('total_feedback', 0)} muestras.")
        response = input("\n¿Continuar de todos modos? (s/n): ")
        if response.lower() != 's':
            print("Entrenamiento cancelado.")
            return
    
    # Entrenar
    metrics = ml_system.train_model(min_samples=10)  # Mínimo bajo para testing
    
    if 'error' in metrics:
        print(f"\n❌ Error: {metrics['error']}")
    else:
        print(f"\n✅ Modelo entrenado exitosamente!")
        print(f"   R² (test): {metrics['test_r2']:.3f}")
        print(f"   RMSE (test): {metrics['test_rmse']:.3f}")


if __name__ == '__main__':
    train_model_cli()
