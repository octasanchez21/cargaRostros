// server.js
const express = require("express");
const { execSync } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

// Ejecutar automáticamente image.js al iniciar el servidor
try {
  console.log("🔁 Ejecutando image.js automáticamente...");
  execSync("node image.js", { stdio: "inherit" });
  console.log("✅ image.js ejecutado con éxito.");
} catch (err) {
  console.error("❌ Error al ejecutar image.js:", err.message);
}

app.get("/", (req, res) => {
  res.send("Servidor activo. image.js ya fue ejecutado.");
});

app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});
