const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Define o título da janela do terminal
process.stdout.write('\x1b]0;Streamer\x07');

const PORT = 5050;

// Buffer para a imagem da tela atual
let currentFrame = null;
const viewers = new Set();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

console.log("\n--- STREAMER MULTIFUNCIONAL ---");
console.log("1. Transmitir Arquivo de Vídeo (MP4, MKV, etc)");
console.log("2. Transmitir Minha Tela (Método Universal)");

rl.question('\nEscolha uma opção (1 ou 2): ', (choice) => {
    if (choice === '1') {
        startFileStream();
    } else if (choice === '2') {
        startScreenStream();
    } else {
        console.log("Opção inválida.");
        process.exit();
    }
});

function startFileStream() {
    rl.question('\n👉 Arraste o arquivo de vídeo aqui e aperte ENTER: ', (answer) => {
        const videoPath = answer.trim().replace(/^"|"$/g, '');
        if (!videoPath || !fs.existsSync(videoPath)) {
            console.error("\n❌ Arquivo não encontrado!");
            process.exit(1);
        }
        createFileServer(videoPath);
    });
}

function startScreenStream() {
    const ip = getLocalIp();
    const server = http.createServer((req, res) => {
        // Recebe frames da fonte (POST)
        if (req.url === '/push' && req.method === 'POST') {
            let body = [];
            req.on('data', chunk => body.push(chunk));
            req.on('end', () => {
                currentFrame = Buffer.concat(body);
                // Notifica todos os espectadores que há um novo frame
                for (const viewer of viewers) {
                    viewer(currentFrame);
                }
                res.writeHead(200);
                res.end();
            });
            return;
        }

        // Envia frames para o espectador (Stream MJPEG)
        if (req.url === '/stream') {
            res.writeHead(200, {
                'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
                'Cache-Control': 'no-cache',
                'Connection': 'close',
                'Pragma': 'no-cache'
            });

            const sendFrame = (frame) => {
                res.write(`--frame\r\n`);
                res.write(`Content-Type: image/jpeg\r\n`);
                res.write(`Content-Length: ${frame.length}\r\n\r\n`);
                res.write(frame);
                res.write(`\r\n`);
            };

            // Se já tiver um frame, manda logo
            if (currentFrame) sendFrame(currentFrame);

            // Adiciona aos ouvintes
            viewers.add(sendFrame);

            req.on('close', () => {
                viewers.delete(sendFrame);
            });
            return;
        }

        // Página de Origem (Fonte)
        if (req.url === '/source') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getSourceHTML());
            return;
        }

        // Página do Espectador (Viewer)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ver Tela - Stream</title>
                <style>
                    body { background: #000; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
                    img { width: 100%; height: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                <img src="/stream" id="stream">
            </body>
            </html>
        `);
    });

    server.listen(PORT, () => {
        console.log(`\n================================================`);
        console.log(`🖥️  MODO UNIVERSAL ATIVADO!`);
        console.log(`\n1. NO SEU PC: Abra este link e clique em começar:`);
        console.log(`👉 http://localhost:${PORT}/source`);
        console.log(`\n2. NO OUTRO APARELHO: Abra este link:`);
        console.log(`👉 http://${ip}:${PORT}`);
        console.log(`================================================\n`);
    });
}

function createFileServer(videoPath) {
    const ip = getLocalIp();
    const server = http.createServer((req, res) => {
        if (req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Streaming: ${path.basename(videoPath)}</title>
                    <style>
                        body { background: #0a0a0a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: 'Segoe UI', sans-serif; }
                        video { width: 90%; max-height: 80vh; outline: none; border-radius: 8px; }
                        h2 { color: #fff; margin-bottom: 20px; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
                    </style>
                </head>
                <body>
                    <h2>🎥 Transmitindo: ${path.basename(videoPath)}</h2>
                    <video controls autoplay name="media">
                        <source src="/video" type="video/mp4">
                    </video>
                </body>
                </html>
            `);
            return;
        }
        if (req.url === '/video') {
            const stat = fs.statSync(videoPath);
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
                res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': (end-start)+1, 'Content-Type': 'video/mp4' });
                fs.createReadStream(videoPath, { start, end }).pipe(res);
            } else {
                res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' });
                fs.createReadStream(videoPath).pipe(res);
            }
        }
    });
    server.listen(PORT, () => {
        console.log(`\n🚀 TRANSMISSÃO DE ARQUIVO: http://${ip}:${PORT}`);
    });
}

function getSourceHTML() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fonte - Compartilhar</title>
        <style>
            body { background: #0a0a0a; color: white; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 50px; margin: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            h1 { color: #00d4ff; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff; margin-bottom: 40px; }
            button { 
                padding: 20px 40px; font-size: 1.2rem; cursor: pointer; 
                background: transparent; color: #00d4ff; 
                border: 2px solid #00d4ff; border-radius: 50px;
                text-transform: uppercase; font-weight: bold; letter-spacing: 2px;
                transition: 0.3s;
                box-shadow: 0 0 15px rgba(0, 212, 255, 0.4), inset 0 0 15px rgba(0, 212, 255, 0.4);
            }
            button:hover {
                background: #00d4ff;
                color: #000;
                box-shadow: 0 0 30px #00d4ff;
            }
            #status { margin-top: 30px; font-size: 1.1rem; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
        </style>
    </head>
    <body>
        <h1>Transmitir Tela</h1>
        <button id="btn">Iniciar Transmissão</button>
        <p id="status">Aguardando comando...</p>
        <canvas id="c" style="display:none"></canvas>

        <script>
            const btn = document.getElementById('btn');
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');

            btn.onclick = async () => {
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 } });
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();

                    document.getElementById('status').innerText = "TRANSMITINDO...";
                    btn.style.display = 'none';

                    setInterval(() => {
                        canvas.width = video.videoWidth / 1.5; // Reduz um pouco para performance
                        canvas.height = video.videoHeight / 1.5;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Converte para JPG e envia para o servidor
                        canvas.toBlob(blob => {
                            fetch('/push', { method: 'POST', body: blob });
                        }, 'image/jpeg', 0.6); // Qualidade 60% para ser rápido
                    }, 100); // 10 frames por segundo

                } catch (e) { alert(e); }
            };
        </script>
    </body>
    </html>`;
}
