#!/usr/bin/env python3
import pandas as pd
import json

# Lista de los 26 que ya habían respondido (según los datos que proporcionaste)
responders_names = [
    "daniel talero", "Leany Montero", "Beatriz Alvarez", "Jesus Ramirez", "Sandra Riaño",
    "Viviana Estrada", "Leidis Teheran", "Angie Rodriguez", "Roger Guzman", "Jessica Ramirez",
    "Paola Acevedo", "Edison Cagua", "Luz Matabajoy", "Jhon Canizales", "Paula Delgado",
    "Karen Melendez", "Yenny Leal", "Adriana Sanabria", "Neidy Jimenez", "Maria Ramirez",
    "Karen Escobar", "Cristian Navia", "Cristian Coronado", "Sergio Cardona", "Daniela Labao",
    "Leysli Rojas"
]

try:
    # Leer el CSV
    df = pd.read_csv("/workspaces/siigo-retiros/recuperacion_users.csv")
    
    print(f"Total de usuarios en CSV: {len(df)}")
    print(f"Usuarios que ya habían respondido: {len(responders_names)}")
    
    # Función para normalizar nombres
    def normalize_name(name):
        if pd.isna(name):
            return ""
        return str(name).lower().strip()
    
    # Crear nombre completo normalizado
    df['full_name_normalized'] = (df['Nombre'].astype(str) + ' ' + df['Apellido'].fillna('').astype(str)).apply(normalize_name)
    
    # Encontrar coincidencias
    responders_found = []
    not_found = []
    
    for responder_name in responders_names:
        normalized_responder = normalize_name(responder_name)
        
        # Buscar coincidencia exacta
        match = df[df['full_name_normalized'] == normalized_responder]
        
        if not match.empty:
            user = match.iloc[0]
            responders_found.append({
                'identificacion': user['Identificación'],
                'nombre': user['Nombre'],
                'apellido': user['Apellido'] if pd.notna(user['Apellido']) else '',
                'telefono': user['Teléfono'] if pd.notna(user['Teléfono']) else '',
                'area': user['Area'],
                'pais': user['País'],
                'fecha_retiro': user['Fecha de Retiro'],
                'full_name': f"{user['Nombre']} {user['Apellido'] if pd.notna(user['Apellido']) else ''}".strip()
            })
            print(f"✅ Encontrado: {responder_name} -> {user['Nombre']} {user['Apellido'] if pd.notna(user['Apellido']) else ''}")
        else:
            # Buscar coincidencias parciales
            partial_matches = df[df['full_name_normalized'].str.contains(normalized_responder.split()[0], case=False, na=False)]
            if not partial_matches.empty:
                print(f"🔍 Coincidencias parciales para '{responder_name}':")
                for _, match in partial_matches.head(3).iterrows():
                    print(f"   - {match['Nombre']} {match['Apellido'] if pd.notna(match['Apellido']) else ''} ({match['Area']})")
            else:
                print(f"❌ No encontrado: {responder_name}")
                not_found.append(responder_name)
    
    print(f"\n📊 RESUMEN:")
    print(f"✅ Encontrados: {len(responders_found)}")
    print(f"❌ No encontrados: {len(not_found)}")
    
    if not_found:
        print(f"\n🔍 No encontrados: {', '.join(not_found)}")
    
    # Guardar los usuarios encontrados en JSON para usar en el botón
    with open('/workspaces/siigo-retiros/responders_to_apologize.json', 'w', encoding='utf-8') as f:
        json.dump(responders_found, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Usuarios guardados en: responders_to_apologize.json")
    
    # Generar mensaje de prueba
    if responders_found:
        sample_user = responders_found[0]
        print(f"\n📱 MENSAJE DE PRUEBA:")
        print(f"Para: {sample_user['full_name']} ({sample_user['telefono']})")
        print(f"Mensaje: Hola {sample_user['nombre']}! Lamentamos informarte que por un error técnico...")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()