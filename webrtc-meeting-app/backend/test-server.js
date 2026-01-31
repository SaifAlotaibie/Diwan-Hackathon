console.log("========================================");
console.log("TEST SERVER STARTING");
console.log("========================================");

const http = require('http');
const PORT = process.env.PORT || 3001;

console.log("Attempting to create server on port:", PORT);

const server = http.createServer((req, res) => {
  console.log("Received request:", req.url);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    message: 'Test server is running!',
    port: PORT,
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log("========================================");
  console.log(`✅ TEST SERVER RUNNING ON PORT ${PORT}`);
  console.log("========================================");
});

server.on('error', (error) => {
  console.error("❌ Server error:", error);
  process.exit(1);
});

// Keep alive
setInterval(() => {
  console.log("💓 Server is alive on port", PORT);
}, 10000);
