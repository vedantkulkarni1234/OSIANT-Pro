from flask import Flask, send_from_directory, render_template, jsonify, request
import os
from datetime import datetime
import logging

app = Flask(__name__, static_folder='.')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='osint_server.log'
)

@app.route('/')
def index():
    """Serve the main index.html file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    """Serve static files"""
    return send_from_directory('.', path)

@app.route('/api/placeholder/<width>/<height>')
def placeholder_image(width, height):
    """Redirect to a placeholder image service"""
    return f'https://via.placeholder.com/{width}x{height}'

@app.route('/api/health')
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/stats')
def get_stats():
    """Get server statistics"""
    return jsonify({
        'uptime': '0h 0m',  # You can implement real uptime tracking
        'active_users': 0,  # Implement user tracking if needed
        'total_scans': 0,   # Implement scan counting
        'server_time': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    logging.warning(f'404 error: {request.url}')
    return jsonify({
        'error': 'Resource not found',
        'path': request.path
    }), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    logging.error(f'Server error: {str(e)}')
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500

def fix_file_paths():
    """Fix file paths in HTML files"""
    html_files = ['index.html', 'login.html', 'Dashbord.html', 'new_scan.html', 
                 'notifications.html', 'export_report.html']
    
    for filename in html_files:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Fix absolute Windows paths
            content = content.replace('C:\\Users\\vedku\\OneDrive\\Desktop\\Dashboard_Tool\\', '/')
            
            # Fix relative paths
            content = content.replace('src="/', 'src="/api/')
            
            with open(filename, 'w', encoding='utf-8') as file:
                file.write(content)
            
            logging.info(f'Fixed paths in {filename}')

if __name__ == '__main__':
    # Configuration
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Fix file paths before starting server
    fix_file_paths()
    
    # Log startup
    logging.info(f'Starting OSINT Pro server on port {PORT}')
    
    # Start server
    app.run(
        host='0.0.0.0',  # Makes the server publicly available
        port=PORT,
        debug=DEBUG
    ) 