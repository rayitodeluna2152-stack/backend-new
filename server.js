const Stripe = require('stripe');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOG GLOBAL
app.use((req, res, next) => {
    console.log("➡️ Nueva petición:", req.method, req.url);
    next();
});

// ------------------ LIMITE DE MENSAJES POR DÍA ------------------
const LIMITE_MENSAJES = 20;
const usoPorIP = new Map();

function puedeUsarIA(ip) {
    const hoy = new Date().toDateString();

    if (!usoPorIP.has(ip)) {
        usoPorIP.set(ip, { fecha: hoy, mensajes: 0 });
    }

    const datos = usoPorIP.get(ip);

    if (datos.fecha !== hoy) {
        datos.fecha = hoy;
        datos.mensajes = 0;
    }

    if (datos.mensajes >= LIMITE_MENSAJES) {
        return false;
    }

    datos.mensajes++;
    usoPorIP.set(ip, datos);
    return true;
}

// ------------------ IA OPENAI ------------------
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ------------------ FUNCIÓN PARA CREAR PROFESORES ------------------
async function generarRespuesta(systemPrompt, mensaje) {
    try {
        console.log("🧠 Mensaje enviado a OpenAI:", mensaje);

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: mensaje }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("❌ Error en OpenAI:", error);
        return "Lo siento, hubo un problema generando la respuesta.";
    }
}

// ------------------ IA GENERAL ------------------
app.post("/api/ia", async (req, res) => {
    console.log("📩 Body recibido en /api/ia:", req.body);

    const ip = req.ip;
    if (!puedeUsarIA(ip)) {
        return res.json({
            respuesta: "Has alcanzado el límite de mensajes diarios. Vuelve mañana."
        });
    }

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
        console.log(`📩 Body recibido en ${ruta}:`, req.body);

       const ip = req.headers["x-forwarded-for"] || req.ip || "0.0.0.0";
        if (!puedeUsarIA(ip)) {
            return res.json({
                respuesta: "Has alcanzado el límite de mensajes diarios. Vuelve mañana."
            });
        }

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

// ------------------ STRIPE CHECKOUT (USANDO success.html / cancel.html) ------------------
app.post("/api/checkout", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1
                }
            ],
            success_url: "https://roadtoprime.vercel.app/success.html",
            cancel_url: "https://roadtoprime.vercel.app/cancel.html"
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("❌ Error en Stripe:", error);
        res.status(500).json({ error: "Error creando sesión de pago" });
    }
});

// ------------------ PAGO PREMIUM (OFERTA 6,99€ / 9,99€) ------------------
app.post("/crear-pago", async (req, res) => {
    try {
        const precio = req.body.precio; // 6.99 o 9.99

        if (!precio) {
            return res.status(400).json({ error: "Precio no recibido" });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: "Road To Prime — Suscripción PREMIUM"
                        },
                        unit_amount: Math.round(precio * 100) // 6.99 → 699
                    },
                    quantity: 1
                }
            ],
            success_url: "https://roadtoprime.vercel.app/success.html",
            cancel_url: "https://roadtoprime.vercel.app/cancel.html"
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error("❌ Error en Stripe:", error);
        res.status(500).json({ error: "Error creando sesión de pago" });
    }
});

// ------------------ PUERTO PARA RAILWAY ------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Backend funcionando en el puerto " + PORT);
});
