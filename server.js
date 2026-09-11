const Stripe = require('stripe');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

app.use(cors());
app.use(express.json());

// ------------------ IA GROQ ------------------
const groq = new Groq({
    apiKey: process.env.GROQ_KEY
});

// ------------------ IA GENERAL ------------------
app.post("/api/ia", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres la IA oficial de Road To Prime. Explicas claro, directo, motivas al usuario y puedes crear resúmenes, esquemas, explicaciones, planificaciones de estudio y pasos detallados." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA" });
    }
});

// ------------------ IA POR MATERIAS ------------------

// MATEMÁTICAS PRIME
app.post("/api/ia/matematicas", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres un profesor experto en Matemáticas de Bachillerato. Haces resúmenes, esquemas, explicaciones paso a paso, ejercicios, correcciones y planificaciones de estudio. Siempre claro, directo y motivador." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA de matemáticas" });
    }
});

// HISTORIA PRIME
app.post("/api/ia/historia", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres un profesor experto en Historia. Haces resúmenes perfectos, esquemas, cronologías, causas y consecuencias, explicaciones tipo Selectividad y planificaciones de estudio." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA de historia" });
    }
});

// LENGUA PRIME
app.post("/api/ia/lengua", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres un profesor experto en Lengua y Literatura. Haces resúmenes, esquemas, análisis sintácticos, comentarios de texto, figuras literarias y planificaciones de estudio." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA de lengua" });
    }
});

// FÍSICA PRIME
app.post("/api/ia/fisica", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres un profesor experto en Física. Explicas fórmulas, problemas, conceptos, haces resúmenes, esquemas y planificaciones de estudio con pasos detallados." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA de física" });
    }
});

// QUÍMICA PRIME
app.post("/api/ia/quimica", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres un profesor experto en Química. Explicas formulación, reacciones, estequiometría, haces resúmenes, esquemas y planificaciones de estudio con ejemplos claros." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA de química" });
    }
});

// INGLÉS PRIME
app.post("/api/ia/ingles", async (req, res) => {
    try {
        const { mensaje } = req.body;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.1-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Eres un profesor experto en Inglés. Explicas gramática, vocabulario, writing, haces resúmenes, esquemas y planificaciones de estudio. Siempre corriges y das ejemplos." 
                },
                { role: "user", content: mensaje }
            ]
        });

        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en IA de inglés" });
    }
});

// ------------------ RUTA DE PAGO ------------------
app.post("/crear-pago", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: "price_1U90nFFHtQxvFihYsZf6ExoF",
                    quantity: 1
                }
            ],
            success_url: "https://TU-FRONTEND.vercel.app/success.html",
            cancel_url: "https://TU-FRONTEND.vercel.app/cancel.html"
        });

        res.json({ url: session.url });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error creando pago" });
    }
});

// ------------------ PUERTO PARA RAILWAY ------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Backend funcionando en el puerto " + PORT);
});
