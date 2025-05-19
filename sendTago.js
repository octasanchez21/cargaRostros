const fs = require("fs");
const { Device } = require("@tago-io/sdk");

// ————— Configura tu token de dispositivo TagoIO —————
const DEVICE_TOKEN = "a3a6bf36-3062-47e9-936e-e751c88623c5";

// ————— Ruta al archivo de estado —————
const STATUS_FILE = "status.txt";

async function main() {
  let estado;
  // 1) Leer el archivo
  try {
    estado = fs.readFileSync(STATUS_FILE, "utf-8").trim();
    console.log(`📖 Estado leído: "${estado}"`);
  } catch (err) {
    console.error("❌ No se pudo leer status.txt:", err);
    process.exit(1);
  }

  // 2) Conectar con el dispositivo TagoIO
  const device = new Device({ token: DEVICE_TOKEN });

  // 3) Preparar y enviar dato
  const payload = {
    variable: "estado_imagen",
    value: estado,
  };

  try {
    const result = await device.sendData(payload);
    console.log(`✅ Enviado a TagoIO: ${JSON.stringify(payload)} | Resultado: ${result}`);
  } catch (err) {
    console.error("❌ Error al enviar a TagoIO:", err);
    process.exit(1);
  }
}

main();
