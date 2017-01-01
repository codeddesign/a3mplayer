import Schema from '../schema/schema';
import createAds from './ads';
import VastError from '../error';

const vast_versions = new Set([1, 2, 3, 4]);

class Vast extends Schema {
    constructor(tag) {
        super(tag, 'vast');

        if (!vast_versions.has(this.version())) {
            throw new VastError(102);
        }

        let ads = this.valuesWithTagName('ad') || [];
        ads.forEach((ad, index) => {
            if (!ad.type()) {
                delete ads[index];
            }
        });

        this.$ads = createAds(ads);
    }

    /**
     * Vast's version
     *
     * @return {Integer}
     */
    version() {
        return parseInt(this.$version);
    }

    /**
     * Get ads.
     *
     * @return {Ads}
     */
    ads() {
        return this.$ads;
    }

    /**
     * @return {Boolean}
     */
    hasSequence() {
        let sequence = false;
        this.ads().some((ad) => {
            if (ad.sequence()) {
                sequence = true;
            }
        });

        return sequence;
    }

    /**
     * @return {Boolean}
     */
    hasFallback() {
        let fallback = false;
        this.ads().some((ad) => {
            if (ad.fallbackOnNoAd()) {
                fallback = true;
            }
        });

        return fallback;
    }

    /**
     * @return {Boolean}
     */
    hasLinear() {
        let linear = false;
        this.ads().some((ad) => {
            if (ad.creatives().withType('linear')) {
                linear = true;
            }
        });

        return linear;
    }

    /**
     * @return {Boolean}
     */
    hasAds() {
        return !this.ads().isEmpty();
    }

    /**
     * Helper method.
     *
     * @param {Function} condition
     *
     * @return {Boolean}
     */
    someAd(condition) {
        return this.ads().one(condition);
    }
};

export default (tag) => {
    return new Vast(tag);
};
