// Script loader for options page
// Loads React scripts dynamically using chrome.runtime.getURL()

(function() {
    'use strict';

    // Load vendors script (React libraries)
    const vendorsScript = document.createElement('script');
    vendorsScript.src = chrome.runtime.getURL('vendors/vendors.js');
    vendorsScript.defer = true;
    document.head.appendChild(vendorsScript);

    // Load options script (React component)
    const optionsScript = document.createElement('script');
    optionsScript.src = chrome.runtime.getURL('options/options.js');
    optionsScript.defer = true;
    document.head.appendChild(optionsScript);

    console.log('UI Inspector options scripts loaded');
})();
