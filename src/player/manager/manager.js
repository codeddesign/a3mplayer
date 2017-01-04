import bestMedia from './media';
import Tracker from './tracker';
import { track } from './tracker';
import Controller from './controller';
import HTML5 from '../video/html5';
import Flash from '../video/flash';
import VPAIDFlash from '../video/vpaid_flash';
import VPAIDJavaScript from '../video/vpaid_javascript';
import device from '../../utils/device';
import VastError from '../../vast/error';

class Manager {
    constructor(player) {
        this.$player = player;

        this.$hasAds = false;

        this.initialize();
    }

    initialize() {
        this.$tag = false;
        this.$ad = false;
        this.$creative = false;
        this.$media = false;

        this.$tracker = false;
        this.$controller = false;

        this.$video = false;

        this.setTag()
            .nextTagAd();
    }

    nextTagAd() {
        this.setTracker()
            .setController()
            .setAd()
            .setCreative()
            .setMediaFile()
            .createVideo();

        return this;
    }

    /**
     * @return {Player}
     */
    player() {
        return this.$player;
    }

    /**
     * @return {Boolean}
     */
    hasAds() {
        return this.$hasAds;
    }

    /**
     * @return {Tag|Boolean}
     */
    tag() {
        return this.$tag;
    }

    /**
     * @return {Ad|Boolean}
     */
    ad() {
        return this.$ad;
    }

    /**
     * @return {Creative|Boolean}
     */
    creative() {
        return this.$creative;
    }

    /**
     * @return {Media|Boolean}
     */
    media() {
        return this.$media;
    }

    /**
     * @return {HTML5|VPAID|Boolean}
     */
    video() {
        return this.$video;
    }

    /**
     * @return {Tracker}
     */
    tracker() {
        return this.$tracker;
    }

    /**
     * @return {Controller}
     */
    controller() {
        return this.$controller;
    }

    /**
     * Set current tag.
     */
    setTag() {
        this.player().campaign().loaded().some((tag) => {
            if (!this.tag() && !tag.failed() && !tag.finished()) {
                this.$tag = tag;

                return true;
            }

            return false;
        });

        if (!this.tag()) {
            console.warn('No tag with ads to play.');
        }

        return this;
    }

    /**
     * Set current ad.
     */
    setAd() {
        if (!this.tag()) {
            return this;
        }

        this.$ad = this.tag().vast().someAd((ad) => {
            if (!ad._played) {
                return true;
            }
        });

        if (!this.ad()) {
            console.warn('All ads from this tag were played.');

            return this;
        }

        this.$hasAds = true;

        this.controller().videoEvent('initiating');

        return this;
    }

    /**
     * Set current creative.
     */
    setCreative() {
        if (!this.ad()) {
            return this;
        }

        this.$creative = this.ad().someCreative((creative) => {
            if (creative.isLinear()) {
                return true;
            }
        });

        if (!this.creative()) {
            console.warn('No linear creatives.');
        }

        return this;
    }

    /**
     * Set mediafile.
     *
     * Notes:
     * - sort them by width.
     * - prefer non-vpaid.
     * - select media file by it's width, but not
     *   the last one (might be too big).
     */
    setMediaFile() {
        if (!this.creative()) {
            return this;
        }

        this.$media = bestMedia(this.creative().mediaFiles().all());

        if (!this.media()) {
            console.warn('No media.');
        }

        return this;
    }

    setTracker() {
        this.$tracker = new Tracker(this);

        return this;
    }

    setController() {
        this.$controller = new Controller(this);

        return this;
    }

    createVideo() {
        if (!this.media()) {
            return this;
        }

        switch (this.media().type()) {
            case 'video/mp4':
            case 'video/ogg':
            case 'video/webm':
                this.$video = new HTML5(this);

                break;
            case 'video/x-flv':
                this.$video = new Flash(this);

                break;
            case 'application/x-shockwave-flash':
                this.$video = new VPAIDFlash(this);

                break;
            case 'text/javascript':
            case 'application/javascript':
            case 'application/x-javascript':
                this.$video = new VPAIDJavaScript(this);

                break;
            default:
                this.tag().vastError(403, `Media type: ${this.media().type()}`);

                break;
        }
    }

    videoListener(name, data) {
        name = name.toLowerCase();

        this.tracker().videoEvent(name, data);

        // manage current ad
        switch (name) {
            case 'skipped':
            case 'stopped':
            case 'complete':
            case 'error':
                this.ad()._played = true;

                break;
        }

        this.controller().videoEvent(name, data);
    }
}

export default Manager;
