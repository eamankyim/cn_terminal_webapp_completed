/**
 * Socket.io service for emitting real-time events
 */

class SocketService {
  /**
   * Emit job created event
   */
  static emitJobCreated(job) {
    if (global.io) {
      global.io.emit('job:created', {
        job,
        timestamp: new Date().toISOString()
      });
      console.log('📡 [Socket] Emitted job:created event for job:', job.id);
    }
  }

  /**
   * Emit job updated event
   */
  static emitJobUpdated(job) {
    if (global.io) {
      global.io.emit('job:updated', {
        job,
        timestamp: new Date().toISOString()
      });
      console.log('📡 [Socket] Emitted job:updated event for job:', job.id);
    }
  }

  /**
   * Emit job deleted event
   */
  static emitJobDeleted(jobId) {
    if (global.io) {
      global.io.emit('job:deleted', {
        jobId,
        timestamp: new Date().toISOString()
      });
      console.log('📡 [Socket] Emitted job:deleted event for job:', jobId);
    }
  }

  /**
   * Emit job status updated event
   */
  static emitJobStatusUpdated(job) {
    if (global.io) {
      global.io.emit('job:status-updated', {
        job,
        timestamp: new Date().toISOString()
      });
      console.log('📡 [Socket] Emitted job:status-updated event for job:', job.id);
    }
  }

  /**
   * Emit job comment added event
   */
  static emitJobCommentAdded(jobId, comment) {
    if (global.io) {
      global.io.emit('job:comment-added', {
        jobId,
        comment,
        timestamp: new Date().toISOString()
      });
      console.log('📡 [Socket] Emitted job:comment-added event for job:', jobId);
    }
  }
}

module.exports = SocketService;

