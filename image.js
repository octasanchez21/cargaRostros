// image.js
import express       from "express";
import sdk           from "@tago-io/sdk";
import axios         from "axios";
import DigestFetch   from "digest-fetch";

const { Analysis, Device } = sdk;

// ——— Configuración Hikvision ——————————————————
const HIK_HOST    = "34.221.158.219";
const HIK_USER    = "admin";
const HIK_PASS    = "Inteliksa6969";
const HIK_DEVIDX  = "F5487AA0-2485-4CFB-9304-835DCF118B43";
const TIMEOUT_MS  = 10_000;
const BOUNDARY    = "------------------------" + Date.now().toString(16);
const CRLF        = "\r\n";

// ——— Configuración TagoIO —————————————————————
const ANALYSIS_TOKEN = "a-ded6e513-35c1-444a-aea6-4d918bbe4dd4";
const DEVICE_TOKEN   = "a3a6bf36-3062-47e9-936e-e751c88623c5";
const EMPLOYEE_NO    = "S99996";

// ——— Express para mantener vivo en Render ——————
const app  = express();
const port = process.env.PORT || 3000;
app.get("/", (_req, res) => res.send("🚀 Servidor activo y conectado a TagoIO."));
app.listen(port, () => {
  console.log(`💡 Puerto ${port} activo. Iniciando Analysis…`);
  startTagoAnalysis();
});

// ——— Función principal: dispara el Analysis ————
function startTagoAnalysis() {
  new Analysis(async (context, scope) => {
    try {
      const imageUrl = scope[0]?.metadata?.file?.url;
      if (!imageUrl) {
        context.log("❌ No hay URL de imagen en el scope.");
        return;
      }
      context.log(`📥 Imagen detectada: ${imageUrl}`);

      // 1) Eliminar rostro previo
      const del = await deleteFace(EMPLOYEE_NO);
      context.log(`🗑️ Borrado previo: ${del.success ? "OK" : "FALLÓ"} (subStatus=${del.subStatus})`);

      // 2) Subir nuevo rostro
      const add = await addFace(EMPLOYEE_NO, imageUrl);
      context.log(`🚀 Subida de rostro: ${add.success ? "ACEPTADA" : "RECHAZADA"} (subStatus=${add.subStatus})`);

      // 3) Enviar estado a TagoIO
      const finalStatus = add.success ? "IMAGEN ACEPTADA" : "IMAGEN RECHAZADA";
      await sendStatus(finalStatus);
      context.log(`✅ Estado enviado: ${finalStatus}`);

    } catch (err) {
      context.log(`❌ Error crítico: ${err.message}`);
      await sendStatus("ERROR INTERNO");
    }
  }, { token: ANALYSIS_TOKEN });
}

// ——— Elimina un rostro en Hikvision —————————
async function deleteFace(employeeNo) {
  const url = `http://${HIK_HOST}/ISAPI/Intelligent/FDLib/FDSearch/Delete?format=json&devIndex=${HIK_DEVIDX}`;
  const payload = {
    FaceInfoDelCond: {
      faceLibType: "blackFD",
      EmployeeNoList: [{ employeeNo }],
    },
  };
  const client = new DigestFetch(HIK_USER, HIK_PASS, { algorithm: "MD5" });

  try {
    const res = await client.fetch(url, {
      method: "PUT",
      timeout: TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    const sub = json.subStatusCode || "";
    return { success: res.ok && sub !== "internalError", subStatus: sub };
  } catch {
    return { success: false, subStatus: "error" };
  }
}

// ——— Sube un nuevo rostro a Hikvision ————————
async function addFace(employeeNo, imageUrl) {
  try {
    const resp = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: TIMEOUT_MS,
    });
    const imgBuf = Buffer.from(resp.data);

    const header =
      `--${BOUNDARY}${CRLF}` +
      `Content-Disposition: form-data; name="data"${CRLF}${CRLF}` +
      `{"FaceInfo":{"employeeNo":"${employeeNo}","faceLibType":"blackFD"}}${CRLF}` +
      `--${BOUNDARY}${CRLF}` +
      `Content-Disposition: form-data; name="FaceDataRecord"; filename="face.jpg"${CRLF}` +
      `Content-Type: image/jpeg${CRLF}${CRLF}`;
    const footer = `${CRLF}--${BOUNDARY}--${CRLF}`;
    const body = Buffer.concat([Buffer.from(header), imgBuf, Buffer.from(footer)]);

    const client = new DigestFetch(HIK_USER, HIK_PASS, { algorithm: "MD5" });
    const hikRes = await client.fetch(
      `http://${HIK_HOST}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json&devIndex=${HIK_DEVIDX}`,
      {
        method: "POST",
        timeout: TIMEOUT_MS,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${BOUNDARY}`,
          "Content-Length": body.length,
        },
        body,
      }
    );
    const j = await hikRes.json().catch(() => ({}));
    const sub = j.subStatusCode || "";
    return { success: hikRes.ok && sub !== "internalError", subStatus: sub };

  } catch {
    return { success: false, subStatus: "error" };
  }
}

// ——— Envía el estado final a tu dispositivo TagoIO ——
async function sendStatus(status) {
  const device = new Device({ token: DEVICE_TOKEN });
  await device.sendData({ variable: "estado_imagen", value: status });
}
