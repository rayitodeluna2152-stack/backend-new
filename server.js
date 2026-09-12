const Stripe = require('stripe');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ LOG GLOBAL PARA VER TODAS LAS PETICIONES
app.use((req, res, next) => {
    console.log("➡️ Nueva petición:", req.method, req.url);
    next();
});

// ------------------ IA GROQ ------------------
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// ------------------ FUNCIÓN PARA CREAR PROFESORES ------------------
async function generarRespuesta(systemPrompt, mensaje) {
    try {
        console.log("🧠 Mensaje enviado a Groq:", mensaje); // ⭐ LOG
        const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: mensaje }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("❌ Error en Groq:", error);
        return "Lo siento, hubo un problema generando la respuesta.";
    }
}

// ------------------ IA GENERAL ------------------
app.post("/api/ia", async (req, res) => {
    console.log("📩 Body recibido en /api/ia:", req.body); // ⭐ LOG

    try {
        const { mensaje } = req.body;

        const texto = await generarRespuesta(
            "Eres la IA oficial de Road To Prime. Explicas claro, directo, motivas al usuario y puedes crear resúmenes, esquemas, explicaciones, planificaciones de estudio y pasos detallados.",
            mensaje
        );

        res.json({ respuesta: texto });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA" });
    }
});

// ------------------ IA POR MATERIAS ------------------

function crearRutaIA(ruta, prompt) {
    app.post(ruta, async (req, res) => {
        console.log(`📩 Body recibido en ${ruta}:`, req.body); // ⭐ LOG

        try {
            const texto = await generarRespuesta(prompt, req.body.mensaje);
            res.json({ respuesta: texto });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: `Error en ${ruta}` });
        }
    });
}

crearRutaIA("/api/ia/matematicas", "Eres un profesor experto en Matemáticas de Bachillerato. Explicas paso a paso, haces ejercicios, resúmenes y esquemas.");
crearRutaIA("/api/ia/lengua", "Eres un profesor experto en Lengua y Literatura. Explicas sintaxis, comentarios de texto, figuras literarias y resúmenes.");
crearRutaIA("/api/ia/geografia", "Eres un profesor experto en Geografía. Explicas mapas, clima, relieve, población, economía y haces resúmenes perfectos.");
crearRutaIA("/api/ia/historia", "Eres un profesor experto en Historia. Haces cronologías, causas y consecuencias, resúmenes y explicaciones tipo Selectividad.");
crearRutaIA("/api/ia/productividad", "Eres un coach experto en productividad. Enseñas técnicas de estudio, organización, hábitos, rutinas y motivación.");
crearRutaIA("/api/ia/economia", "Eres un profesor experto en Economía. Explicas macroeconomía, microeconomía, mercados, empresas, finanzas y resúmenes.");
crearRutaIA("/api/ia/ingles", "Eres un profesor experto en Inglés. Explicas gramática, vocabulario, writing y corriges errores.");
crearRutaIA("/api/ia/tecnologia", "Eres un profesor experto en Tecnología. Explicas informática, programación, redes, hardware y conceptos técnicos.");
crearRutaIA("/api/ia/filosofia", "Eres un profesor experto en Filosofía. Explicas autores, teorías, corrientes, resúmenes y comparaciones.");
crearRutaIA("/api/ia/quimica", "Eres un profesor experto en Química. Explicas formulación, reacciones, estequiometría y resúmenes claros.");
crearRutaIA("/api/ia/fisica", "Eres un profesor experto en Física. Explicas problemas, fórmulas, conceptos y haces esquemas.");
crearRutaIA("/api/ia/biologia", "Eres un profesor experto en Biología. Explicas genética, células, anatomía, evolución y haces resúmenes.");

// ------------------ PUERTO PARA RAILWAY ------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Backend funcionando en el puerto " + PORT);
});
