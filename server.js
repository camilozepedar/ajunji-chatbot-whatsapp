require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
 
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
// Cargar FAQ en memoria
const faqPath = path.join(__dirname, 'faq.json');
let faqData = {};
try {
  const faqContent = fs.readFileSync(faqPath, 'utf-8');
  faqData = JSON.parse(faqContent);
  console.log('✓ FAQ cargada en memoria');
} catch (err) {
  console.error('Error al cargar FAQ:', err);
}
 
// ============================================================================
// FUNCIÓN: Buscar respuesta en FAQ
// ============================================================================
function searchFAQ(userMessage) {
  const messageLower = userMessage.toLowerCase();
  const allFAQs = Object.values(faqData).flat();
 
  // Buscar match por palabras clave (simple pero efectivo)
  for (const faq of allFAQs) {
    const keywordsMatch = faq.palabras_clave.some(keyword =>
      messageLower.includes(keyword.toLowerCase())
    );
 
    if (keywordsMatch) {
      return {
        found: true,
        respuesta: faq.respuesta,
        id: faq.id,
        categoria: faq.pregunta
      };
    }
  }
 
  return { found: false };
}
 
// ============================================================================
// FUNCIÓN: Llamar a Claude API
// ============================================================================
async function callClaudeAPI(userMessage) {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `Eres un asistente especializado en derechos laborales, trámites y beneficios de funcionarios JUNJI (Junta Nacional de Jardines Infantiles) en Chile. 
 
Responde únicamente sobre:
- Derechos laborales (horarios, feriados, descansos)
- Trámites JUNJI (cambios de jardín, certificados)
- Beneficios de afiliación a AJUNJI
- Procesos disciplinarios y sumarios administrativos
- Licencias, permisos y post-natal
- Afiliación y participación en el sindicato
 
Si la pregunta está fuera de tu ámbito, responde: "Esta pregunta está fuera de mi área de especialidad. Contacta a tu dirección regional para asesoría específica."
 
Responde en español, con tono profesional pero cercano. Sé conciso (máximo 3 párrafos).`,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 10000
      }
    );
 
    if (response.data.content && response.data.content[0]) {
      return {
        success: true,
        respuesta: response.data.content[0].text
      };
    }
 
    return {
      success: false,
      error: 'Sin contenido en respuesta'
    };
  } catch (err) {
    console.error('Error al llamar Claude API:', err.message);
    return {
      success: false,
      error: 'Error de IA: ' + err.message
    };
  }
}
 
// ============================================================================
// FUNCIÓN: Enviar respuesta a Twilio
// ============================================================================
async function sendWhatsAppMessage(phoneNumber, messageBody) {
  try {
    const params = new URLSearchParams();
    params.append('From', `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`);
    params.append('To', phoneNumber);
    params.append('Body', messageBody);
 
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages`,
      params,
      {
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      }
    );
 
    console.log(`✓ Mensaje enviado a ${phoneNumber}`);
    return true;
  } catch (err) {
    console.error('Error al enviar mensaje:', err.message);
    return false;
  }
}
 
// ============================================================================
// WEBHOOK: Recibir mensajes de Twilio
// ============================================================================
app.post('/webhook/messages', async (req, res) => {
  const phoneNumber = req.body.From;
  const userMessage = req.body.Body;
 
  console.log(`\n📩 Mensaje de ${phoneNumber}: "${userMessage}"`);
 
  // Buscar en FAQ primero
  const faqResult = searchFAQ(userMessage);
 
  let responseBody;
  if (faqResult.found) {
    responseBody = `✓ *Respuesta desde FAQ:*\n\n${faqResult.respuesta}`;
    console.log(`📚 Match encontrado en FAQ (${faqResult.id})`);
  } else {
    // Si no encuentra en FAQ, llamar a Claude
    console.log('🤖 No hay match en FAQ, llamando Claude API...');
    const claudeResult = await callClaudeAPI(userMessage);
 
    if (claudeResult.success) {
      responseBody = `🤖 *Respuesta generada por IA:*\n\n${claudeResult.respuesta}`;
      console.log('✓ Respuesta de Claude obtenida');
    } else {
      responseBody = `Lo siento, no pude procesar tu pregunta. Error: ${claudeResult.error}. Por favor contacta a tu dirección regional.`;
      console.log('✗ Error de Claude');
    }
  }
 
  // Enviar respuesta
  await sendWhatsAppMessage(phoneNumber, responseBody);
 
  // Responder a Twilio con 200 OK
  res.status(200).send('OK');
});
 
// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', faqCount: Object.values(faqData).flat().length });
});
 
// ============================================================================
// INICIAR SERVIDOR
// ============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Chatbot AJUNJI escuchando en puerto ${PORT}`);
  console.log(`📚 FAQ items cargados: ${Object.values(faqData).flat().length}`);
  console.log(`\nWebhook de Twilio: POST /webhook/messages`);
  console.log(`Health check: GET /health\n`);
});
