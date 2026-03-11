const serverModule = require("../server/index.cjs");

const { app, connectDatabase } = serverModule;
let isConnected = false;

module.exports = async (req, res) => {
    const startTime = Date.now();
    console.log(`[Vercel API] -> Request: ${req.method} ${req.url}`);
    
    if (!isConnected) {
        console.log("[Vercel API] -> Intentando conectar a la base de datos...");
        try {
            await connectDatabase();
            isConnected = true;
            console.log("[Vercel API] -> Base de datos conectada con éxito");
        } catch (error) {
            console.error("[Vercel API] !! Error conectando a MongoDB:", error);
            return res.status(500).json({
                message: "Falla la conexión a la base de datos en Vercel",
                errorDetalle: error.message || error.toString()
            });
        }
    }

    try {
        // Pasar la solicitud al servidor Express
        return app(req, res);
    } catch (err) {
        const duration = Date.now() - startTime;
        console.error(`[Vercel API] !! Error fatal tras ${duration}ms:`, err);
        return res.status(500).json({
            message: "Error crítico en el entry point de Vercel",
            errorDetalle: err.message || err.toString()
        });
    }
};
