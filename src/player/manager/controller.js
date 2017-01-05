import $ from '../../utils/element';
import device from '../../utils/device';
import config from '../../../config';

class Controller {
    constructor(manager) {
        this.$manager = manager;

        this.$status = {
            loaded: false,
            playing: false,
            paused: false,
            stopped: true,
            skipped: false,
            filled: false
        };

        this._addListeners();
    }

    manager() {
        return this.$manager;
    }

    status() {
        return this.$status;
    }

    player() {
        return this.manager().player();
    }

    tag() {
        return this.manager().tag();
    }

    creative() {
        return this.manager().creative();
    }

    ad() {
        return this.manager().ad();
    }

    video() {
        return this.manager().video();
    }

    isLoaded() {
        return this.status().loaded;
    }

    isPlaying() {
        return this.status().playing;
    }

    isPaused() {
        return this.status().paused;
    }

    isSkipped() {
        return this.status().skipped;
    }

    isStopped() {
        return this.status().stopped;
    }

    isFilled() {
        return this.status().filled;
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

    statusUpdate(status = {}) {
        Object.keys(status).forEach((key) => {
            this.$status[key] = status[key];
        });

        return this;
    }

    mustPlay() {
        return this.wrapper().inView().mustPlay;
    }

    mustPause() {
        return this.wrapper().inView().mustPause;
    }

    videoEvent(name, data) {
        switch (name) {
            case 'initiating':
                if (this.mustPlay()) {
                    this.container().removeClass('slided');

                    // Manages to fire the play continuously
                    if (this.video() && device.iphone()) {
                        this.video().loadUnit();
                    }
                }

                this.loader().show();

                this.filler().hide();

                break;
            case 'loaded':
                this.statusUpdate({ loaded: true });

                $().pub('scroll');

                setTimeout(() => {
                    if (!this.video() || this.video().remainingTime() <= -1) {
                        this.manager().videoListener('error', 901);

                        this.slot().html('');
                    }
                }, this.tag().timeOut());
                break;
            case 'started':
                this.statusUpdate({
                    playing: true,
                    stopped: false,
                    paused: false
                });

                break;
            case 'paused':
                this.statusUpdate({ paused: true });

                break;
            case 'resume':
                this.statusUpdate({ paused: false });

                break;
            case 'skipped':
                this.statusUpdate({
                    skipped: true
                });

                break;
            case 'stopped':
                this.statusUpdate({
                    loaded: false,
                    playing: false,
                    paused: false,
                    stopped: true
                });

                if (this.isSkipped()) {
                    return false;
                }

                if (!this.tag().finished()) {
                    this.manager().nextTagAd();

                    return false;
                }

                this.loader().hide();

                // first: schedule
                this.tag().schedule();

                // second: re-initialize
                this.manager().initialize();

                // third: check if we got one ready
                if (!this.manager().tag()) {
                    this.container().addClass('slided');
                }

                break;
            case 'error':
                this.videoEvent('stopped');

                break;
        }
    }

    _fill() {
        if (this.manager().hasAds() || this.isFilled()) {
            return this;
        }

        if (this.wrapper().inView().diffAbs < config.filler.pixels) {
            return this;
        }

        if (typeof window.adsbygoogle == 'undefined') {
            return this;
        }

        this.statusUpdate({ filled: true });

        this.filler().show();

        (adsbygoogle = window.adsbygoogle || []).push({});

        return this;
    }

    toggleSound() {
        const isMuted = !this.video().volume();

        (isMuted) ? this.video().volume(1, true): this.video().volume(0, true);

        this.sound().toggleClasses('off', 'on');
    }

    _addListeners() {
        // triggering start
        this.container().sub('transitionend', () => {
            if (this.container().hasClass('slided')) {
                if (this.player().campaign().isSidebarInfinity()) {
                    this.filler().show();
                }

                return false;
            }

            if (this.isLoaded() && !this.isPlaying()) {
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
            this.toggleSound();
        });

        this.container().sub('mouseout', () => {
            this.toggleSound();
        });

        this.sound().sub('click', (ev) => {
            ev.stopPropagation();

            this.toggleSound(true);
        })

        $().sub('scroll', () => {
            if (this.player().campaign().isSidebarInfinity()) {
                if (this.wrapper().parent().bounds().top <= 0) {
                    this.wrapper().addClass('fixed');
                } else {
                    this.wrapper().removeClass('fixed');
                }
            }

            if (this.isFilled()) {
                return false;
            }

            if (this.isSkipped() || !this.isLoaded()) {
                this._fill();

                return false;
            }

            if (this.mustPlay()) {
                if (this.isPaused()) {
                    this.video().resume();

                    return false
                }

                if (!this.isPlaying()) {
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
                if (this.isPlaying()) {
                    this.video().pause();

                    return false;
                }

                return false;
            }
        });
    }
}

export default Controller;
