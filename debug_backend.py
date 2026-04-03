import pandas as pd
import os

file_path = os.path.join(os.getcwd(), 'data', 'base_alimentos_porciones.xlsx')
try:
    df = pd.read_excel(file_path, engine='openpyxl')
    print("ALL COLUMNS:", df.columns.tolist())
except Exception as e:
    print(f"Error: {e}")
