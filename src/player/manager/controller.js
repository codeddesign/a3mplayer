import $ from '../../utils/element';
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

    statusUpdate(status = {}) {
        Object.keys(status).forEach((key) => {
            this.$status[key] = status[key];
        });

        return this;
    }

    videoEvent(name, data) {
        switch (name) {
            case 'initiating':
                // loading..

                break;
            case 'loaded':
                this.statusUpdate({ loaded: true });

                $().pub('scroll');
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
                console.error(data);

                break;
        }
    }

    _fill() {
        if (this.manager().startedOnce() || this.isFilled()) {
            return this;
        }

        if (this.wrapper().inView().diffAbs < config.filler.pixels) {
            return this;
        }

        if (typeof window.adsbygoogle == 'undefined') {
            return this;
        }

        this.statusUpdate({ filled: true });

        const template = `<ins class="adsbygoogle" style="display:inline-block;width:336px;height:280px"
            data-ad-client="${config.filler.client}"
            data-ad-slot="${config.filler.slot}">
        </ins>`;

        this.filler().html(template);

        (adsbygoogle = window.adsbygoogle || []).push({});

        return this;
    }

    _addListeners() {
        // triggering start
        this.container().sub('transitionend', () => {
            if (this.video() && !this.container().hasClass('slided')) {
                this.video().start();
            }
        });

        $().sub('scroll', () => {
            if (this.isFilled()) {
                return false;
            }

            if (this.isSkipped() || !this.isLoaded()) {
                this._fill();

                return false;
            }

            if (this.wrapper().inView().mustPlay) {
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

            if (this.wrapper().inView().mustPause) {
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
