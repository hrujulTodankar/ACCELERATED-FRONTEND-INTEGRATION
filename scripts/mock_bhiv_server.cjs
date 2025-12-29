const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8002;

app.use(bodyParser.json());

function now() { return new Date().toISOString(); }

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: now() });
});

app.get('/moderate', (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const items = [];
  for (let i=0;i<limit;i++) {
    items.push({
      id: `mod_${page}_${i}`,
      content: `Mock content ${i+1} for moderation`,
      decision: ['pending','approved','rejected'][i%3],
      confidence: 0.7 + i*0.05,
      timestamp: now(),
      flagged: i%4===0,
      type: 'text',
      metadata: { source: 'mock', length: 100+i*10 }
    });
  }
  res.json({ data: items, total: items.length, page, limit });
});

app.get('/moderate/:id', (req, res) => {
  res.json({ id: req.params.id, content: `Detailed mock for ${req.params.id}`, decision: 'pending', confidence: 0.85, timestamp: now() });
});

app.post('/feedback', (req, res) => {
  const body = req.body || {};
  res.json({ success: true, confidence: 0.9, timestamp: now(), feedbackId: `fb_${Date.now()}`, rlReward: { reward: 0.1 }, confidenceScore: 0.9 });
});

app.get('/kb-analytics', (req, res) => {
  res.json({ status: 'success', analytics: { total_queries: 42, avg_response_time: 1.1 }, timestamp: now() });
});

// BHIV-specific analytics endpoint
app.get('/bhiv/analytics', (req, res) => {
  res.json({ status: 'success', analytics: { total_queries: 420, avg_response_time: 0.95, success_rate: 0.88 }, timestamp: now() });
});

app.get('/nlp/context', (req, res) => {
  const text = req.query.text || '';
  res.json({ status: 'success', analysis: { sentiment: { score: 0.5, label: 'neutral', confidence: 0.8 }, summary: `Mock analysis of: ${text.substring(0,40)}` }, timestamp: now() });
});

app.post('/nlp/context', (req, res) => {
  const body = req.body || {};
  const text = body.text || '';
  res.json({ status: 'success', analysis: { sentiment: { score: 0.6, label: 'neutral', confidence: 0.85 }, entities: [{ text: 'mock', label: 'MISC', confidence: 0.9 }], summary: `Mock POST analysis of: ${text.substring(0,40)}` }, timestamp: now() });
});

app.get('/tag', (req, res) => {
  const content = req.query.content || '';
  const tags = ['mock','test','integration','sample'].slice(0, parseInt(req.query.max_tags||'4'));
  res.json({ status: 'success', tags: tags.map((t,i)=>({ tag: t, score: 0.8 - i*0.05 })) , total_tags: tags.length, timestamp: now() });
});

// RL reward endpoint
app.post('/rl/reward', (req, res) => {
  const body = req.body || {};
  // Simulate a small reward update
  const rewardVal = Math.random() * 0.2 + 0.05;
  res.json({ status: 'success', reward: rewardVal, confidenceUpdate: 0.05, timestamp: now() });
});

app.get('/', (req, res) => res.json({ message: 'Mock BHIV server', port }));

app.listen(port, ()=> console.log(`Mock BHIV server listening on http://localhost:${port}`));
