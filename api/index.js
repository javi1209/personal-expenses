let app, connectDatabase;
let initError = null;

try {
    const serverModule = require("../server/index.cjs");
    app = serverModule.app;
    connectDatabase = serverModule.connectDatabase;
} catch (error) {
    initError = error;
    console.error("Initialization error en Vercel:", error);
}

let isConnected = false;

module.exports = async (req, res) => {
    if (initError) {
        return res.status(500).json({
            message: "Error de inicialización en el servidor (Vercel)",
            errorDetalle: initError.message || initError.toString()
        });
    }

    if (!isConnected) {
        try {
            await connectDatabase();
            isConnected = true;
        } catch (error) {
            console.error("Error conectando a MongoDB en Vercel:", error);
            return res.status(500).json({
                message: "Fallo la conexión a la base de datos",
                errorDetalle: error.message || error.toString()
            });
        }
    }

    try {
        return app(req, res);
    } catch (err) {
        return res.status(500).json({
            message: "Error interno del servidor",
            errorDetalle: err.message || err.toString()
        });
    }
};
