const fastq = require('fastq');
const Logger = require('./Logger');
const PrinterManager = require('./PrinterManager');
const ReceiptBuilder = require('./ReceiptBuilder');
const config = require('../utils/config');
let supabaseClient = null;

const activeJobIds = new Set();

const QueueManager = {
  init: (supabase) => {
    supabaseClient = supabase;
  },

  activeJobIds,

  enqueue: (job) => {
    if (!activeJobIds.has(job.id)) {
      activeJobIds.add(job.id);
      Logger.info(`[Queue] Received new print job ${job.id}`);
      printQueue.push(job);
    }
  }
};

const processPrintJob = (job) => {
  return new Promise((resolve, reject) => {
    try {
      Logger.info(`[Job] Processing Print Job ${job.id} for ${job.target_printer}...`);
      
      // Removed hardcoded skip logic to allow billing and kitchen receipts to print
      const payload = JSON.parse(job.esc_pos_data);
      
      // Ensure payload has printType for conditional rendering
      payload.printType = job.target_printer;

      ReceiptBuilder.buildCustomerReceipt(payload)
        .then((binaryBuffer) => {
          return PrinterManager.printJob(job.target_printer, binaryBuffer, payload);
        })
        .then(resolve)
        .catch(reject);
        
    } catch (err) {
      Logger.error(`[Job Error] Processing failed for ${job.id}:`, err);
      reject(err);
    }
  });
};

const printQueue = fastq.promise(async (job) => {
  try {
    await processPrintJob(job);
    if (supabaseClient) {
      await supabaseClient.from('print_jobs').update({ status: 'printed', updated_at: new Date().toISOString() }).eq('id', job.id);
    }
    Logger.info(`[Queue] Successfully printed job ${job.id}`);
  } catch (error) {
    if (supabaseClient) {
      await supabaseClient.from('print_jobs').update({ 
        status: 'failed', 
        error_message: error.message || 'Unknown error',
        retries: (job.retries || 0) + 1,
        updated_at: new Date().toISOString()
      }).eq('id', job.id);
    }
    Logger.error(`[Queue] Failed job ${job.id}`);
  } finally {
    QueueManager.activeJobIds.delete(job.id);
  }
}, 1); // Concurrency = 1

module.exports = QueueManager;
