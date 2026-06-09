# Chatbot AJUNJI para WhatsApp

Chatbot híbrido para WhatsApp que responde preguntas frecuentes sobre derechos laborales, trámites, beneficios y procesos de funcionarios JUNJI. Usa FAQ estático + Claude API.

## Arquitectura

```
Usuario WhatsApp → Twilio Messaging API → Backend Node.js/Express
                                                ↓
                                         Lógica Híbrida:
                                         1. Busca en FAQ (JSON)
                                         2. Si no encuentra → Claude API
                                                ↓
                                         Respuesta enviada a Twilio
```

## Temas Cubiertos

- ✅ Derechos laborales (horarios, feriados, descansos)
- ✅ Trámites JUNJI (cambios, certificados)
- ✅ Beneficios AJUNJI (afiliación, asesoría legal)
- ✅ Sumarios y procesos disciplinarios
- ✅ Licencias, permisos, post-natal
- ✅ Afiliación y participación sindical

## Setup Local

### Requisitos
- Node.js 16+
- npm o yarn
- Cuenta Twilio (gratuita)
- API Key Anthropic (Claude)

### Pasos

1. **Clonar repo**
   ```bash
   git clone https://github.com/tuusuario/ajunji-chatbot-whatsapp.git
   cd ajunji-chatbot-whatsapp
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copia `.env.example` a `.env`
   - Llena tus credenciales:
     ```
     TWILIO_ACCOUNT_SID=your_sid
     TWILIO_AUTH_TOKEN=your_token
     TWILIO_PHONE_NUMBER=whatsapp:+1234567890
     ANTHROPIC_API_KEY=sk-ant-...
     PORT=3000
     ```

4. **Ejecutar localmente**
   ```bash
   npm start
   ```

   Verás:
   ```
   🚀 Chatbot AJUNJI escuchando en puerto 3000
   📚 FAQ items cargados: 22
   ```

5. **Testear (sin Twilio)**
   - Abre `http://localhost:3000/health`
   - Deberías ver: `{"status":"ok","faqCount":22}`

---

## Deploy en Render (Gratis + bajo costo)

### Paso 1: Preparar repo

Tu repo debe tener:
- `package.json` ✓
- `server.js` ✓
- `faq.json` ✓
- `.env.example` ✓
- `.gitignore` con `.env`

Crea `.gitignore`:
```
node_modules/
.env
.DS_Store
```

### Paso 2: Deploy en Render

1. Ve a https://render.com
2. Crea cuenta (con GitHub)
3. Haz clic en `New` → `Web Service`
4. Conecta tu repo GitHub
5. Llena:
   - **Name**: `ajunji-chatbot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (luego upgrade si es necesario)

6. Antes de desplegar, agrega variables de entorno:
   - Click en `Environment`
   - Agrega:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_PHONE_NUMBER`
     - `ANTHROPIC_API_KEY`
     - `NODE_ENV=production`

7. Click `Create Web Service`

Render te dará una URL como: `https://ajunji-chatbot.onrender.com`

**Nota**: El tier free puede dormir después de 15 min sin tráfico. Upgrade a "Starter" ($7/mes) para producción.

---

## Integración con Twilio

### Obtener credenciales Twilio

1. Ve a https://www.twilio.com/console
2. Copia `Account SID` y `Auth Token` → `.env`
3. En `Phone Numbers` → crea/verifica número WhatsApp sandbox

### Configurar webhook en Twilio

1. Ve a https://console.twilio.com/us/develop/sms/try-it-out/whatsapp?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Fsandbox
2. Bajo "When a message comes in":
   - Method: `HTTP POST`
   - URL: `https://ajunji-chatbot.onrender.com/webhook/messages`
3. Guardar

### Testear con WhatsApp

1. Envía un mensaje de WhatsApp al número sandbox de Twilio
2. El chatbot responde automáticamente

---

## Costos Estimados

| Servicio | Costo | Notas |
|----------|-------|-------|
| **Render** | $0 (Free) → $7/mes (Starter) | Free duerme; Starter siempre activo |
| **Twilio** | $0-$0.0075/SMS | 100 SMS/mes gratis; luego ~$0.75 por 100 mensajes |
| **Claude API** | ~$0.003/pregunta | Varía según modelo; estimar $10-30/mes |
| **Total** | ~$17-40/mes | Con Starter en Render |

---

## FAQ Personalizada

Edita `faq.json` para agregar más preguntas:

```json
{
  "tu_categoria": [
    {
      "id": "tu_id",
      "pregunta": "¿Tu pregunta?",
      "palabras_clave": ["palabra1", "palabra2", "palabra3"],
      "respuesta": "Tu respuesta aquí"
    }
  ]
}
```

- **palabras_clave**: Se buscan en el mensaje del usuario (case-insensitive)
- Si al menos una coincide → se usa esa respuesta
- Si ninguna coincide → se llama a Claude

---

## Mejoras Futuras

- [ ] Fuzzy matching (búsqueda más inteligente)
- [ ] Almacenar historial de conversaciones
- [ ] Dashboard web para ver estadísticas
- [ ] Integración con Airtable para actualizar FAQ sin redeploy
- [ ] Multi-idioma (mapudungun, quechua)
- [ ] Escalada a humano si es necesario

---

## Troubleshooting

### "Error: Claude API returns 401"
- Verifica que `ANTHROPIC_API_KEY` es correcto
- No puede estar vacío o expirado

### "Error: Twilio returns 401"
- Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
- El número de teléfono debe incluir `whatsapp:+` al inicio

### "FAQ no se carga"
- Verifica que `faq.json` existe en raíz del repo
- Valida JSON: usa https://jsonlint.com/

### "Webhook no recibe mensajes"
- En Twilio, verifica que el webhook URL sea exacto
- En Render, verifica logs: `Logs` → busca errores HTTP

---

## Licencia

MIT

## Autor

Camilo — AJUNJI Nacional / CUT Provincial Elquí
