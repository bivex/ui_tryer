/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T11:01:05
 * Last Updated: 2025-12-22T11:09:23
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

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
