const { v4: uuidv4 } = require('uuid');

class AuditService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  log(entry) {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      action: entry.action,
      employeeId: entry.employeeId || null,
      performedBy: entry.performedBy || null,
      targetEmployeeId: entry.targetEmployeeId || null,
      data: entry.data || {},
      ip: entry.ip || null,
      userAgent: entry.userAgent || null
    };

    this.logs.unshift(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    console.log(`[AUDIT] ${logEntry.timestamp} - ${logEntry.action}:`, logEntry);

    return logEntry;
  }

  getLogs(filters = {}) {
    let results = [...this.logs];

    if (filters.action) {
      results = results.filter(log => log.action === filters.action);
    }

    if (filters.employeeId) {
      results = results.filter(log => log.employeeId === filters.employeeId);
    }

    if (filters.performedBy) {
      results = results.filter(log => log.performedBy === filters.performedBy);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      results = results.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      results = results.filter(log => new Date(log.timestamp) <= endDate);
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  getLogsByEmployee(employeeId, limit = 100) {
    return this.logs
      .filter(log =>
        log.employeeId === employeeId ||
        log.performedBy === employeeId
      )
      .slice(0, limit);
  }

  getLogsByAction(action, limit = 100) {
    return this.logs
      .filter(log => log.action === action)
      .slice(0, limit);
  }

  clearLogs() {
    this.logs = [];
  }

  getLogStats() {
    const stats = {
      total: this.logs.length,
      byAction: {}
    };

    this.logs.forEach(log => {
      if (!stats.byAction[log.action]) {
        stats.byAction[log.action] = 0;
      }
      stats.byAction[log.action]++;
    });

    return stats;
  }
}

module.exports = new AuditService();
