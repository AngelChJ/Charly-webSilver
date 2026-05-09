import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8080;

// Servir archivos estáticos PRIMERO
app.use(express.static(join(__dirname, 'dist')));

// Luego la ruta SPA (solo para rutas que no sean archivos)
app.get('*', (req, res) => {
    // Solo enviar index.html si no es un archivo estático
    if (!req.path.includes('.')) {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});