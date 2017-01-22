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
import $ from '../../utils/element';

class Manager {
    constructor(player) {
        this.$player = player;

        this.$hasAds = false;

        this.$filled = false;

        this._addListeners();

        this.initialize();

        if (device.mobile()) {
            $().sub('touchend', () => {
                if (!this.video()) {
                    return false;
                }

                if (this.controller().isLoaded()) {
                    return false;
                }

                if (this.video().$loaded) {
                    return false;
                }

                this.video().$loaded = true;

                this.video().$byUser = true;

                this.video().loadUnit();
            });
        }
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

    wrapper() {
        return this.player().els('wrapper');
    }

    filler() {
        return this.player().els('filler');
    }

    container() {
        return this.player().els('container');
    }

    loader() {
        return this.player().els('loader');
    }

    slot() {
        return this.player().els('slot');
    }

    sound() {
        return this.player().els('sound');
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
            this.player().scheduleTags();
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

            return this;
        }

        const virtual = document.createElement('textarea');
        virtual.innerHTML = this.$media.source();
        this.$media.$source = virtual.value.trim();


        this.$hasAds = true;

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

    mediaIsFlash() {
        if (this.media().type() == 'video/x-flv') {
            return true;
        }

        if (this.media().type() == 'application/x-shockwave-flash') {
            return true;
        }

        return false;
    }

    createVideo() {
        if (!this.media()) {
            return this;
        }

        if (!device.flash() && this.mediaIsFlash()) {
            this.tag().vastError(405);

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

        if (this.$video) {
            this.controller().videoEvent('initiating');
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

    mustPlay() {
        return this.wrapper().inView().mustPlay;
    }

    mustPause() {
        return this.wrapper().inView().mustPause;
    }

    _addListeners() {
        const toggleSound = () => {
            if (!this.video()) {
                return false;
            }

            const isMuted = !this.video().volume();

            (isMuted) ? this.video().volume(1, true): this.video().volume(0, true);

            this.sound().toggleClasses('off', 'on');
        }

        // triggering start
        this.container().sub('transitionend', () => {
            if (this.container().hasClass('slided')) {
                if (this.player().campaign().isSidebarInfinity()) {
                    this.filler().show();
                }

                return false;
            }

            if (this.controller().isLoaded() && !this.controller().isPlaying()) {
                this.video().start();

                if (!this.player().campaign().isStandard()) {
                    this.video().volume(0);

                    this.sound().toggleClasses('off', 'on');
                }

                if (device.mobile()) {
                    this.sound().show();
                }
            }
        });

        this.container().sub('mouseover', () => {
            if (device.mobile()) return false;

            toggleSound();
        });

        this.container().sub('mouseout', () => {
            if (device.mobile()) return false;

            toggleSound();
        });

        this.sound().sub('click', (ev) => {
            ev.stopPropagation();

            toggleSound(true);
        })

        $().sub('scroll', () => {
            if (this.player().campaign().isSidebarInfinity()) {
                if (this.wrapper().parent().bounds().top <= 0) {
                    this.wrapper().addClass('fixed');
                } else {
                    this.wrapper().removeClass('fixed');
                }
            }

            if (this.$filled) {
                return false;
            }

            if (this.player().campaign().isOnScroll() && (this.controller().isSkipped() || !this.controller().isLoaded())) {
                this.controller()._fill();

                return false;
            }

            if (this.mustPlay()) {
                if (this.controller().isPaused()) {
                    this.video().resume();

                    return false
                }

                if (!this.controller().isPlaying()) {
                    // trigger start
                    if (this.container().hasClass('slided')) {
                        this.container().removeClass('slided');

                        return false;
                    }

                    this.container().pub('transitionend');

                    return false
                }

                return false;
            }

            if (this.mustPause()) {
                if (this.controller().isPlaying()) {
                    this.video().pause();

                    return false;
                }

                return false;
            }
        });
    }
}

export default Manager;
