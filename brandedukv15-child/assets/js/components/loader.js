/**
 * ============================================
 * BRANDED UK - GLOBAL LOADER COMPONENT
 * ============================================
 * 
 * This file provides loader HTML templates and functions.
 * To change the loader animation, edit loader.css only.
 * 
 * Usage:
 *   1. Include loader.css in your page
 *   2. Include this loader.js
 *   3. Call BrandedLoader.show(containerId) or BrandedLoader.getHtml()
 * 
 * ============================================
 */

const BrandedLoader = {
    /**
     * Orbiting-squares markup (original index.html splash animation).
     * @returns {string}
     */
    getOrbitHtml: function() {
        return `
            <div class="branded-orbit-loader" aria-hidden="true">
                <span class="branded-orbit-1"></span>
                <span class="branded-orbit-2"></span>
                <span class="branded-orbit-3"></span>
                <span class="branded-orbit-4"></span>
            </div>
        `;
    },

    /**
     * Get the HTML for the loader animation
     * @param {string} text - Optional loading text (default: "Loading...")
     * @returns {string} HTML string for the loader
     */
    getHtml: function(text = 'Loading...') {
        return `
            <div class="products-loader">
                ${this.getOrbitHtml()}
                <div class="loader-text">${text}</div>
            </div>
        `;
    },

    /**
     * Get inline loader (smaller version for inline use)
     * @returns {string} HTML string for inline loader
     */
    getInlineHtml: function() {
        return `
            <div class="loader-container">
                ${this.getOrbitHtml()}
            </div>
        `;
    },

    /**
     * Show loader in a container
     * @param {string} containerId - The ID of the container element
     * @param {string} text - Optional loading text
     */
    show: function(containerId, text = 'Loading...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.getHtml(text);
        }
    },

    /**
     * Hide loader and clear container
     * @param {string} containerId - The ID of the container element
     */
    hide: function(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrandedLoader;
}
