const Logger = require('./Logger');
const QueueManager = require('./QueueManager');
const { BRANCH_ID } = require('../utils/config');

const Realtime = {
  subscribe: (supabase) => {
    Logger.info(`[Realtime] Subscribing to print_jobs for branch: ${BRANCH_ID}`);
    supabase.channel('public:print_jobs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'print_jobs',
        filter: `branch_id=eq.${BRANCH_ID}` 
      }, (payload) => {
        const job = payload.new;
        if (job.status === 'pending') {
          QueueManager.enqueue(job);
        }
      })
      .subscribe((status) => {
        Logger.info(`[Realtime] Subscription status: ${status}`);
      });
  },

  fetchPendingJobs: async (supabase) => {
    try {
      Logger.info(`[Sync] Querying print_jobs for branch_id="${BRANCH_ID}" and status="pending"...`);
      const { data, error } = await supabase
        .from('print_jobs')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .eq('status', 'pending');
        
      if (error) {
        Logger.error('[Sync] Failed to fetch pending jobs:', error);
        return;
      }
      
      Logger.info(`[Sync] Query returned ${data ? data.length : 0} pending jobs.`);
      
      if (data && data.length > 0) {
        let addedCount = 0;
        data.forEach(job => {
          if (!QueueManager.activeJobIds.has(job.id)) {
            QueueManager.enqueue(job);
            addedCount++;
          }
        });
        if (addedCount > 0) {
          Logger.info(`[Sync] Queued ${addedCount} new print jobs to printer queue.`);
        }
      }
    } catch (err) {
      Logger.error('[Sync] Exception in fetchPendingJobs:', err.message);
    }
  }
};

module.exports = Realtime;
