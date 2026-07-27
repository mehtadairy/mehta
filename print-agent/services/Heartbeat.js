const Logger = require('./Logger');
const { API_URL, API_KEY, BRANCH_ID } = require('../utils/config');

const Heartbeat = {
  start: () => {
    Logger.info('[Heartbeat] Starting 60s ping...');
    
    const ping = async () => {
      try {
        const response = await fetch(`${API_URL}/api/print/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({ branch_id: BRANCH_ID })
        });
        if (!response.ok) {
          Logger.warn(`[Heartbeat] Warning: API returned ${response.status}`);
        }
      } catch (err) {
        Logger.error(`[Heartbeat] Failed to ping API: ${err.message}`);
      }
    };

    // Initial immediate heartbeat
    ping();
    
    // Interval heartbeat
    setInterval(ping, 60 * 1000);
  }
};

module.exports = Heartbeat;
