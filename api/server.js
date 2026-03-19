import serverModule from "../server/index.cjs";

const { app, connectDatabase } = serverModule;
let isConnected = false;

export default async (req, res) => {
    const startTime = Date.now();
    console.log(`[Vercel Server] -> Request: ${req.method} ${req.url}`);
    
    if (!isConnected) {
        console.log("[Vercel Server] -> Intentando conectar a la base de datos...");
        try {
            await connectDatabase();
            isConnected = true;
            console.log("[Vercel Server] -> Base de datos conectada con éxito");
        } catch (error) {
            console.error("[Vercel Server] !! Error conectando a MongoDB:", error);
            return res.status(500).json({
                message: "Falla la conexión a la base de datos en Vercel",
                errorDetalle: error.message || error.toString()
            });
        }
    }

    try {
        console.log(`[Vercel Server] -> Delegando a Express: ${req.url}`);
        return app(req, res);
    } catch (err) {
        const duration = Date.now() - startTime;
        console.error(`[Vercel Server] !! Error fatal tras ${duration}ms:`, err);
        return res.status(500).json({
            message: "Error crítico en el entry point de Vercel",
            errorDetalle: err.message || err.toString()
        });
    }
};
