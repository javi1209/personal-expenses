const serverModule = require("../server/index.cjs");

const { app, connectDatabase } = serverModule;
let isConnected = false;

module.exports = async (req, res) => {
    const startTime = Date.now();
    console.log(`[Vercel API Logs] -> Request: ${req.method} ${req.url}`);
    console.log(`[Vercel API Logs] -> Headers:`, JSON.stringify(req.headers));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[Vercel API Logs] -> Body keys:`, Object.keys(req.body));
    }
    
    if (!isConnected) {
        console.log("[Vercel API Logs] -> Intentando conectar a la base de datos...");
        try {
            await connectDatabase();
            isConnected = true;
            console.log("[Vercel API Logs] -> Base de datos conectada con éxito");
        } catch (error) {
            console.error("[Vercel API Logs] !! Error conectando a MongoDB:", error);
            return res.status(500).json({
                message: "Falla la conexión a la base de datos en Vercel",
                errorDetalle: error.message || error.toString()
            });
        }
    }

    try {
        console.log(`[Vercel API Logs] -> Delegando a Express: ${req.url}`);
        return app(req, res);
    } catch (err) {
        const duration = Date.now() - startTime;
        console.error(`[Vercel API Logs] !! Error fatal tras ${duration}ms:`, err);
        return res.status(500).json({
            message: "Error crítico en el entry point de Vercel",
            errorDetalle: err.message || err.toString()
        });
    }
};
