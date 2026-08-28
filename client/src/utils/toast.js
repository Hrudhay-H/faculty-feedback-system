// Simple event-emitter for toast notifications
const listeners = new Set();

export const toast = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  show(message, type = 'success', duration = 3000) {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    listeners.forEach((listener) => listener({ id, message, type, duration }));
    return id;
  },
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  error(message, duration) {
    return this.show(message, 'danger', duration);
  },
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};
