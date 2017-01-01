import Schema from '../schema/schema';
import createMediaFiles from './mediafiles';
import createTrackingEvents from './trackingevents';
import createVideoClicks from './videoclicks';
import seconds from '../unit/seconds';
import offset from '../unit/offset';

/**
 * Has $type:
 * - linear
 * - nonlinearads
 * - companionads
 */
class Creative extends Schema {
    constructor(tag) {
            super(tag, 'creative');

            if (this.isLinear()) {
                this.$mediafiles = createMediaFiles(this.mediaFiles());

                this.$trackingevents = createTrackingEvents(
                    this.trackingEvents(),
                    this.duration(false)
                );

                this.$videoclicks = createVideoClicks(this.videoClicks());

                return this;
            }
        }
        /**
         * @return {Mixed}
         */
    id() {
        return this.$id;
    }

    /* Linear */

    /**
     * Return offset when it's skippable
     * or strict false if it's not.
     *
     * @return {Integer|Boolean}
     */
    skipOffset() {
        if (this.isSkippable()) {
            return offset(this.duration(), this.$skipoffset);
        }

        return false;
    }

    /**
     * Helper method.
     *
     * @return {Boolean}
     */
    isSkippable() {
        return (this.$skipoffset) ? true : false;
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
     * Duration in format hh:mm:ss / ss - required.
     *
     * @param {Boolean} inSeconds
     *
     * @return {Integer|String}
     */
    duration(inSeconds = true) {
        const duration = this.$duration || '00:00:00';

        if (!inSeconds) {
            return duration;
        }

        return seconds(duration).toInteger();
    }

    /**
     * Tracking events list.
     *
     * @return {TrackingEvents}
     */
    trackingEvents() {
        return this.$trackingevents;
    }

    /**
     * Helper method.
     *
     * @param {String} name
     *
     * @return {Array|Object}
     */
    trackingEvent(name = '') {
        name = name.toLowerCase();

        name = `$${name}`;

        return this.trackingEvents()[name] || [];
    }

    /**
     * @param {Integer} _second
     *
     * @return {Array}
     */
    trackingEventProgress(_second) {
        _second = Math.floor(_second);

        return this.trackingEvent('progress')[_second] || [];
    }

    /**
     * Data for the video ad (URI's query).
     *
     * @return {String}
     */
    adParameters() {
        return this.$adparameters;
    }

    /**
     * Video clicks URIs.
     *
     * @return {VideoClicks}
     */
    videoClicks() {
        return this.$videoclicks;
    }

    /**
     * Helper method.
     *
     * @return {VideoClicks}
     */
    videoClick(name = '') {
        name = name.toLowerCase();

        name = `$${name}`;

        return this.videoClicks()[name];
    }

    /**
     * Helper method.
     *
     * @return {String|Boolean}
     */
    clickThrough() {
        return this.videoClicks().clickThrough();
    }

    /**
     * Get media files.
     *
     * @return {Array}
     */
    mediaFiles() {
        return this.$mediafiles;
    }

    /**
     * Method to use for communicated
     * if media file is interactive.
     *
     * @return {String|Boolean}
     */
    apiFramework() {
        if (!this.$apiframework) {
            return false;
        }

        return this.$apiframework;
    }

    /***
     * @return {Boolean}
     */
    isLinear() {
        return this.hasType('linear');
    }

    /**
     * Helper method.
     *
     * @return {Boolean}
     */
    isVPAID() {
        if (!this.apiFramework()) {
            return false;
        }

        return this.apiFramework().toUpperCase() == 'VPAID';
    }

    /**
     * Helper method.
     *
     * @param {Function} condition
     *
     * @return {Boolean}
     */
    someMediaFile(condition) {
        return this.mediaFiles().one(condition);
    }
}

export default (tag) => {
    return new Creative(tag);
};
