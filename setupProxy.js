const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/google-rss', // The path your frontend will call
    createProxyMiddleware({
      target: 'https://news.google.com/rss', // CORRECTED: Target the /rss path for Google News
      changeOrigin: true, // Needed for virtual hosted sites
      pathRewrite: {
        '^/api/google-rss': '', // Rewrites '/api/google-rss/search' to '/search'
                                // This will be appended to the target.
                                // So, https://news.google.com/rss + /search -> https://news.google.com/rss/search
      },
      logLevel: 'debug', // Optional: for more detailed proxy logging in your dev server console
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        if (res.writeHead) { // Check if res.writeHead is available
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            });
        }
        // Check if res.finished is false before trying to end the response.
        if (res && !res.finished) {
            res.end('Something went wrong with the proxy. Please check the development server console.');
        }
      }
    })
  );
  // You can add more proxies here if needed for other APIs
};
