import { Machine } from './core/Machine.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { DataCounter } from './ui/DataCounter.js';

window.addEventListener('DOMContentLoaded', () => {
    console.log('Pachislot Simulator Initializing...');

    // Initialize Components
    const dataCounter = new DataCounter();
    const controlPanel = new ControlPanel();

    // Initialize Main Machine
    const machine = new Machine(controlPanel, dataCounter);

    // Start Game Loop
    machine.start();

    console.log('Initialization Complete.');
});
