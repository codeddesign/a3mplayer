import { track } from './tracker';
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
            skipped: false
        };

        this.$interval = false;
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

    statusUpdate(status = {}) {
        Object.keys(status).forEach((key) => {
            this.$status[key] = status[key];
        });

        return this;
    }

    videoEvent(name, data) {
        switch (name) {
            case 'initiating':
                setTimeout(() => {
                    if (!this.isLoaded() || !this.manager().video()) {
                        if (this.manager().tag()) {
                            this.manager().videoListener('error', 901);
                            this.manager().slot().html('');
                        }
                    }
                }, this.manager().tag().timeOut());
                break;
            case 'loaded':
                this.statusUpdate({ loaded: true });

                track().videoEvent('filled', 0, this.manager().tag().id(), this.manager().player().campaign().id());

                if (this.manager().mustPlay()) {
                    this.manager().container().removeClass('slided');
                }

                this.manager().loader().show();

                this.manager().filler().hide();

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

                // slide it..
                this.manager().container().addClass('slided');

                // load next ad from current tag
                if (1==2 && !this.manager().tag().finished()) {
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
        if (this.isLoaded() || this.manager().$filled) {
            return this;
        }

        if (this.manager().wrapper().inView().diffAbs < config.filler.pixels) {
            return this;
        }

        this.manager().$filled = true;

        const template = `<iframe src="javascript:false;"
        width="300" height="250" frameborder="0"
        marginwidth="0" marginheight="0" vspace="0" hspace="0"
        allowtransparency="true" scrolling="no" allowfullscreen="true"
        seamless="seamless"
        ></iframe>`,
            _iframe = this.manager().filler().html(template).node.contentWindow,
            head = _iframe.document.querySelector('head');

        _iframe.document.write(`<script type="text/javascript" src="http://a.intgr.net/tags/199_2.js"></script>`);

        this.manager().filler().show();

        return this;
    }
}

export default Controller;
