class ReportManager {
    constructor() {
        this.format = 'pdf';
        this.scanData = null;
        this.findings = [];
        this.recommendations = [];
    }

    async loadReportData() {
        // Load scan data from scanManager
        const scans = Array.from(window.scanManager.activeScans.values());
        const history = window.scanManager.scanHistory;
        this.scanData = [...scans, ...history];

        // Process findings and generate recommendations
        this.processFindings();
        this.generateRecommendations();

        // Update the preview
        this.updatePreview();
    }

    processFindings() {
        this.findings = [];
        
        this.scanData.forEach(scan => {
            // Process endpoints
            if (scan.discoveredEndpoints) {
                this.findings.push({
                    type: 'asset',
                    severity: 'info',
                    title: 'Discovered Endpoints',
                    description: `${scan.discoveredEndpoints} endpoints found during the scan`,
                    target: scan.target
                });
            }

            // Process vulnerabilities (if any were detected during scan)
            if (scan.vulnerabilities) {
                scan.vulnerabilities.forEach(vuln => {
                    this.findings.push({
                        type: 'vulnerability',
                        severity: vuln.severity,
                        title: vuln.title,
                        description: vuln.description,
                        target: scan.target
                    });
                });
            }
        });
    }

    generateRecommendations() {
        this.recommendations = [];
        
        // Group findings by type and severity
        const findingGroups = this.findings.reduce((groups, finding) => {
            const key = `${finding.type}-${finding.severity}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(finding);
            return groups;
        }, {});

        // Generate recommendations based on findings
        Object.entries(findingGroups).forEach(([key, findings]) => {
            const [type, severity] = key.split('-');
            
            if (type === 'vulnerability' && severity === 'high') {
                this.recommendations.push({
                    priority: 'high',
                    title: 'Critical Security Updates Required',
                    description: 'Address high-severity vulnerabilities immediately',
                    items: findings.map(f => f.title)
                });
            }

            if (type === 'asset') {
                this.recommendations.push({
                    priority: 'medium',
                    title: 'Asset Management',
                    description: 'Implement proper asset tracking and management',
                    items: ['Document all discovered endpoints', 'Implement access controls', 'Regular asset audits']
                });
            }
        });
    }

    updatePreview() {
        this.updateScanDetails();
        this.updateFindings();
        this.updateRecommendations();
    }

    updateScanDetails() {
        const tbody = document.getElementById('scanDetailsList');
        if (!tbody) return;

        tbody.innerHTML = this.scanData.map(scan => `
            <tr class="border-t border-gray-800">
                <td class="py-3">${scan.name}</td>
                <td class="py-3">${scan.target}</td>
                <td class="py-3">${new Date(scan.startTime).toLocaleDateString()}</td>
                <td class="py-3">${this.calculateDuration(scan)}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded-full text-sm ${this.getStatusClass(scan.status)}">
                        ${scan.status}
                    </span>
                </td>
                <td class="py-3">${scan.discoveredEndpoints || 0}</td>
            </tr>
        `).join('');
    }

    updateFindings() {
        const container = document.getElementById('findingsList');
        if (!container) return;

        container.innerHTML = this.findings.map(finding => `
            <div class="flex items-start space-x-3 bg-${this.getSeverityColor(finding.severity)}-500/10 p-4 rounded-lg">
                <div class="bg-${this.getSeverityColor(finding.severity)}-500/20 p-2 rounded-lg">
                    <i class="${this.getFindingIcon(finding.type)} text-${this.getSeverityColor(finding.severity)}-500"></i>
                </div>
                <div>
                    <div class="flex items-center space-x-2">
                        <h4 class="font-medium">${finding.title}</h4>
                        <span class="px-2 py-0.5 text-xs rounded bg-${this.getSeverityColor(finding.severity)}-500/20 text-${this.getSeverityColor(finding.severity)}-400">
                            ${finding.severity}
                        </span>
                    </div>
                    <p class="text-sm text-gray-400 mt-1">${finding.description}</p>
                    <p class="text-sm text-gray-500 mt-1">Target: ${finding.target}</p>
                </div>
            </div>
        `).join('');
    }

    updateRecommendations() {
        const container = document.getElementById('recommendationsList');
        if (!container) return;

        container.innerHTML = this.recommendations.map(rec => `
            <div class="bg-gray-800/50 p-4 rounded-lg">
                <div class="flex items-center space-x-2 mb-2">
                    <h4 class="font-medium">${rec.title}</h4>
                    <span class="px-2 py-0.5 text-xs rounded bg-${this.getPriorityColor(rec.priority)}-500/20 text-${this.getPriorityColor(rec.priority)}-400">
                        ${rec.priority}
                    </span>
                </div>
                <p class="text-sm text-gray-400 mb-2">${rec.description}</p>
                <ul class="text-sm text-gray-500 space-y-1 ml-4">
                    ${rec.items.map(item => `<li>• ${item}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    async generateReport(sections) {
        try {
            // Show loading state
            const btn = document.getElementById('generateReportBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
            btn.disabled = true;

            // Prepare report data
            const reportData = {
                format: this.format,
                sections: sections,
                scans: this.scanData,
                findings: this.findings,
                recommendations: this.recommendations,
                timestamp: new Date().toISOString()
            };

            // Simulate report generation delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate file based on format
            switch (this.format) {
                case 'pdf':
                    this.generatePDF(reportData);
                    break;
                case 'html':
                    this.generateHTML(reportData);
                    break;
                case 'json':
                    this.generateJSON(reportData);
                    break;
            }

            // Show success message
            Utils.showToast('Report generated successfully', 'success');
        } catch (error) {
            Utils.showToast('Failed to generate report', 'error');
            console.error('Report generation error:', error);
        } finally {
            // Reset button state
            const btn = document.getElementById('generateReportBtn');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Helper methods
    calculateDuration(scan) {
        const start = new Date(scan.startTime);
        const end = scan.endTime ? new Date(scan.endTime) : new Date();
        const diff = Math.floor((end - start) / 1000); // seconds

        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    }

    getStatusClass(status) {
        const classes = {
            'completed': 'bg-green-500/20 text-green-400',
            'running': 'bg-blue-500/20 text-blue-400',
            'failed': 'bg-red-500/20 text-red-400'
        };
        return classes[status] || 'bg-gray-500/20 text-gray-400';
    }

    getSeverityColor(severity) {
        const colors = {
            'high': 'red',
            'medium': 'yellow',
            'low': 'blue',
            'info': 'purple'
        };
        return colors[severity] || 'blue';
    }

    getPriorityColor(priority) {
        return this.getSeverityColor(priority);
    }

    getFindingIcon(type) {
        const icons = {
            'vulnerability': 'fas fa-exclamation-triangle',
            'asset': 'fas fa-network-wired',
            'security': 'fas fa-shield-alt'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    setFormat(format) {
        this.format = format;
    }

    // Report generation methods (to be implemented based on your needs)
    generatePDF(data) {
        console.log('Generating PDF report:', data);
        // Implement PDF generation
    }

    generateHTML(data) {
        console.log('Generating HTML report:', data);
        // Implement HTML generation
    }

    generateJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `osint-pro-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize global report manager
window.reportManager = new ReportManager(); 