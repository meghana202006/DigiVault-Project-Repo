const WebSocket = require('ws');

let wss;

// 1. Initialize the server
const initSocket = (server) => {
    wss = new WebSocket.Server({ server }); // Runs on the same port as your HTTP server
    console.log("WebSocket Server Initialized");
};

// 2. The "Notify" function (Call this after Redis updates)
const notifyClients = (data) => {
    if (!wss) return;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

module.exports = { initSocket, notifyClients };