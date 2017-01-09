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

    statusUpdate(status = {}) {
        Object.keys(status).forEach((key) => {
            this.$status[key] = status[key];
        });

        return this;
    }

    videoEvent(name, data) {
        switch (name) {
            case 'initiating':
                break;
            case 'loaded':
                if (this.manager().mustPlay()) {
                    this.manager().container().removeClass('slided');

                    // Manages to fire the play continuously
                    if (this.manager().video() && device.mobile()) {
                        this.manager().video().loadUnit();
                    }
                }

                this.manager().loader().show();

                this.manager().filler().hide();

                //..
                this.statusUpdate({ loaded: true });

                $().pub('scroll');

                setTimeout(() => {
                    if (!this.manager().video() || this.manager().video().remainingTime() <= 0) {
                        this.manager().videoListener('error', 901);

                        this.manager().slot().html('');
                    }
                }, this.manager().tag().timeOut());
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

                // slide it..
                this.manager().container().addClass('slided');

                // load next ad from current tag
                if (!this.manager().tag().finished()) {
                    this.manager().nextTagAd();

                    return false;
                }

                this.manager().loader().hide();

                // first: schedule
                this.manager().tag().schedule();

                // second: re-initialize
                this.manager().initialize();

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

        if (this.manager().wrapper().inView().diffAbs < config.filler.pixels) {
            return this;
        }

        if (typeof window.adsbygoogle == 'undefined') {
            return this;
        }

        this.statusUpdate({ filled: true });

        this.manager().filler().show();

        (adsbygoogle = window.adsbygoogle || []).push({});

        return this;
    }
}

export default Controller;
