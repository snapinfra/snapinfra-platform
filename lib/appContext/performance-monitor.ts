/**
 * Performance monitoring for hybrid storage system
 * Tracks metrics to optimize sync strategy
 */

interface PerformanceMetrics {
  localStorage: {
    reads: number;
    writes: number;
    failures: number;
    avgReadTime: number;
    avgWriteTime: number;
  };
  dynamodb: {
    reads: number;
    writes: number;
    failures: number;
    avgReadTime: number;
    avgWriteTime: number;
    batchWrites: number;
    queueSize: number;
  };
  sync: {
    totalSyncs: number;
    failedSyncs: number;
    avgSyncTime: number;
    lastSyncTime: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    localStorage: {
      reads: 0,
      writes: 0,
      failures: 0,
      avgReadTime: 0,
      avgWriteTime: 0
    },
    dynamodb: {
      reads: 0,
      writes: 0,
      failures: 0,
      avgReadTime: 0,
      avgWriteTime: 0,
      batchWrites: 0,
      queueSize: 0
    },
    sync: {
      totalSyncs: 0,
      failedSyncs: 0,
      avgSyncTime: 0,
      lastSyncTime: 0
    }
  };

  private readTimes: number[] = [];
  private writeTimes: number[] = [];
  private syncTimes: number[] = [];

  // Track localStorage read
  trackLocalStorageRead(duration: number, success: boolean) {
    this.metrics.localStorage.reads++;
    if (!success) this.metrics.localStorage.failures++;
    
    this.readTimes.push(duration);
    if (this.readTimes.length > 100) this.readTimes.shift();
    
    this.metrics.localStorage.avgReadTime = 
      this.readTimes.reduce((a, b) => a + b, 0) / this.readTimes.length;
  }

  // Track localStorage write
  trackLocalStorageWrite(duration: number, success: boolean) {
    this.metrics.localStorage.writes++;
    if (!success) this.metrics.localStorage.failures++;
    
    this.writeTimes.push(duration);
    if (this.writeTimes.length > 100) this.writeTimes.shift();
    
    this.metrics.localStorage.avgWriteTime = 
      this.writeTimes.reduce((a, b) => a + b, 0) / this.writeTimes.length;
  }

  // Track DynamoDB operations
  trackDynamoDBRead(duration: number, success: boolean) {
    this.metrics.dynamodb.reads++;
    if (!success) this.metrics.dynamodb.failures++;
    
    this.readTimes.push(duration);
    this.metrics.dynamodb.avgReadTime = 
      this.readTimes.reduce((a, b) => a + b, 0) / this.readTimes.length;
  }

  trackDynamoDBWrite(duration: number, success: boolean, itemCount: number = 1) {
    this.metrics.dynamodb.writes += itemCount;
    if (!success) this.metrics.dynamodb.failures++;
    
    if (itemCount > 1) {
      this.metrics.dynamodb.batchWrites++;
    }
    
    this.writeTimes.push(duration);
    this.metrics.dynamodb.avgWriteTime = 
      this.writeTimes.reduce((a, b) => a + b, 0) / this.writeTimes.length;
  }

  // Track sync operations
  trackSync(duration: number, success: boolean) {
    this.metrics.sync.totalSyncs++;
    if (!success) this.metrics.sync.failedSyncs++;
    
    this.syncTimes.push(duration);
    if (this.syncTimes.length > 50) this.syncTimes.shift();
    
    this.metrics.sync.avgSyncTime = 
      this.syncTimes.reduce((a, b) => a + b, 0) / this.syncTimes.length;
    
    this.metrics.sync.lastSyncTime = Date.now();
  }

