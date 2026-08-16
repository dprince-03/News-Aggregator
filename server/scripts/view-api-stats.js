require('dotenv').config();
const { ApiLog, sequelize } = require('../src/models');

const viewApiStats = async () => {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Connected to database\n');
        
        // Get stats for last 7 days
        const stats = await ApiLog.getApiStats(7);
        
        if (stats.length === 0) {
            console.log('No API logs found in the last 7 days');
            console.log('💡 Run your cron job or make some API calls first\n');
            process.exit(0);
        }
        
        console.log('API Statistics (Last 7 Days):');
        console.log('═'.repeat(80));
        
        // Format for console.table
        const formatted = stats.map(stat => ({
            'API Source': stat.api_source,
            'Total Requests': parseInt(stat.request_count),
            'Avg Response': parseFloat(stat.avg_response_time).toFixed(2) + ' ms',
            'Max Response': parseInt(stat.max_response_time) + ' ms'
        }));
        
        console.table(formatted);
        
        // Calculate totals
        const totalRequests = stats.reduce((sum, stat) => sum + parseInt(stat.request_count), 0);
        const avgTime = stats.reduce((sum, stat) => sum + parseFloat(stat.avg_response_time), 0) / stats.length;
        
        console.log('\n Summary:');
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Overall Avg Response Time: ${avgTime.toFixed(2)} ms`);
        console.log('');
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

// Add command line arguments
const args = process.argv.slice(2);
const days = args[0] ? parseInt(args[0]) : 7;

viewApiStats();