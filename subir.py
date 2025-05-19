#!/usr/bin/env python3
import json
import requests
import mimetypes
from requests.auth import HTTPDigestAuth
import sys
import subprocess

# === Configuración de acceso a Hikvision ===
HOST       = "34.221.158.219"
USERNAME   = "admin"
PASSWORD   = "Inteliksa6969"
DEV_INDEX  = "F5487AA0-2485-4CFB-9304-835DCF118B43"

# === Archivos ===
STATUS_FILE    = "status.txt"
TAGO_SCRIPT    = "sendTago.js"

# === Leer datos desde usuarios.json ===
with open("data/usuarios.json", "r", encoding="utf-8") as f:
    user_data = json.load(f)

employee_no = user_data["employeeNo"]
image_url   = user_data["faceURL"]

# === Descargar imagen ===
try:
    print(f"📥 Descargando imagen desde: {image_url}")
    resp = requests.get(image_url, timeout=10)
    resp.raise_for_status()
    image_content = resp.content
except Exception as e:
    estado = "ERROR DE IMAGEN"
    print(f"❌ {estado}: {e}")
    with open(STATUS_FILE, "w", encoding="utf-8") as sf:
        sf.write(estado)
    sys.exit(1)

# === Preparar payload de subida ===
file_type   = mimetypes.guess_type(image_url)[0] or "image/jpeg"
info        = {"FaceInfo": {"employeeNo": employee_no, "faceLibType": "blackFD"}}
files       = {"FaceDataRecord": ("rostro.jpg", image_content, file_type)}
data_up     = {"data": json.dumps(info)}

endpoint_up = (
    f"http://{HOST}/ISAPI/Intelligent/FDLib/FaceDataRecord"
    f"?format=json&devIndex={DEV_INDEX}"
)

# === Envío a Hikvision ===
try:
    print(f"🚀 Enviando rostro a Hikvision para empleado {employee_no}…")
    res = requests.post(
        endpoint_up,
        data=data_up,
        files=files,
        auth=HTTPDigestAuth(USERNAME, PASSWORD),
        timeout=10
    )
    if res.status_code == 200:
        estado = "IMAGEN ACEPTADA"
        print("✅ Imagen subida correctamente a Hikvision.")
    else:
        estado = "IMAGEN RECHAZADA"
        print(f"❌ {estado} ({res.status_code}): {res.text}")
except Exception as e:
    estado = "IMAGEN RECHAZADA"
    print(f"❌ Excepción al subir a Hikvision: {e}")

# === Eliminación inmediata tras éxito ===
if estado == "IMAGEN ACEPTADA":
    delete_payload = {
        "FaceInfoDelCond": {
            "faceLibType": "blackFD",
            "EmployeeNoList": [{"employeeNo": employee_no}]
        }
    }
    endpoint_del = (
        f"http://{HOST}/ISAPI/Intelligent/FDLib/FDSearch/Delete"
        f"?format=json&devIndex={DEV_INDEX}"
    )
    try:
        print(f"🗑️ Eliminando rostro {employee_no} tras validación…")
        res2 = requests.put(
            endpoint_del,
            json=delete_payload,
            auth=HTTPDigestAuth(USERNAME, PASSWORD),
            timeout=10
        )
        if res2.status_code == 200:
            print("✅ Registro eliminado con éxito.")
        else:
            print(f"⚠️ Falló eliminación ({res2.status_code}): {res2.text}")
    except Exception as e:
        print(f"⚠️ Excepción al eliminar: {e}")

# === Volcar estado al archivo ===
with open(STATUS_FILE, "w", encoding="utf-8") as sf:
    sf.write(estado)

# === Invocar el script JavaScript de TagoIO ===
try:
    print(f"▶️ Ejecutando {TAGO_SCRIPT} para enviar estado a TagoIO…")
    subprocess.run(["node", TAGO_SCRIPT], check=True)
    print("✅ sendTago.js ejecutado con éxito.")
except Exception as e:
    print(f"⚠️ No se pudo ejecutar {TAGO_SCRIPT}: {e}")
