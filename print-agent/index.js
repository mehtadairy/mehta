process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('./utils/config');
const Logger = require('./services/Logger');
const QueueManager = require('./services/QueueManager');
const Realtime = require('./services/Realtime');
const Heartbeat = require('./services/Heartbeat');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  Logger.info("==========================================");
  Logger.info(" Mehta Dairy Print Agent v3.2 (Modular) ");
  Logger.info("==========================================");
  
  QueueManager.init(supabase);
  
  await Realtime.fetchPendingJobs(supabase);
  Realtime.subscribe(supabase);
  Heartbeat.start();
  
  // Fallback Polling Loop: Check database for missed print jobs every 10 seconds
  setInterval(async () => {
    await Realtime.fetchPendingJobs(supabase);
  }, 10 * 1000);
}

run();