  // Update queue size
  updateQueueSize(size: number) {
    this.metrics.dynamodb.queueSize = size;
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance summary
  getSummary() {
    const metrics = this.getMetrics();
    
    return {
      // Cache hit rate (localStorage reads vs DynamoDB reads)
      cacheHitRate: metrics.localStorage.reads > 0
        ? ((metrics.localStorage.reads / (metrics.localStorage.reads + metrics.dynamodb.reads)) * 100).toFixed(2) + '%'
        : '0%',
      
      // Failure rate
      failureRate: (metrics.localStorage.failures + metrics.dynamodb.failures) > 0
        ? (((metrics.localStorage.failures + metrics.dynamodb.failures) / 
            (metrics.localStorage.reads + metrics.localStorage.writes + 
             metrics.dynamodb.reads + metrics.dynamodb.writes)) * 100).toFixed(2) + '%'
        : '0%',
      
      // Average response times
      avgLocalStorageTime: metrics.localStorage.avgReadTime.toFixed(2) + 'ms',
      avgDynamoDBTime: metrics.dynamodb.avgReadTime.toFixed(2) + 'ms',
      avgSyncTime: metrics.sync.avgSyncTime.toFixed(2) + 'ms',
      
      // Sync efficiency
      syncSuccessRate: metrics.sync.totalSyncs > 0
        ? (((metrics.sync.totalSyncs - metrics.sync.failedSyncs) / metrics.sync.totalSyncs) * 100).toFixed(2) + '%'
        : '100%',
      
      // Current state
      queueSize: metrics.dynamodb.queueSize,
      lastSync: metrics.sync.lastSyncTime > 0
        ? new Date(metrics.sync.lastSyncTime).toISOString()
        : 'Never',
      
      // Cost estimation (rough)
      estimatedMonthlyCost: this.estimateMonthlyCost(metrics)
    };
  }

  // Estimate monthly DynamoDB cost
  private estimateMonthlyCost(metrics: PerformanceMetrics): string {
    // DynamoDB On-Demand pricing (approximate)
    const WRITE_COST_PER_MILLION = 1.25; // $1.25 per million writes
    const READ_COST_PER_MILLION = 0.25;  // $0.25 per million reads
    
    // Extrapolate to monthly
    const hoursElapsed = (Date.now() - metrics.sync.lastSyncTime) / (1000 * 60 * 60);
    const extrapolationFactor = (30 * 24) / Math.max(hoursElapsed, 1);
    
    const monthlyWrites = metrics.dynamodb.writes * extrapolationFactor;
    const monthlyReads = metrics.dynamodb.reads * extrapolationFactor;
    
    const writeCost = (monthlyWrites / 1000000) * WRITE_COST_PER_MILLION;
    const readCost = (monthlyReads / 1000000) * READ_COST_PER_MILLION;
    
    const totalCost = writeCost + readCost;
    
    return `$${totalCost.toFixed(2)}/month (${monthlyWrites.toFixed(0)} writes, ${monthlyReads.toFixed(0)} reads)`;
  }

  // Reset metrics
  reset() {
    this.metrics = {
      localStorage: {
        reads: 0,
        writes: 0,
        failures: 0,
        avgReadTime: 0,
        avgWriteTime: 0
      },
      dynamodb: {
        reads: 0,
        writes: 0,
        failures: 0,
        avgReadTime: 0,
        avgWriteTime: 0,
        batchWrites: 0,
        queueSize: 0
      },
      sync: {
        totalSyncs: 0,
        failedSyncs: 0,
        avgSyncTime: 0,
        lastSyncTime: 0
      }
    };
    
    this.readTimes = [];
    this.writeTimes = [];
    this.syncTimes = [];
  }

  // Log summary to console
  logSummary() {
    const summary = this.getSummary();
    
    console.group('📊 Hybrid Storage Performance');
    console.log('Cache Hit Rate:', summary.cacheHitRate);
    console.log('Failure Rate:', summary.failureRate);
    console.log('Avg Response Times:', {
      localStorage: summary.avgLocalStorageTime,
      dynamoDB: summary.avgDynamoDBTime,
      sync: summary.avgSyncTime
    });
    console.log('Sync Success Rate:', summary.syncSuccessRate);
    console.log('Queue Size:', summary.queueSize);
    console.log('Last Sync:', summary.lastSync);
    console.log('Estimated Cost:', summary.estimatedMonthlyCost);
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState(performanceMonitor.getMetrics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    summary: performanceMonitor.getSummary(),
    reset: () => performanceMonitor.reset(),
    logSummary: () => performanceMonitor.logSummary()
  };
}

// Utility to measure async operations
export async function measureAsync<T>(
  operation: () => Promise<T>,
  onComplete: (duration: number, success: boolean) => void
): Promise<T> {
  const start = performance.now();
  let success = true;
  
  try {
    const result = await operation();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - start;
    onComplete(duration, success);
  }
}

// Utility to measure sync operations
export function measureSync<T>(
  operation: () => T,
  onComplete: (duration: number, success: boolean) => void
): T {
  const start = performance.now();
  let success = true;
  
  try {
    const result = operation();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - start;
    onComplete(duration, success);
  }
}