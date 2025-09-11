// Very simple test of imports
console.log('Starting import test...');

try {
  import('./config/GameConfig.js').then(config => {
    console.log('GameConfig loaded successfully:', config);
    document.body.innerHTML = 'GameConfig loaded: ' + JSON.stringify(Object.keys(config.GameConfig || config), null, 2);
  }).catch(err => {
    console.error('Error loading GameConfig:', err);
    document.body.innerHTML = 'Error: ' + err.message;
  });
} catch (err) {
  console.error('Synchronous error:', err);
  document.body.innerHTML = 'Sync Error: ' + err.message;
}