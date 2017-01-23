import Animator from './animator';
import $ from '../../utils/element';
import device from '../../utils/device';
import macro from '../macro';

class HTML5 {
    constructor(manager) {
        this.$manager = manager;

        this.$unit = false;

        this.$stopped = false;
        this.$paused = false;

        this.$loaded = false;
        this.$animator = false;

        this.$called = [];

        this.$byUser = false;

        this.create();
    }

    template() {
        return `<video width="100%" height="100%" webkit-playsinline="true" playsinline="true"></video>`;
    }

    create() {
        this.$unit = this.manager().player().slot().html(this.template()).node;

        this._extendUnit();
        if (device.iphone()) {
            this._attachAnimator();
        }

        const attrs = {
            type: this.manager().media().type(),
            src: this.manager().media().source()
        };

        Object.keys(attrs).forEach((key) => {
            this.unit().setAttribute(key, attrs[key]);
        });
    }

    manager() {
        return this.$manager;
    }

    unit() {
        return this.$unit;
    }

    loadUnit() {
        this.unit().load();

        return this;
    }

    start() {
        this.unit().play();

        return this;
    }

    stop(skipped = false) {
        this.$stopped = true;

        const duration = this.unit().duration;

        this.unit().currentTime = (isNaN(duration) || !duration) ? 0 : duration;

        if (!skipped) {
            this._event('videocomplete')
                ._event('stopped');
        }

        return this;
    }

    pause() {
        this.$paused = true;

        this.unit().pause();

        return this;
    }

    resume() {
        this.start();

        return this;
    }

    skip() {
        this._event('skipped')
            ._event('stopped');

        this.stop(true);

        return this;
    }

    volume(volume = false, byUser = false) {
        if (volume === false) {
            return (this.unit().muted == false) ? 1 : 0;
        }

        volume = (volume == 0) ? true : false

        if (volume == this.unit().muted) {
            return this;
        }

        this.unit().muted = volume;

        if (this.$animator && byUser) {
            if (volume) {
                this.$animator.unmute();

                return this;
            }

            this.$animator.mute();
        }

        return this;
    }

    remainingTime() {
        return this.unit().duration - this.unit().currentTime;
    }

    _event(name, data) {
        // console.info('html5 event', name);

        if (name == 'loaded') {
            this.$loaded = true;

            this.manager().tracker().setCheckPoints(this.unit().duration);
        }

        this.manager().videoListener(name, data);

        return this;
    }

    _extendUnit() {
        this.unit().oncanplaythrough = () => {
            if (this.$stopped || this.$paused) {
                return false;
            }

            if (this.$called['loaded']) {
                return false;
            }

            if (device.mobile() && !this.$byUser) {
                return false;
            }

            this.$called['loaded'] = true;

            this._event('loaded');
        };

        this.unit().onplay = () => {
            if (this.$paused) {
                this.$paused = false;

                this._event('playing');

                return false;
            }

            this._event('started')
                ._event('videostart');
        }

        this.unit().onpause = () => {
            // Gets triggered on stop()
            if (this.$stopped) {
                return false;
            }

            if (this.unit().currentTime >= this.unit().duration) {
                this.stop();

                return false;
            }

            this._event('paused');
        }

        this.unit().ontimeupdate = (e) => {
            if (this.$stopped) {
                return false;
            }

            if (this.unit().currentTime <= this.unit().duration) {
                this._event('timeupdate', this.unit().currentTime);
            }
        }

        this.unit().onvolumechange = (e) => {
            this._event('volumechange');
        }

        this.unit().onerror = (e) => {
            this._event('error', 403);
        }

        this.unit().onclick = (e) => {
            this.manager().videoListener('clickthrough');

            window.open(this.manager().creative().clickThrough());
        }

        return this;
    }

    _attachAnimator() {
        this.$animator = new Animator(this);

        return this;
    }
}

export default HTML5;
