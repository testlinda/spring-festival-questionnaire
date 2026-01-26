/**
 * Dynamic Open Graph Tags Manager
 * Automatically sets og:url to current page URL for proper social media preview
 * This solves the issue where directory URLs don't show preview images
 */

(function() {
  'use strict';

  // Get current full URL
  const currentUrl = window.location.href;
  
  // Remove hash and query parameters for og:url (optional, keep them if needed)
  const baseUrl = window.location.origin + window.location.pathname;
  
  // Update og:url meta tag
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.setAttribute('content', baseUrl);
  }

  console.log('📱 OG Tags updated:', {
    'og:url': baseUrl,
    'current URL': currentUrl
  });

  // Optional: Log other OG tags for debugging
  const ogTags = {
    'og:title': document.querySelector('meta[property="og:title"]')?.content || 'N/A',
    'og:description': document.querySelector('meta[property="og:description"]')?.content || 'N/A',
    'og:image': document.querySelector('meta[property="og:image"]')?.content || 'N/A',
    'og:url': baseUrl
  };
  
  console.log('📋 All OG Tags:', ogTags);
})();
