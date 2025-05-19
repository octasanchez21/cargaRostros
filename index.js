// start.js
const { execSync } = require("child_process");

try {
  console.log("▶️ Ejecutando análisis principal...");
  execSync("node image.js", { stdio: "inherit" }); // o el script que quieras como entrada
} catch (error) {
  console.error("❌ Error al ejecutar:", error.message);
}
