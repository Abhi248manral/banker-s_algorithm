// Banker's Algorithm Implementation

class BankerAlgorithm {
  constructor() {
    this.processes = 0;
    this.resources = 0;
    this.available = [];
    this.max = [];
    this.allocation = [];
    this.need = [];
  }

  initialize(processes, resources) {
    this.processes = processes;
    this.resources = resources;
    this.available = new Array(resources).fill(0);
    this.max = Array.from({ length: processes }, () => new Array(resources).fill(0));
    this.allocation = Array.from({ length: processes }, () => new Array(resources).fill(0));
    this.need = Array.from({ length: processes }, () => new Array(resources).fill(0));
  }

  setAvailable(values) {
    this.available = [...values];
  }

  setMax(processIndex, values) {
    this.max[processIndex] = [...values];
    this.calculateNeed(processIndex);
  }

  setAllocation(processIndex, values) {
    this.allocation[processIndex] = [...values];
    this.calculateNeed(processIndex);
  }

  calculateNeed(processIndex) {
    for (let j = 0; j < this.resources; j++) {
      this.need[processIndex][j] = this.max[processIndex][j] - this.allocation[processIndex][j];
    }
  }

  calculateAllNeeds() {
    for (let i = 0; i < this.processes; i++) {
      this.calculateNeed(i);
    }
  }

  // Check if request is less than or equal to vector
  vectorLessOrEqual(v1, v2) {
    for (let i = 0; i < v1.length; i++) {
      if (v1[i] > v2[i]) return false;
    }
    return true;
  }

  // Add two vectors
  vectorAdd(v1, v2) {
    return v1.map((val, i) => val + v2[i]);
  }

  // Subtract two vectors
  vectorSubtract(v1, v2) {
    return v1.map((val, i) => val - v2[i]);
  }

  // Safety Algorithm
  checkSafety(stepByStep = false) {
    const work = [...this.available];
    const finish = new Array(this.processes).fill(false);
    const safeSequence = [];
    const steps = [];

    if (stepByStep) {
      steps.push({
        step: 0,
        description: 'Initialize Work = Available, Finish[i] = false',
        work: [...work],
        finish: [...finish],
        safeSequence: []
      });
    }

    let found = true;
    let iteration = 0;

    while (found && safeSequence.length < this.processes) {
      found = false;
      iteration++;

      for (let i = 0; i < this.processes; i++) {
        if (!finish[i] && this.vectorLessOrEqual(this.need[i], work)) {
          // Process i can be allocated
          for (let j = 0; j < this.resources; j++) {
            work[j] += this.allocation[i][j];
          }
          finish[i] = true;
          safeSequence.push(i);
          found = true;

          if (stepByStep) {
            steps.push({
              step: iteration,
              processIndex: i,
              description: `Process P${i} can finish. Need[${i}] ≤ Work`,
              work: [...work],
              finish: [...finish],
              safeSequence: [...safeSequence]
            });
          }
          break;
        }
      }
    }

    const isSafe = safeSequence.length === this.processes;

    if (stepByStep) {
      steps.push({
        step: iteration + 1,
        description: isSafe ? 'System is in SAFE state' : 'System is in UNSAFE state',
        work: [...work],
        finish: [...finish],
        safeSequence: [...safeSequence],
        isSafe
      });
    }

    return {
      isSafe,
      safeSequence,
      steps
    };
  }

