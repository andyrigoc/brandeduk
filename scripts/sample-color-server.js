/**
 * Local eyedropper API for Live Server / static dev (port 5507 has no /api).
 * Run: node scripts/sample-color-server.js
 * Then colour sampling uses http://127.0.0.1:8787/api/sample-color
 */
'use strict';

const http = require('http');
const sampleColorHandler = require('../api/sample-color.js');

const PORT = Number(process.env.COLOR_API_PORT || 8787);

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (requestUrl.pathname !== '/api/sample-color') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Use GET /api/sample-color?url=...');
    return;
  }

  const query = Object.fromEntries(requestUrl.searchParams.entries());
  const mockRes = {
    _status: 200,
    setHeader(key, value) {
      res.setHeader(key, value);
    },
    status(code) {
      this._status = code;
      return {
        json: (payload) => {
          res.writeHead(code, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(payload));
        },
        end: () => {
          res.writeHead(code);
          res.end();
        }
      };
    }
  };

  try {
    await sampleColorHandler({ method: req.method, query }, mockRes);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Server error' }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Eyedropper API: http://127.0.0.1:${PORT}/api/sample-color?url=...`);
});
