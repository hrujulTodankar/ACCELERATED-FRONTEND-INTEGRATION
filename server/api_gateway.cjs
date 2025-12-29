const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const BHIV_BASE = process.env.BHIV_BASE_URL || 'http://localhost:8001';
const ADAPTIVE_URL = process.env.ADAPTIVE_TAGGING_URL || 'http://localhost:8000';
const RL_UPDATE_URL = process.env.RL_UPDATE_URL || process.env.RL_API_URL || 'http://localhost:9002/rl/update';
const PORT = process.env.PORT || 8070;

function forward(req, res, targetUrl) {
  const url = targetUrl + req.originalUrl.replace(req.baseUrl, '');
  const method = req.method.toLowerCase();

  const opts = {
    method: method,
    url: url,
    headers: Object.assign({}, req.headers),
    params: req.query,
    data: req.body,
    timeout: 15000,
  };

  // Remove host to avoid mismatches
  delete opts.headers.host;

  axios(opts)
    .then(r => {
      res.status(r.status).set(r.headers).send(r.data);
    })
    .catch(e => {
      if (e.response) {
        res.status(e.response.status).send(e.response.data);
      } else {
        res.status(502).json({ error: 'Bad Gateway', detail: e.message });
      }
    });
}

// Moderation
app.get('/moderate', (req, res) => forward(req, res, BHIV_BASE));
app.get('/moderate/:id', (req, res) => forward(req, res, BHIV_BASE));
app.post('/feedback', (req, res) => forward(req, res, BHIV_BASE));

// Analytics
app.get('/kb-analytics', (req, res) => forward(req, res, BHIV_BASE));
app.get('/bhiv/analytics', (req, res) => forward(req, res, BHIV_BASE));

// Ingest analytics -> adaptive-tagging service
app.post('/ingest/analytics', (req, res) => {
  // Forward to adaptive tagging service; include API key header if provided
  const target = ADAPTIVE_URL.replace(/\/$/, '') + '/ingest/analytics';
  const headers = Object.assign({}, req.headers);
  delete headers.host;

  axios.post(target, req.body, { headers, timeout: 15000 })
    .then(r => res.status(r.status).send(r.data))
    .catch(e => {
      if (e.response) res.status(e.response.status).send(e.response.data);
      else res.status(502).json({ error: 'Bad Gateway', detail: e.message });
    });
});

// NLP
app.get('/nlp/context', (req, res) => forward(req, res, BHIV_BASE));
app.post('/nlp/context', (req, res) => forward(req, res, BHIV_BASE));

// Tags
app.get('/tag', (req, res) => forward(req, res, BHIV_BASE));

// RL update endpoint
app.post('/rl/update', (req, res) => {
  // forward to configured RL_UPDATE_URL
  axios.post(RL_UPDATE_URL, req.body, { headers: req.headers, timeout: 10000 })
    .then(r => res.status(r.status).send(r.data))
    .catch(e => {
      if (e.response) res.status(e.response.status).send(e.response.data);
      else res.status(502).json({ error: 'Bad Gateway', detail: e.message });
    });
});

app.get('/', (req, res) => res.json({ gateway: 'ok', BHIV_BASE, ADAPTIVE_URL, RL_UPDATE_URL }));

// Health proxy: forward to BHIV Core /health if available, otherwise return gateway status
app.get('/health', (req, res) => {
  const target = BHIV_BASE.replace(/\/$/, '') + '/health';
  axios.get(target, { timeout: 5000 })
    .then(r => res.status(r.status).set(r.headers).send(r.data))
    .catch(e => {
      // If BHIV health not available, return gateway info with error details
      res.status(200).json({ gateway: 'ok', BHIV_BASE, adaptive: ADAPTIVE_URL, rl: RL_UPDATE_URL, bhiv_health_error: e.message });
    });
});

app.listen(PORT, () => console.log(`API Gateway listening on http://localhost:${PORT}`));

module.exports = app;
