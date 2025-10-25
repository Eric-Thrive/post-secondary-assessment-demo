// Force environment switch and clear cached data
console.log('🔄 Forcing environment switch to post-secondary-demo...');

// Clear all relevant localStorage keys
localStorage.setItem('app-environment', 'post-secondary-demo');
localStorage.setItem('activeModule', 'post_secondary');

// Clear any other cached data that might cause conflicts
localStorage.removeItem('selectedCaseId');
localStorage.removeItem('currentCase');

console.log('✅ Environment switched to post-secondary-demo');
console.log('✅ Module set to post_secondary');
console.log('🔄 Reloading page to ensure clean state...');

// Force page reload to clear all cached component state
window.location.reload();