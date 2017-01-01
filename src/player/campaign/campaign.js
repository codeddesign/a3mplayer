import Tag from './tag';
import macro from '../macro';
import { extend_object } from '../../utils/extend_object';

class Campaign {
    /**
     * Creates a Campaign with given response
     * of the request made to /campaign request.
     *
     * Info: assigns all data corresponding to response.campaign
     * directly in the Campaign (check 'extend_object()').
     *
     * @param {Object} response
     *
     * @return {Campaign}
     */
    constructor(response) {
        extend_object(this, response, ['campaign']);

        this.$nonguaranteed = [];
        this.$guaranteed = [];
        this.$loaded = [];

        this.separateTags()
            .sortTags();

        macro.setIp(this.ip());
    }

    /**
     * Loops through response tags and
     * creates an instance of Tag for each one.
     *
     * Based on tags' type guaranteed or not
     * it adds to it's specific list.
     *
     * @return {Campaign}
     */
    separateTags() {
        const nonguaranteed = [],
            guaranteed = [];

        this.$tags.forEach((tag, index) => {
            tag = new Tag(tag);

            if (tag.isGuaranteed()) {
                guaranteed.push(tag);

                return false;
            }

            nonguaranteed.push(tag);
        });

        this.$nonguaranteed = nonguaranteed;
        this.$guaranteed = guaranteed;

        return this;
    }

    /**
     * Sorts all tags and guaranteed ones
     * based on their type (check tag.priority()).
     *
     * @return {Campaign}
     */
    sortTags() {
        ['nonguaranteed', 'guaranteed'].forEach((key) => {
            const _by = (key == 'nonguaranteed') ? false : true;

            this[`$${key}`].sort((a, b) => {
                if (!b.priority(_by)) {
                    return false;
                }

                if (a.priority(_by) < b.priority(_by)) {
                    return false;
                }

                return true;
            });
        });

        return this;
    }

    /**
     * @return {String|Integer}
     */
    id() {
        return this.$id;
    }

    /**
     * @return {String}
     */
    ip() {
        return this.$ip;
    }

    /**
     * Returns guaranteed or
     * non-guaranteed tags.
     *
     * @return {Array}
     */
    tags() {
        if (this.hasGuarantees()) {
            return this.$guaranteed;
        }

        return this.$nonguaranteed;
    }

    /**
     * @return {Boolean}
     */
    hasGuarantees() {
        return this.$guaranteed.length;
    }

    /**
     * Loaded tags.
     *
     * @return {Array}
     */
    loaded() {
        return this.$loaded;
    }

    /**
     * Request campaign's tags.
     *
     * @return {Promise}
     */
    requestTags() {
        return new Promise((resolve, reject) => {
            const promises = [];

            this.tags().forEach((tag) => {
                if (tag.canBeLoaded()) {
                    promises.push(
                        tag.request()
                    );
                }
            });

            Promise.all(promises)
                .then((finished) => {
                    resolve(finished);
                })
                .catch((e) => {
                    console.error('tags all catch', e);
                });
        });
    }
}

export default Campaign;
