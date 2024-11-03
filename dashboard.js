class Dashboard {
    constructor() {
        this.initializeEventListeners();
        this.startPeriodicUpdates();
    }

    initializeEventListeners() {
        // Quick scan button
        document.querySelector('[data-action="quick-scan"]')?.addEventListener('click', () => {
            window.location.href = 'new_scan.html?type=quick';
        });

        // Scan filter
        document.getElementById('scan-filter')?.addEventListener('change', (e) => {
            this.filterScans(e.target.value);
        });

        // Logout handler
        document.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    startPeriodicUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            window.dataManager?.updateStats();
        }, 30000);

        // Update active scans every 2 seconds
        setInterval(() => {
            this.updateActiveScans();
        }, 2000);
    }

    async filterScans(type) {
        const scansList = document.getElementById('activeScansList');
        if (!scansList) return;

        const scans = scansList.querySelectorAll('.scan-item');
        scans.forEach(scan => {
            if (type === 'all' || scan.dataset.type === type) {
                scan.classList.remove('hidden');
            } else {
                scan.classList.add('hidden');
            }
        });
    }

    async updateActiveScans() {
        const scanElements = document.querySelectorAll('[data-scan-id]');
        scanElements.forEach(element => {
            const scanId = element.getAttribute('data-scan-id');
            if (scanId) {
                window.scanManager?.updateScanProgress(scanId);
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
}); 