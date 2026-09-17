const os = require('os');

/**
 * Common port-to-service name mapping
 */
const SERVICE_MAP = {
  20: 'FTP-Data',
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  993: 'IMAPS',
  995: 'POP3S',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP-Alt',
  8443: 'HTTPS-Alt',
  9090: 'WebMgmt',
  27017: 'MongoDB',
  3000: 'Node/Dev',
  5000: 'Flask/Dev',
  8000: 'HTTP-Alt',
  9200: 'Elasticsearch',
};

/**
 * Returns current platform: 'darwin', 'linux', or other
 */
function getPlatform() {
  return os.platform();
}

/**
 * Looks up service name for a port number
 */
function getServiceName(port) {
  return SERVICE_MAP[port] || 'Unknown';
}

/**
 * Formats a number of bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats a timestamp to log format: YYYY-MM-DD HH:MM:SS
 */
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = { getPlatform, getServiceName, SERVICE_MAP, formatBytes, timestamp };