  // Resource Request Algorithm
  requestResources(processIndex, request) {
    // Step 1: Check if request <= need
    if (!this.vectorLessOrEqual(request, this.need[processIndex])) {
      return {
        approved: false,
        reason: 'request_exceeds',
        message: 'Request exceeds maximum claim (Need)'
      };
    }

    // Step 2: Check if request <= available
    if (!this.vectorLessOrEqual(request, this.available)) {
      return {
        approved: false,
        reason: 'insufficient_resources',
        message: 'Insufficient resources available'
      };
    }

    // Step 3: Pretend to allocate
    const originalAvailable = [...this.available];
    const originalAllocation = [...this.allocation[processIndex]];
    const originalNeed = [...this.need[processIndex]];

    this.available = this.vectorSubtract(this.available, request);
    this.allocation[processIndex] = this.vectorAdd(this.allocation[processIndex], request);
    this.need[processIndex] = this.vectorSubtract(this.need[processIndex], request);

    // Step 4: Run safety algorithm
    const safetyResult = this.checkSafety();

    if (safetyResult.isSafe) {
      // Commit the allocation
      return {
        approved: true,
        reason: 'safe',
        message: 'Request approved - system remains safe',
        safeSequence: safetyResult.safeSequence
      };
    } else {
      // Rollback
      this.available = originalAvailable;
      this.allocation[processIndex] = originalAllocation;
      this.need[processIndex] = originalNeed;

      return {
        approved: false,
        reason: 'unsafe',
        message: 'Request denied - would lead to unsafe state',
        safeSequence: []
      };
    }
  }

  // Export state to JSON
  exportJSON() {
    return JSON.stringify({
      processes: this.processes,
      resources: this.resources,
      available: this.available,
      max: this.max,
      allocation: this.allocation,
      need: this.need
    }, null, 2);
  }

  // Import state from JSON
  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.processes = data.processes;
      this.resources = data.resources;
      this.available = data.available;
      this.max = data.max;
      this.allocation = data.allocation;
      this.need = data.need;
      return true;
    } catch (e) {
      console.error('Error importing JSON:', e);
      return false;
    }
  }

  // Export to CSV format
  exportCSV() {
    let csv = 'Matrix,Process,';
    for (let j = 0; j < this.resources; j++) {
      csv += `R${j},`;
    }
    csv += '\n';

    // Available
    csv += 'Available,-,';
    csv += this.available.join(',') + '\n';

    // Max
    for (let i = 0; i < this.processes; i++) {
      csv += `Max,P${i},${this.max[i].join(',')}\n`;
    }

    // Allocation
    for (let i = 0; i < this.processes; i++) {
      csv += `Allocation,P${i},${this.allocation[i].join(',')}\n`;
    }

    // Need
    for (let i = 0; i < this.processes; i++) {
      csv += `Need,P${i},${this.need[i].join(',')}\n`;
    }

    return csv;
  }

  // Clone current state
  clone() {
    const cloned = new BankerAlgorithm();
    cloned.processes = this.processes;
    cloned.resources = this.resources;
    cloned.available = [...this.available];
    cloned.max = this.max.map(row => [...row]);
    cloned.allocation = this.allocation.map(row => [...row]);
    cloned.need = this.need.map(row => [...row]);
    return cloned;
  }
}

// Demo scenarios
const demoScenarios = [
  {
    name: 'Safe State Example 1',
    processes: 5,
    resources: 3,
    available: [3, 3, 2],
    max: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ]
  },
  {
    name: 'Unsafe State Example',
    processes: 3,
    resources: 2,
    available: [0, 0],
    max: [
      [3, 3],
      [2, 2],
      [2, 2]
    ],
    allocation: [
      [2, 2],
      [1, 1],
      [1, 1]
    ]
  },
  {
    name: 'Banking Scenario - Safe Loans',
    type: 'banking',
    processes: 4,
    resources: 3,
    available: [500000, 300000, 200000],
    max: [
      [300000, 100000, 50000],
      [200000, 150000, 75000],
      [400000, 80000, 30000],
      [250000, 120000, 60000]
    ],
    allocation: [
      [100000, 50000, 20000],
      [150000, 80000, 40000],
      [200000, 30000, 10000],
      [100000, 60000, 30000]
    ]
  }
];

window.BankerAlgorithm = BankerAlgorithm;
window.demoScenarios = demoScenarios;