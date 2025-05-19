// server.js
const express = require("express");
const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Servidor activo. image.js ya fue ejecutado (o está corriendo).");
});

// ⬇️ Escuchamos el puerto PRIMERO (clave para Render)
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);

  // ✅ Ejecutamos image.js después de que el servidor ya arrancó
  console.log("🔁 Ejecutando image.js automáticamente...");
  exec("node image.js", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error ejecutando image.js:", err.message);
      return;
    }
    console.log("✅ image.js ejecutado con éxito.");
    console.log(stdout);
  });
});
