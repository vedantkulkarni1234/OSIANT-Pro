class ScanManager {
    constructor() {
        this.activeScans = new Map(JSON.parse(localStorage.getItem('activeScans') || '[]'));
        this.scanHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
        this.discoveredAssets = 0;
        this.securityAlerts = 0;
    }

    createScanElement(scan) {
        const template = document.getElementById('scanTemplate');
        if (!template) {
            console.error('Scan template not found');
            return document.createElement('div');
        }

        const clone = template.content.cloneNode(true);
        const scanElement = clone.querySelector('.scan-item');
        
        scanElement.setAttribute('data-scan-id', scan.id);
        
        // Update scan details
        const nameElement = scanElement.querySelector('.scan-name');
        if (nameElement) nameElement.textContent = scan.name;
        
        const targetElement = scanElement.querySelector('.scan-target');
        if (targetElement) targetElement.textContent = scan.target;
        
        const statusElement = scanElement.querySelector('.scan-status');
        if (statusElement) {
            statusElement.textContent = scan.status;
            statusElement.className = `scan-status px-3 py-1 rounded-full text-sm ${this.getStatusClass(scan.status)}`;
        }

        // Update progress elements
        const progressBar = scanElement.querySelector('.progress-bar');
        if (progressBar) progressBar.style.width = `${scan.progress || 0}%`;
        
        const progressText = scanElement.querySelector('.scan-progress');
        if (progressText) progressText.textContent = `${Math.round(scan.progress || 0)}%`;
        
        const discoveredText = scanElement.querySelector('.scan-discovered');
        if (discoveredText) discoveredText.textContent = `Discovered: ${scan.discoveredEndpoints || 0} endpoints`;
        
        const timeRemaining = scanElement.querySelector('.scan-time-remaining');
        if (timeRemaining) {
            const estimate = Math.ceil((100 - (scan.progress || 0)) / 5);
            timeRemaining.textContent = `Est. time: ${estimate} seconds`;
        }
        
        return scanElement;
    }

    updateScanProgress(scanId) {
        const scan = this.activeScans.get(scanId);
        if (!scan) return;

        const scanElement = document.querySelector(`[data-scan-id="${scanId}"]`);
        if (!scanElement) return;

        // Update progress bar and text with smooth animation
        const progressBar = scanElement.querySelector('.progress-bar');
        const progressText = scanElement.querySelector('.scan-progress');
        
        if (progressBar) {
            progressBar.style.transition = 'width 0.5s ease-in-out';
            progressBar.style.width = `${scan.progress}%`;
        }
        if (progressText) progressText.textContent = `${Math.round(scan.progress)}%`;

        // Update discovered endpoints with animation
        const discoveredText = scanElement.querySelector('.scan-discovered');
        if (discoveredText) {
            const currentValue = parseInt(discoveredText.getAttribute('data-value') || '0');
            const newValue = scan.discoveredEndpoints;
            if (currentValue !== newValue) {
                discoveredText.setAttribute('data-value', newValue);
                discoveredText.classList.add('text-blue-400');
                setTimeout(() => discoveredText.classList.remove('text-blue-400'), 500);
            }
            discoveredText.textContent = `Discovered: ${newValue} endpoints`;
        }

        // Update time remaining with better estimation
        const timeRemaining = scanElement.querySelector('.scan-time-remaining');
        if (timeRemaining) {
            const estimate = this.calculateTimeRemaining(scan.progress, scan.startTime);
            timeRemaining.textContent = `Est. time: ${estimate}`;
        }

        // Update status with visual feedback
        const statusElement = scanElement.querySelector('.scan-status');
        if (statusElement) {
            const newStatus = this.getStatusFromProgress(scan.progress);
            if (statusElement.textContent !== newStatus) {
                statusElement.textContent = newStatus;
                statusElement.className = `scan-status px-3 py-1 rounded-full text-sm ${this.getStatusClass(newStatus)}`;
                statusElement.classList.add('animate-pulse');
                setTimeout(() => statusElement.classList.remove('animate-pulse'), 1000);
            }
        }

        // Update global stats
        this.updateDashboardStats();
    }

    calculateTimeRemaining(progress, startTime) {
        const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
        const rate = progress / elapsed;
        if (rate === 0) return 'Calculating...';
        
        const remaining = Math.ceil((100 - progress) / rate);
        
        if (remaining < 60) return `${remaining} seconds`;
        if (remaining < 3600) return `${Math.ceil(remaining / 60)} minutes`;
        return `${Math.ceil(remaining / 3600)} hours`;
    }

    getStatusFromProgress(progress) {
        if (progress >= 100) return 'completed';
        if (progress >= 75) return 'finalizing';
        if (progress >= 25) return 'scanning';
        return 'initializing';
    }

    async mockStartScan(scanConfig) {
        const scanId = Math.random().toString(36).substr(2, 9);
        
        const mockScan = {
            ...scanConfig,
            id: scanId,
            progress: 0,
            status: 'running',
            discoveredEndpoints: 0,
            startTime: new Date().toISOString()
        };
        
        this.activeScans.set(scanId, mockScan);
        this.simulateScanProgress(scanId);
        this.saveToStorage();
        this.updateDashboardStats();
        
        return scanId;
    }

    simulateScanProgress(scanId) {
        const scan = this.activeScans.get(scanId);
        if (!scan) return;

        scan.startTime = scan.startTime || new Date().toISOString();
        let lastUpdate = Date.now();

        const interval = setInterval(() => {
            if (!this.activeScans.has(scanId)) {
                clearInterval(interval);
                return;
            }

            const now = Date.now();
            const timeDiff = now - lastUpdate;
            lastUpdate = now;

            // More realistic progress calculation
            const progressIncrement = (Math.random() * 5 * timeDiff) / 1000; // 0-5% per second
            scan.progress = Math.min(100, (scan.progress || 0) + progressIncrement);
            
            // Realistic endpoint discovery
            const newEndpoints = Math.floor(Math.random() * 3); // 0-2 endpoints per update
            scan.discoveredEndpoints = (scan.discoveredEndpoints || 0) + newEndpoints;
            this.discoveredAssets += newEndpoints;

            // Trigger notifications at key points
            this.checkAndTriggerNotifications(scan);

            if (scan.progress >= 100) {
                this.completeScan(scan, scanId);
                clearInterval(interval);
            }

            this.updateScanProgress(scanId);
            this.saveToStorage();
        }, 1000); // Update every second for smoother progress
    }

    checkAndTriggerNotifications(scan) {
        const progressMilestones = [25, 50, 75, 90];
        
        progressMilestones.forEach(milestone => {
            if (scan.progress >= milestone && !scan[`notification${milestone}`]) {
                scan[`notification${milestone}`] = true;
                window.notificationManager.addNotification({
                    type: 'scan',
                    title: `Scan Progress: ${milestone}%`,
                    message: `${scan.name} is ${milestone}% complete`,
                    priority: milestone >= 75 ? 'High' : 'Medium',
                    details: `Discovered ${scan.discoveredEndpoints} endpoints`
                });
            }
        });

        // Random security findings
        if (Math.random() < 0.05) { // 5% chance per update
            this.securityAlerts++;
            window.notificationManager.addNotification({
                type: 'vulnerability',
                title: 'Security Finding',
                message: 'Potential vulnerability detected',
                priority: 'High',
                details: 'New security issue requires attention'
            });
        }
    }

    completeScan(scan, scanId) {
        scan.progress = 100;
        scan.status = 'completed';
        scan.endTime = new Date().toISOString();
        
        window.notificationManager.addNotification({
            type: 'success',
            title: 'Scan Completed',
            message: `${scan.name} has finished successfully`,
            priority: 'Info',
            details: `Total endpoints discovered: ${scan.discoveredEndpoints}`
        });

        this.scanHistory.push({...scan});
        this.activeScans.delete(scanId);
    }

    updateDashboardStats() {
        // Update stats elements
        const stats = {
            activeScans: this.activeScans.size,
            discoveredAssets: this.discoveredAssets,
            securityAlerts: Math.floor(Math.random() * 10),
            reports: this.scanHistory.length
        };

        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) element.textContent = value;
        });
    }

    updateCharts() {
        // Update scan activity chart
        const activityChart = document.getElementById('scanActivityChart');
        if (activityChart && window.scanActivityChart) {
            const labels = Array.from({length: 10}, (_, i) => `${i * 10}%`);
            const data = Array.from({length: 10}, () => Math.floor(Math.random() * 100));
            
            window.scanActivityChart.data.labels = labels;
            window.scanActivityChart.data.datasets[0].data = data;
            window.scanActivityChart.update();
        }

        // Update security score chart
        const scoreChart = document.getElementById('securityScoreChart');
        if (scoreChart && window.securityScoreChart) {
            const score = Math.floor(Math.random() * 20) + 80; // Random score between 80-100
            window.securityScoreChart.data.datasets[0].data = [score, 100 - score];
            window.securityScoreChart.update();
        }

        // Update asset distribution chart
        const assetChart = document.getElementById('assetDistributionChart');
        if (assetChart && window.assetDistributionChart) {
            const data = [
                Math.floor(Math.random() * 50) + 50,
                Math.floor(Math.random() * 30) + 20,
                Math.floor(Math.random() * 20) + 10
            ];
            window.assetDistributionChart.data.datasets[0].data = data;
            window.assetDistributionChart.update();
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('activeScans', JSON.stringify(Array.from(this.activeScans.entries())));
            localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    getStatusClass(status) {
        const statusClasses = {
            'running': 'bg-blue-500/20 text-blue-400',
            'completed': 'bg-green-500/20 text-green-400',
            'failed': 'bg-red-500/20 text-red-400',
            'paused': 'bg-yellow-500/20 text-yellow-400'
        };
        return statusClasses[status] || 'bg-gray-500/20 text-gray-400';
    }
}

window.scanManager = new ScanManager();