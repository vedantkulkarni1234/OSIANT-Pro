function initializeCharts() {
    // Scan Activity Chart
    const scanActivityCtx = document.getElementById('scanActivityChart')?.getContext('2d');
    if (scanActivityCtx) {
        new Chart(scanActivityCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Scans',
                    data: [5, 8, 12, 7, 9, 15, 10],
                    borderColor: '#3b82f6',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Security Score Chart
    const securityScoreCtx = document.getElementById('securityScoreChart')?.getContext('2d');
    if (securityScoreCtx) {
        new Chart(securityScoreCtx, {
            type: 'doughnut',
            data: {
                labels: ['Secure', 'At Risk'],
                datasets: [{
                    data: [82, 18],
                    backgroundColor: ['#10b981', '#6b7280']
                }]
            },
            options: {
                responsive: true,
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Asset Distribution Chart
    const assetDistributionCtx = document.getElementById('assetDistributionChart')?.getContext('2d');
    if (assetDistributionCtx) {
        new Chart(assetDistributionCtx, {
            type: 'bar',
            data: {
                labels: ['Endpoints', 'Servers', 'Databases', 'Services'],
                datasets: [{
                    data: [45, 25, 15, 35],
                    backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
} 