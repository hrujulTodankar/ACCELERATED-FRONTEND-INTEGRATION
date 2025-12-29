const axios = require('axios');
const fs = require('fs');

const BASE = process.env.BHIV_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8001';
const timeout = 10000;

const scenarios = [
  { id: 'harmless_content_001', content: 'This is a positive message about community building and helping others in need.' },
  { id: 'spam_content_002', content: 'Click here to win $1000000! Limited time offer! Buy now! Act fast!' },
  { id: 'neutral_content_003', content: 'The weather is nice today. I went for a walk in the park and enjoyed nature.' },
  { id: 'borderline_content_004', content: 'This might be inappropriate for some audiences but not explicitly harmful content.' },
  { id: 'educational_content_005', content: 'Machine learning algorithms can process large datasets to identify patterns and make predictions.' },
  { id: 'copyright_content_006', content: 'Here is the complete text of a copyrighted novel that I will share in full for everyone.' },
  { id: 'promotional_content_007', content: 'Check out our new product launch! Limited time discount available for early adopters.' },
  { id: 'technical_content_008', content: 'The API endpoint returns a 404 error when the resource is not found on the server.' },
  { id: 'controversial_content_009', content: 'Political opinions that some might find divisive or offensive to certain groups.' },
  { id: 'medical_content_010', content: 'This is not medical advice. Please consult a healthcare professional for medical concerns.' },
  { id: 'gaming_content_011', content: 'Just achieved level 100 in my favorite RPG game! So excited to share this milestone!' },
  { id: 'recipe_content_012', content: 'Here is a simple pasta recipe with tomatoes, garlic, and olive oil. Easy to make!' },
  { id: 'news_content_013', content: 'Breaking: Local government announces new infrastructure project for community development.' },
  { id: 'programming_content_014', content: 'How to implement a binary search algorithm in Python with code examples and explanations.' },
  { id: 'personal_attack_015', content: 'You are a stupid person who knows nothing about this topic. Go away!' },
  { id: 'product_review_016', content: 'This product has great features but poor customer service. I would rate it 3/5 stars.' },
  { id: 'advertisement_017', content: 'Exclusive offer! Buy one get one free! Click the link now before it expires!' },
  { id: 'complaint_018', content: 'I am disappointed with the service quality and want a refund for my purchase.' },
  { id: 'celebration_019', content: 'Happy birthday to my best friend! Hope you have an amazing day filled with joy!' },
  { id: 'question_content_020', content: 'What are the best practices for web development in 2024? Looking for expert advice.' },
];

async function checkHealth() {
  try {
    const res = await axios.get(`${BASE}/health`, { timeout });
    console.log('Backend health:', res.data.status || res.data);
    return true;
  } catch (e) {
    console.error('Backend health check failed:', e.message);
    return false;
  }
}

async function runScenario(s, idx) {
  const result = { id: s.id, scenario: s.content.substring(0,50), apiCalls: [], errors: [] };
  try {
    // 1. GET /moderate
    try {
      const r = await axios.get(`${BASE}/moderate`, { params: { page: 1, limit: 1 }, timeout });
      result.apiCalls.push('GET /moderate');
      result.moderation = r.data;
    } catch (e) { result.errors.push('GET /moderate: '+e.message); }

    // 2. POST /feedback
    try {
      const body = { moderationId: s.id, feedback: `Automated feedback for ${s.id}`, userId: 'runner' };
      const r = await axios.post(`${BASE}/feedback`, body, { timeout });
      result.apiCalls.push('POST /feedback');
      result.feedback = r.data;
    } catch (e) { result.errors.push('POST /feedback: '+e.message); }

    // 3. GET analytics (kb-analytics or bhiv/analytics)
    try {
      const url = `${BASE}/kb-analytics`;
      const r = await axios.get(url, { params: { hours: 24 }, timeout });
      result.apiCalls.push('GET /kb-analytics');
      result.analytics = r.data;
    } catch (e) { result.errors.push('GET /kb-analytics: '+e.message); }

    // 4. GET NLP context
    try {
      const r = await axios.get(`${BASE}/nlp/context`, { params: { text: s.content, analysis_type: 'full' }, timeout });
      result.apiCalls.push('GET /nlp/context');
      result.nlp = r.data;
    } catch (e) { result.errors.push('GET /nlp/context: '+e.message); }

    // 5. GET tags
    try {
      const r = await axios.get(`${BASE}/tag`, { params: { content: s.content, max_tags: 5 }, timeout });
      result.apiCalls.push('GET /tag');
      result.tags = r.data;
    } catch (e) { result.errors.push('GET /tag: '+e.message); }

  } catch (e) {
    result.errors.push('Runner error: '+(e.message||String(e)));
  }
  return result;
}

async function main() {
  console.log('Running real-flow runner against', BASE);
  const ok = await checkHealth();
  if (!ok) { console.error('Backend not healthy; aborting'); process.exit(2); }

  const results = [];
  for (let i=0;i<scenarios.length;i++) {
    console.log(`\n=== Running scenario ${i+1}/${scenarios.length}: ${scenarios[i].id}`);
    const res = await runScenario(scenarios[i], i);
    results.push(res);
    // small pause
    await new Promise(r=>setTimeout(r,200));
  }

  const summary = { timestamp: new Date().toISOString(), base: BASE, results };
  const out = `content_flow_results_${Date.now()}.json`;
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log('\nSaved report to', out);
}

main().catch(e=>{ console.error('Fatal runner error', e); process.exit(1); });
