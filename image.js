const { Analysis } = require("@tago-io/sdk");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Constante fija (puede venir de env si querés hacerlo dinámico)
const employeeNo = "S99996";
const outputFile = path.join("data", "usuarios.json");

// Función principal del análisis
async function syncUsers(context, scope) {
  const fileURL = scope[0].metadata.file.url;
  if (!fileURL) {
    context.log("❌ No se encontró una URL válida en metadata.");
    return;
  }

  try {
    // 1) Asegurar carpeta
    fs.mkdirSync("data", { recursive: true });

    // 2) Crear objeto con datos y guardarlo
    const jsonData = { employeeNo, faceURL: fileURL };
    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
    context.log(`✅ URL guardada en ${outputFile}`);

    // 3) Ejecutar el script Python subir.py
    //    – Usa python3 o python según tu entorno
    context.log("▶️ Ejecutando 'python3 subir.py'…");
    execSync("python3 subir.py", { stdio: "inherit" });
    context.log("✅ subir.py completado con éxito.");

  } catch (err) {
    context.log(`❌ Error en syncUsers: ${err.message}`);
  }
}

// Exportación para análisis externo
module.exports = new Analysis(syncUsers, {
  token: "a-ded6e513-35c1-444a-aea6-4d918bbe4dd4",
});
