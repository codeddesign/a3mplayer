import { request_tag } from '../request';
import macro from '../macro';
import { track } from '../manager/tracker';
import VastError from '../../vast/error';
import device from '../../utils/device';
import { extend_object } from '../../utils/extend_object';

class Tag {
    /**
     * Creates Tag with given information
     * received after a /campaign request.
     *
     * @param {Object} info
     * @param {Campaign} campaign
     *
     * @return {Tag}
     */
    constructor(info, campaign) {
        extend_object(this, info);

        this.$campaign = campaign;

        this.$vast = false;
        this.$failed = false;

        this.$attempts = 0;
    }

    /**
     * Resets tag.
     *
     * @return {Tag}
     */
    reset() {
        this.$vast = false;
        this.$failed = false;

        return this;
    }

    /**
     * @return {Campaign}
     */
    campaign() {
        return this.$campaign;
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
    uri() {
        return macro.uri(this.$url);
    }

    /**
     * It returns Vast object if it succeded
     * or Boolean 'false'.
     *
     * @return {Vast|Boolean}
     */
    vast() {
        return this.$vast;
    }

    /**
     * @param {Boolean} byGuarantee
     *
     * @return {Integer}
     */
    priority(byGuarantee = false) {
        if (!byGuarantee) {
            return this.$priority_count;
        }

        return this.$guarantee_order;
    }

    /**
     * Delay time in milliseconds.
     *
     * @return {Integer}
     */
    delay() {
        const delay = parseInt(this.$delay_time);

        return delay * 1000;
    }

    /**
     * @return {Boolean}
     */
    isGuaranteed() {
        return this.$guaranteed;
    }

    /**
     * @return {Boolean}
     */
    isActive() {
        return this.$active;
    }

    /**
     * @return {Boolean}
     */
    forMobile() {
        return this.$platform_type == 'mobile';
    }

    /**
     * @return {Boolean}
     */
    canBeLoaded() {
        if (!this.isActive()) {
            return false;
        }

        if (this.forMobile() && !device.mobile()) {
            return false;
        }

        return true;
    }

    /**
     * It returns a 'string' that has the error, when it fails;
     * otherwise it returns boolean 'false'.
     *
     * @return {Boolean|String}
     */
    failed() {
        return this.$failed;
    }

    /**
     * True when all ads where played.
     *
     * @return {Boolean}
     */
    finished() {
        let finished = true;

        if (!this.vast()) {
            return finished;
        }

        this.vast().ads().forEach((ad) => {
            if (!ad._played) {
                finished = false;
            }
        });

        return finished;
    }

    /**s
     * Number of load attempts.
     *
     * @return {Integer}
     */
    attempts() {
        return this.$attempts;
    }

    vastError(code, info) {
        this.$failed = new VastError(code, info);

        console.error(this.failed());

        track().tagEvent(this.id(), code);

        return this;
    }

    /**
     * Makes a request to given tag.
     *
     * @return {Promise}
     */
    request() {
        this.reset();

        this.$attempts++;

        return new Promise((resolve, reject) => {
            request_tag(this.uri(), this)
                .then((vast) => {
                    try {
                        this.$vast = vast;

                        if (!vast) {
                            resolve(this);

                            return false;
                        }

                        if (!vast.hasAds()) {
                            throw new VastError(303);
                        }

                        if (!vast.hasLinear()) {
                            throw new VastError(201);
                        }

                        resolve(this);
                    } catch (e) {
                        this.vastError(e.code)

                        resolve(this);
                    }
                });
        });
    }

    /**
     * Schedule a tag to load again
     * with the given delay.
     *
     * Notifies player when a tag gets loaded and
     * also has ads using player.tagListener()
     *
     * @return {Tag}
     */
    schedule() {
        setTimeout(() => {
            this.request()
                .then(() => {
                    if (this.failed()) {
                        this.schedule();

                        return this;
                    }

                    this.campaign().player().tagListener();
                });
        }, this.delay());

        return this;
    }
}

export default (info, campaign) => {
    return (new Tag(info, campaign));
};
