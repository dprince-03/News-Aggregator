const cron = require('node-cron');
const { fetchAndSaveArticles } = require('../services/aggregator.services');
const { ApiLog } = require('../models');

/**
 * Fetch articles job
 * Runs every hour
 */
const startArticleFetchJob = () => {
    // Run every hour at minute 0
    // Format: second minute hour day month weekday
    const schedule = '0 * * * *'; // Every hour
    
    console.log(' Starting article fetch cron job...');
    console.log(`   Schedule: Every hour`);
    
    const job = cron.schedule(schedule, async () => {
        console.log('\n' + '='.repeat(60));
        console.log(` [CRON] Fetching articles - ${new Date().toISOString()}`);
        console.log('='.repeat(60));
        
        try {
            const result = await fetchAndSaveArticles();
            
            if (result.success) {
                console.log(` [CRON] Success: ${result.fetched} fetched, ${result.saved} saved`);

                const stats = await ApiLog.getApiStats(1); // Today's stats
                console.log('\n Today\'s API Usage:');
                stats.forEach(stat => {
                    console.log(`   ${stat.api_source}: ${stat.request_count} requests, avg ${parseFloat(stat.avg_response_time).toFixed(0)}ms`);
                });
            } else {
                console.error(` [CRON] Failed: ${result.error}`);
            }
        } catch (error) {
            console.error(' [CRON] Error:', error.message);
        }
        
        console.log('='.repeat(60) + '\n');
    });
    
    console.log(' Article fetch job started successfully\n');
    
    return job;
};

/**
 * Manually trigger article fetch
 */
const manualFetch = async () => {
    console.log(' Manual article fetch triggered...\n');
    return await fetchAndSaveArticles();
};

module.exports = {
    startArticleFetchJob,
    manualFetch,
};