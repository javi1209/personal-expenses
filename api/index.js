const { app, connectDatabase } = require("../server/index.cjs");

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        try {
            await connectDatabase();
            isConnected = true;
        } catch (error) {
            console.error("Error conectando a MongoDB en Vercel:", error);
            // No lanzamos error aquí para permitir que Express maneje la respuesta si ya hay una conexión parcial
            // o para que el usuario vea un error más descriptivo si la app intenta usar la DB.
        }
    }
    return app(req, res);
};
