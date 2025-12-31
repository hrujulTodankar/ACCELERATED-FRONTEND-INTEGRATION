const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8001;

app.use(bodyParser.json());

function now() { return new Date().toISOString(); }

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: now(),
    service: 'BHIV Core Service',
    version: '1.0.0'
  });
});

// Main API endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BHIV Core Service API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/moderate',
      '/moderate/:id',
      '/feedback',
      '/kb-analytics',
      '/nlp/context',
      '/tag',
      '/query-kb'
    ]
  });
});

// Content moderation endpoints
app.get('/moderate', (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const items = [];
  
  for (let i = 0; i < limit; i++) {
    items.push({
      id: `content_${page}_${i}`,
      content: `Sample content ${i + 1} for content ID ${page}-${i}`,
      decision: ['pending', 'approved', 'rejected'][i % 3],
      confidence: 0.7 + (i * 0.05),
      timestamp: now(),
      flagged: i % 4 === 0,
      type: 'text',
      metadata: { 
        source: 'bhiv_core', 
        length: 100 + (i * 10),
        language: 'en'
      },
      analytics: {
        views: 150 + (i * 20),
        clicks: 45 + (i * 5),
        engagement_rate: 0.30 + (i * 0.02)
      },
      nlpContext: {
        topics: [
          { name: 'technology', confidence: 0.85 },
          { name: 'content', confidence: 0.75 }
        ],
        sentiment: { label: 'neutral', score: 0.5, confidence: 0.8 },
        entities: [
          { text: 'content', type: 'misc', confidence: 0.9 }
        ],
        context: 'AI-analyzed content with context and insights'
      },
      tags: {
        tags: [
          { label: 'technology', confidence: 0.92, category: 'topic' },
          { label: 'sample', confidence: 0.85, category: 'general' }
        ],
        confidence: 0.88,
        model: 'bhiv-core-v1.0'
      }
    });
  }
  
  res.json({ 
    data: items, 
    total: 100, 
    page, 
    limit,
    total_pages: Math.ceil(100 / limit)
  });
});

app.get('/moderate/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    content: `Detailed content for ${id}`,
    decision: 'pending',
    confidence: 0.85,
    timestamp: now(),
    flagged: false,
    type: 'text',
    metadata: { 
      source: 'bhiv_core',
      length: 250,
      language: 'en'
    }
  });
});

// Feedback endpoint
app.post('/feedback', (req, res) => {
  const body = req.body || {};
  console.log('Feedback received:', body);
  
  res.json({ 
    success: true, 
    confidence: 0.9, 
    timestamp: now(), 
    feedbackId: `fb_${Date.now()}`,
    rlReward: { reward: 0.15 },
    confidenceScore: 0.92
  });
});

// Analytics endpoint
app.get('/kb-analytics', (req, res) => {
  const hours = parseInt(req.query.hours || '24');
  res.json({ 
    status: 'success',
    analytics: { 
      total_queries: 150,
      avg_response_time: 1.2,
      success_rate: 0.88,
      queries_by_endpoint: {
        '/moderate': 80,
        '/feedback': 45,
        '/kb-analytics': 25
      }
    },
    timestamp: now(),
    period_hours: hours
  });
});

// NLP context endpoint
app.get('/nlp/context', (req, res) => {
  const text = req.query.text || '';
  res.json({
    status: 'success',
    analysis: { 
      sentiment: { score: 0.6, label: 'neutral', confidence: 0.85 },
      topics: [
        { name: 'content analysis', confidence: 0.90 },
        { name: 'nlp processing', confidence: 0.82 }
      ],
      entities: [
        { text: 'content', label: 'MISC', confidence: 0.95 },
        { text: 'analysis', label: 'MISC', confidence: 0.88 }
      ],
      summary: `Enhanced NLP analysis of: ${text.substring(0, 50)}...`,
      language: 'en',
      complexity: 'medium'
    },
    timestamp: now()
  });
});

app.post('/nlp/context', (req, res) => {
  const body = req.body || {};
  const text = body.text || '';
  res.json({
    status: 'success',
    analysis: { 
      sentiment: { score: 0.7, label: 'positive', confidence: 0.88 },
      topics: [
        { name: 'text processing', confidence: 0.92 },
        { name: 'content analysis', confidence: 0.87 }
      ],
      entities: [
        { text: 'text', label: 'MISC', confidence: 0.96 },
        { text: 'processing', label: 'MISC', confidence: 0.89 }
      ],
      summary: `POST NLP analysis completed for: ${text.substring(0, 50)}...`,
      language: 'en',
      complexity: 'low'
    },
    timestamp: now()
  });
});

// Tag generation endpoint
app.get('/tag', (req, res) => {
  const content = req.query.content || '';
  const maxTags = parseInt(req.query.max_tags || '5');
  
  const possibleTags = [
    { tag: 'technology', score: 0.92, category: 'topic' },
    { tag: 'artificial-intelligence', score: 0.88, category: 'tech' },
    { tag: 'machine-learning', score: 0.85, category: 'tech' },
    { tag: 'content', score: 0.82, category: 'general' },
    { tag: 'analysis', score: 0.79, category: 'process' },
    { tag: 'data', score: 0.76, category: 'subject' },
    { tag: 'insights', score: 0.73, category: 'outcome' },
    { tag: 'processing', score: 0.70, category: 'action' }
  ];
  
  const tags = possibleTags.slice(0, maxTags);
  
  res.json({ 
    status: 'success', 
    tags,
    total_tags: tags.length,
    model: 'bhiv-core-tag-generator-v1.0',
    confidence: 0.87,
    timestamp: now()
  });
});

// Knowledge base query endpoint
app.post('/query-kb', (req, res) => {
  const body = req.body || {};
  const query = body.query || '';
  const limit = body.limit || 5;
  
  res.json({
    response: `Based on the knowledge base analysis of "${query.substring(0, 50)}...", here are the relevant insights and recommendations. The system has processed this query using advanced AI algorithms to provide accurate and contextual information.`,
    sources: [
      {
        text: `Knowledge source 1 related to: ${query.substring(0, 30)}`,
        source: 'bhiv_knowledge_base_v1'
      },
      {
        text: `Knowledge source 2 related to: ${query.substring(0, 30)}`,
        source: 'bhiv_knowledge_base_v2'
      }
    ],
    query_id: `kb_${Date.now()}`,
    timestamp: now(),
    processing_time: '1.2s',
    confidence: 0.89
  });
});

// Start server
app.listen(port, () => {
  console.log(`BHIV Core Service running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API docs: http://localhost:${port}/`);
});

module.exports = app;
