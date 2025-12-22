/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-22T07:41:07
 * Last Updated: 2025-12-22T11:09:23
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

// Script loader for popup
// Loads React scripts dynamically using chrome.runtime.getURL()

(function() {
    'use strict';

    // Load vendors script (React libraries)
    const vendorsScript = document.createElement('script');
    vendorsScript.src = chrome.runtime.getURL('vendors/vendors.js');
    vendorsScript.defer = true;
    document.head.appendChild(vendorsScript);

    // Load popup script (React component)
    const popupScript = document.createElement('script');
    popupScript.src = chrome.runtime.getURL('popup/popup.js');
    popupScript.defer = true;
    document.head.appendChild(popupScript);

    console.log('UI Inspector popup scripts loaded');
})();
