const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.INSIGHTBRIDGE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Load configuration
const configPath = path.join(__dirname, '..', 'insightbridge-phase3', '.env');
let insightbridgeConfig = {};

if (fs.existsSync(configPath)) {
    const envContent = fs.readFileSync(configPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            insightbridgeConfig[key.trim()] = valueParts.join('=').trim();
        }
    });
}

// Mock Insight Bridge Analytics Data
const mockAnalytics = {
    'tag-123': {
        tagId: 'tag-123',
        userEngagement: {
            clickThroughRate: 0.85,
            dwellTime: 45.2,
            scrollDepth: 0.92,
            interactions: 127
        },
        performance: {
            loadTime: 0.8,
            renderTime: 0.3,
            errorRate: 0.02,
            availability: 99.8
        },
        insights: {
            userBehavior: 'high_engagement',
            recommendedActions: [
                'Increase visibility',
                'Add interactive elements',
                'Optimize for mobile'
            ],
            anomalies: []
        },
        timestamp: new Date().toISOString()
    },
    'tag-456': {
        tagId: 'tag-456',
        userEngagement: {
            clickThroughRate: 0.62,
            dwellTime: 28.7,
            scrollDepth: 0.68,
            interactions: 89
        },
        performance: {
            loadTime: 1.2,
            renderTime: 0.5,
            errorRate: 0.05,
            availability: 98.5
        },
        insights: {
            userBehavior: 'moderate_engagement',
            recommendedActions: [
                'Improve content relevance',
                'Reduce load time',
                'Test different positioning'
            ],
            anomalies: ['Higher than average error rate']
        },
        timestamp: new Date().toISOString()
    }
};

// API Routes

// Get real-time analytics for a tag
app.get('/api/v1/insights/analytics/:tagId', (req, res) => {
    const { tagId } = req.params;
    
    // Simulate processing delay
    setTimeout(() => {
        if (mockAnalytics[tagId]) {
            res.json({
                success: true,
                data: mockAnalytics[tagId],
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Tag analytics not found',
                tagId
            });
        }
    }, Math.random() * 500 + 100); // Random delay 100-600ms
});

// Get insights summary
app.get('/api/v1/insights/summary', (req, res) => {
    const { tagIds } = req.query;
    
    setTimeout(() => {
        const tagIdList = tagIds ? tagIds.split(',') : Object.keys(mockAnalytics);
        const summary = {
            totalTags: tagIdList.length,
            averageEngagement: 0.74,
            topPerformingTags: ['tag-123'],
            lowPerformingTags: ['tag-456'],
            insights: [
                'Overall engagement is above average',
                'Consider optimizing tag positioning',
                'Mobile performance needs improvement'
            ],
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: summary
        });
    }, 200);
});

// Subscribe to real-time updates (WebSocket simulation)
app.get('/api/v1/insights/stream/:tagId', (req, res) => {
    const { tagId } = req.params;
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial data
    if (mockAnalytics[tagId]) {
        res.write(`data: ${JSON.stringify({
            type: 'initial',
            data: mockAnalytics[tagId]
        })}\n\n`);
    }
    
    // Send periodic updates
    const interval = setInterval(() => {
        if (mockAnalytics[tagId]) {
            // Simulate real-time data changes
            const updatedData = {
                ...mockAnalytics[tagId],
                userEngagement: {
                    ...mockAnalytics[tagId].userEngagement,
                    clickThroughRate: Math.max(0.1, Math.min(1.0, 
                        mockAnalytics[tagId].userEngagement.clickThroughRate + (Math.random() - 0.5) * 0.1
                    )),
                    interactions: mockAnalytics[tagId].userEngagement.interactions + Math.floor(Math.random() * 3)
                },
                timestamp: new Date().toISOString()
            };
            
            res.write(`data: ${JSON.stringify({
                type: 'update',
                data: updatedData
            })}\n\n`);
        }
    }, 3000);
    
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// Get behavioral insights
app.post('/api/v1/insights/behavior', (req, res) => {
    const { userId, sessionId, tagId, action, context } = req.body;
    
    setTimeout(() => {
        const behaviorData = {
            userId,
            sessionId,
            tagId,
            action,
            context,
            timestamp: new Date().toISOString(),
            insights: {
                userType: 'power_user',
                preferredContentType: 'interactive',
                optimalEngagementTime: 'afternoon',
                recommendedTagTypes: ['dynamic', 'contextual']
            }
        };
        
        res.json({
            success: true,
            data: behaviorData
        });
    }, 150);
});

// Performance monitoring endpoint
app.get('/api/v1/insights/performance/:tagId', (req, res) => {
    const { tagId } = req.params;
    
    setTimeout(() => {
        const performanceData = {
            tagId,
            metrics: {
                responseTime: Math.random() * 200 + 50,
                throughput: Math.random() * 1000 + 500,
                errorRate: Math.random() * 0.1,
                uptime: 99.5 + Math.random() * 0.5
            },
            alerts: [],
            recommendations: [
                'Consider caching frequently accessed data',
                'Optimize database queries',
                'Implement rate limiting'
            ],
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: performanceData
        });
    }, 100);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Insight Bridge',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        config: {
            port: PORT,
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Insight Bridge Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔗 Insight Bridge Server running on port ${PORT}`);
    console.log(`📊 Analytics endpoints available at http://localhost:${PORT}/api/v1/insights`);
    console.log(`🔄 Real-time streaming at http://localhost:${PORT}/api/v1/insights/stream/:tagId`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Insight Bridge Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Insight Bridge Server shutting down gracefully...');
    process.exit(0);
});