import Schema from '../schema/schema';
import boolean from '../unit/boolean';

/**
 * Has $type:
 * - video/mp4
 * - ...
 */
class MediaFile extends Schema {
    constructor(tag) {
        super(tag, 'mediafile');

        this.$source = tag.tagValue();
    }

    /**
     * @return {Mixed}
     */
    id() {
        return this.$id;
    }

    /**
     * Media file URI - required.
     *
     * @return {String}
     */
    source() {
        return this.$source;
    }

    /**
     * progressive / streaming - required.
     *
     * @return {String}
     */
    delivery() {
        return this.$delivery;
    }

    /**
     * Helper method.
     *
     * @return {Boolean}
     */
    isProgressive() {
        return this.delivery() == 'progressive';
    }

    /**
     * Helper method.
     *
     * @return {Boolean}
     */
    isStreaming() {
        return this.delivery() == 'streaming';
    }

    /**
     * Bitrate in kbps.
     *
     * @return {Integer|Boolean}
     */
    bitrate() {
        if (!this.$bitrate) {
            return false;
        }

        return parseInt(this.$bitrate);
    }

    /**
     * Width in pixels - required.
     *
     * @return {Integer}
     */
    width() {
        return parseInt(this.$width);
    }

    /**
     * Height in pixels - required.
     *
     * @return {Integer}
     */
    height() {
        return parseInt(this.$height);
    }

    /**
     * Allows scalling or not.
     *
     * @return {Boolean}
     */
    scalable() {
        return boolean(this.$scalable, true);
    }

    /**
     * Keep ratio if scaled.
     *
     * @return {Boolean}
     */
    maintainAspectRatio() {
        return boolean(this.$maintainaspectratio, false);
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
}

export default (tag) => {
    return new MediaFile(tag);
};
