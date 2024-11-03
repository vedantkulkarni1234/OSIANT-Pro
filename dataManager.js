class DataManager {
    constructor() {
        this.stats = {
            activeScans: 0,
            discoveredAssets: 0,
            securityAlerts: 0,
            reports: 0
        };
    }

    async updateStats(forceUpdate = false) {
        try {
            // Get stats from scanManager
            this.stats = window.scanManager.getStats();

            // Update UI
            Object.keys(this.stats).forEach(key => {
                const element = document.querySelector(`[data-stat="${key}"]`);
                if (element) {
                    element.textContent = this.stats[key];
                }
            });
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    getRecentAlerts() {
        // Simulated alerts
        return [
            {
                type: 'Critical Vulnerability',
                priority: 'High',
                time: '2 minutes ago'
            },
            {
                type: 'Asset Discovery Update',
                priority: 'Medium',
                time: '15 minutes ago'
            },
            {
                type: 'Automatic Scan Scheduled',
                priority: 'Info',
                time: '1 hour ago'
            }
        ];
    }
}

// Initialize global data manager
window.dataManager = new DataManager();