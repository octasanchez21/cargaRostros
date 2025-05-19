const express = require("express");
const { Analysis } = require("@tago-io/sdk");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

// RUTA OPCIONAL PARA TESTEAR SI ESTÁ VIVO
app.get("/", (req, res) => {
  res.send("Servidor activo. Análisis conectado a TagoIO.");
});

// Levantar servidor para que Render detecte el puerto
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);

  // 🔁 Iniciar el análisis una vez que el puerto esté levantado
  startTagoAnalysis();
});

// 🌐 Función para iniciar el análisis TagoIO
function startTagoAnalysis() {
  const employeeNo = "S99996";
  const outputFile = path.join("data", "usuarios.json");

  async function syncUsers(context, scope) {
    const fileURL = scope[0].metadata.file.url;
    if (!fileURL) {
      context.log("❌ No se encontró una URL válida en metadata.");
      return;
    }

    try {
      fs.mkdirSync("data", { recursive: true });
      const jsonData = { employeeNo, faceURL: fileURL };
      fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
      context.log(`✅ URL guardada en ${outputFile}`);

      context.log("▶️ Ejecutando 'python3 subir.py'…");
      execSync("python3 subir.py", { stdio: "inherit" });
      context.log("✅ subir.py completado con éxito.");
    } catch (err) {
      context.log(`❌ Error en syncUsers: ${err.message}`);
    }
  }

  new Analysis(syncUsers, {
    token: "a-ded6e513-35c1-444a-aea6-4d918bbe4dd4", // Tu token real
  });

  console.log("✅ Analysis conectado a TagoIO. Esperando triggers...");
}
