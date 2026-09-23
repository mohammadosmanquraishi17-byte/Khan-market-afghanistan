import { aiControlCenter } from './ai/index.js';

export * from './ai/index.js';

const health = aiControlCenter.healthCheck();

console.log('Khan Market Afghanistan AI Core initialized');
console.log(JSON.stringify(health, null, 2));
