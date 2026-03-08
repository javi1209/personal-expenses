import serverModule from "../server/index.cjs";

const { app, connectDatabase } = serverModule;
let isConnected = false;

export default async (req, res) => {
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
