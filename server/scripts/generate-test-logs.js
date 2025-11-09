require('dotenv').config();
const { ApiLog, sequelize } = require('../src/models');

const generateTestLogs = async () => {
    await sequelize.authenticate();
    
    const testLogs = [
        { api_source: 'NewsAPI', endpoint: '/top-headlines', status_code: 200, response_time_ms: 245 },
        { api_source: 'NewsAPI', endpoint: '/everything', status_code: 200, response_time_ms: 312 },
        { api_source: 'The Guardian', endpoint: '/search', status_code: 200, response_time_ms: 380 },
        { api_source: 'The Guardian', endpoint: '/search', status_code: 200, response_time_ms: 290 },
        { api_source: 'New York Times', endpoint: '/topstories', status_code: 200, response_time_ms: 450 },
        { api_source: 'NewsAPI', endpoint: '/top-headlines', status_code: 429, response_time_ms: 150 },
    ];
    
    await ApiLog.bulkCreate(testLogs);
    
    console.log('✅ Generated test logs');
    process.exit(0);
};

generateTestLogs();