import Schema from '../schema/schema';
import createCreatives from './creatives';
import boolean from '../unit/boolean';
import VastError from '../error';

const _required = ['impression', 'error'];

/**
 * Has $type:
 * - inline
 * - wrapper
 */
class Ad extends Schema {
    constructor(tag) {
        super(tag, 'ad');

        // Add required keys
        _required.forEach((key) => {
            key = `$${key}`;
            if (!this[key]) {
                this[key] = [];
            }
        });

        this.$creatives = createCreatives(this.creatives());

        this.$redirects = 0;
    }

    /**
     * @return {Mixed}
     */
    id() {
        return this.$id;
    }

    /* Wrapper */

    /**
     * Vast redirect/follow URI.
     *
     * @return {String}
     */
    adTagUri() {
        return this.$vastadtaguri;
    }

    /**
     * @return {Boolean}
     */
    followAdditionalWrappers() {
        return boolean(this.$followadditionalwrappers, true);
    }

    /**
     * @return {Boolean}
     */
    allowMultipleAds() {
        return boolean(this.$allowmultipleads, false);
    }

    /**
     * @return {Boolean}
     */
    fallbackOnNoAd() {
        return boolean(this.$fallbackonnoad, false);
    }

    /* Inline */

    /**
     * Ad's system - required.
     *
     * @return {String}
     */
    adSystem() {
        return this.$adsystem;
    }

    /**
     * Ad's title - required.
     *
     * @return {String}
     */
    adTitle() {
        return this.$adtitle;
    }

    /**
     * Ad's description.
     *
     * @return {String}
     */
    description() {
        return this.$description;
    }

    /**
     * Survey URI.
     *
     * @return {String}
     */
    survey() {
        return this.$survey;
    }

    /**
     * Error URIs.
     *
     * @return {String}
     */
    error() {
        return this.$error;
    }

    /**
     * Impression URIs - required.
     *
     * @return {Array}
     */
    impression() {
        return this.$impression;
    }

    /**
     * Sequence number.
     *
     * @return {Integer|Boolean}
     */
    sequence() {
        if (!this.$sequence) {
            return false;
        }

        return parseInt(this.$sequence);
    }

    /**
     * Get creatives.
     *
     * @return {Creatives}
     */
    creatives() {
        return this.$creatives;
    }

    /**
     * Extensions.
     *
     * @return {Schema}
     */
    extensions() {
        return this.$extensions;
    }

    /** Helper methods */

    /**
     * Extend current Ad with given wrapper.
     *
     * @param {Ad} wrapper
     */
    extendWithWrapper(wrapper) {
        // add wrapper tracking for impression, error
        _required.forEach((key) => {
            key = `$${key}`;

            this[key].push(...wrapper[key]);
        });

        // add wrapper tracking for creatives
        const wrapperLinear = wrapper.creatives().withType('linear') || [];
        wrapperLinear.forEach((wrapperLinear) => {
            this.creatives().withType('linear').forEach((adLinear) => {
                adLinear.trackingEvents().add(
                    wrapperLinear.trackingEvents()
                );

                adLinear.videoClicks().add(
                    wrapperLinear.videoClicks()
                );
            });
        });

        // keep wrapper attributes
        ['redirects', 'fallbackonnoad'].forEach((key) => {
            key = `$${key}`;
            if (typeof wrapper[key] != 'undefined') {
                this[key] = wrapper[key];
            }
        });

        return this;
    }

    /**
     * Number of redirects.
     *
     * @return {Integer}
     */
    redirects() {
        return this.$redirects;
    }

    /**
     * Helper method.
     *
     * @returns {Ad}
     */
    addRedirect() {
        this.$redirects++;

        return this;
    }

    /**
     * Helper method.
     *
     * @param {Integer} limit
     *
     * @return {Boolean}
     */
    reachedRedirectsLimit(limit) {
        return this.redirects() >= parseInt(limit);
    }

    /**
     * Helper method.
     *
     * @param {Function} condition
     *
     * @return {Boolean}
     */
    someCreative(condition) {
        return this.creatives().one(condition);
    }
}

export default (tag) => {
    return new Ad(tag);
};
