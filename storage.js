// LocalStorage wrapper to simulate MongoDB persistence

class StorageManager {
  constructor() {
    this.prefix = 'banker_';
    // Use in-memory storage instead of localStorage
    if (!window._appStorage) {
      window._appStorage = {
        preferences: this.getDefaultPreferences(),
        scenarios: [],
        currentState: null
      };
    }
  }

  // Save user preferences
  savePreferences(preferences) {
    try {
      window._appStorage.preferences = preferences;
      return true;
    } catch (e) {
      console.error('Error saving preferences:', e);
      return false;
    }
  }

  // Load user preferences
  loadPreferences() {
    try {
      return window._appStorage.preferences || this.getDefaultPreferences();
    } catch (e) {
      console.error('Error loading preferences:', e);
      return this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      theme: 'light',
      language: 'en',
      reduceMotion: false,
      lowSpecMode: false,
      fontSize: 'medium'
    };
  }

  // Save scenario
  saveScenario(name, banker) {
    try {
      const scenarios = this.loadScenarios();
      const scenario = {
        id: Date.now(),
        name: name,
        timestamp: new Date().toISOString(),
        data: {
          processes: banker.processes,
          resources: banker.resources,
          available: banker.available,
          max: banker.max,
          allocation: banker.allocation,
          need: banker.need
        }
      };
      scenarios.push(scenario);
      window._appStorage.scenarios = scenarios;
      return true;
    } catch (e) {
      console.error('Error saving scenario:', e);
      return false;
    }
  }

  // Load all scenarios
  loadScenarios() {
    try {
      return window._appStorage.scenarios || [];
    } catch (e) {
      console.error('Error loading scenarios:', e);
      return [];
    }
  }

  // Delete scenario
  deleteScenario(id) {
    try {
      const scenarios = this.loadScenarios();
      const filtered = scenarios.filter(s => s.id !== id);
      window._appStorage.scenarios = filtered;
      return true;
    } catch (e) {
      console.error('Error deleting scenario:', e);
      return false;
    }
  }

  // Save current state
  saveCurrentState(banker) {
    try {
      const state = {
        processes: banker.processes,
        resources: banker.resources,
        available: banker.available,
        max: banker.max,
        allocation: banker.allocation,
        need: banker.need
      };
      window._appStorage.currentState = state;
      return true;
    } catch (e) {
      console.error('Error saving current state:', e);
      return false;
    }
  }

  // Load current state
  loadCurrentState() {
    try {
      return window._appStorage.currentState || null;
    } catch (e) {
      console.error('Error loading current state:', e);
      return null;
    }
  }

  // Clear all data
  clearAll() {
    try {
      window._appStorage = {
        preferences: this.getDefaultPreferences(),
        scenarios: [],
        currentState: null
      };
      return true;
    } catch (e) {
      console.error('Error clearing data:', e);
      return false;
    }
  }

  // Generate shareable URL state
  generateShareURL(banker) {
    const state = {
      p: banker.processes,
      r: banker.resources,
      a: banker.available,
      m: banker.max,
      al: banker.allocation
    };
    const encoded = btoa(JSON.stringify(state));
    return `${window.location.origin}${window.location.pathname}?state=${encoded}`;
  }

  // Parse state from URL
  parseURLState() {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    if (!stateParam) return null;

    try {
      const decoded = atob(stateParam);
      const state = JSON.parse(decoded);
      return {
        processes: state.p,
        resources: state.r,
        available: state.a,
        max: state.m,
        allocation: state.al
      };
    } catch (e) {
      console.error('Error parsing URL state:', e);
      return null;
    }
  }
}

window.StorageManager = StorageManager;
window.storage = new StorageManager();