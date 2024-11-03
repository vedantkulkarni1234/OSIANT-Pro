class NotificationManager {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        this.unreadCount = 0;
        this.updateUnreadCount();
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.updateUnreadCount();
        this.updateNotificationBadge();
        
        // Show toast notification
        Utils.showToast(notification.message, notification.type);
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item card p-4 rounded-lg ${notification.read ? '' : 'notification-unread'}`;
        div.setAttribute('data-id', notification.id);
        div.setAttribute('data-type', notification.type);

        const iconClass = this.getIconClass(notification.type);
        const typeClass = this.getTypeClass(notification.type);

        div.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="${typeClass} p-3 rounded-lg">
                    <i class="${iconClass}"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-medium">${notification.title}</h3>
                        <span class="text-sm text-gray-400">${this.formatTimestamp(notification.timestamp)}</span>
                    </div>
                    <p class="text-gray-400">${notification.message}</p>
                    ${notification.details ? `<p class="text-sm text-gray-500 mt-2">${notification.details}</p>` : ''}
                </div>
                <button class="text-gray-400 hover:text-gray-300" onclick="window.notificationManager.removeNotification(${notification.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return div;
    }

    loadNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-bell-slash mb-2 text-2xl"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        this.notifications.forEach(notification => {
            container.appendChild(this.createNotificationElement(notification));
        });
    }

    filterNotifications(type) {
        const items = document.querySelectorAll('.notification-item');
        items.forEach(item => {
            if (type === 'all' || item.dataset.type === type) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
        this.updateUnreadCount();
        this.loadNotifications();
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateUnreadCount();
        this.loadNotifications();
    }

    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.updateUnreadCount();
        this.loadNotifications();
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.classList.toggle('hidden', this.unreadCount === 0);
        }
    }

    getIconClass(type) {
        const icons = {
            'alert': 'fas fa-exclamation-triangle',
            'scan': 'fas fa-search',
            'system': 'fas fa-cog',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-circle',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getTypeClass(type) {
        const classes = {
            'alert': 'bg-red-500/20 text-red-500',
            'scan': 'bg-blue-500/20 text-blue-500',
            'system': 'bg-yellow-500/20 text-yellow-500',
            'success': 'bg-green-500/20 text-green-500',
            'warning': 'bg-orange-500/20 text-orange-500',
            'info': 'bg-purple-500/20 text-purple-500'
        };
        return classes[type] || classes.info;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
        
        return date.toLocaleDateString();
    }

    getRecentAlerts(limit = 5) {
        return this.notifications
            .filter(notification => notification.type === 'alert' || notification.priority)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit)
            .map(alert => ({
                ...alert,
                priority: alert.priority || this.getPriorityFromType(alert.type),
                timestamp: alert.timestamp || new Date().toISOString()
            }));
    }

    getPriorityFromType(type) {
        const priorities = {
            'alert': 'High',
            'vulnerability': 'High',
            'security': 'Medium',
            'scan': 'Low',
            'info': 'Info'
        };
        return priorities[type] || 'Info';
    }
}

// Initialize global notification manager
window.notificationManager = new NotificationManager(); 