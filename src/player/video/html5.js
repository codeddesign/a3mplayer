class HTML5 {
    constructor(manager) {
        this.$manager = manager;

        this.$node = false;

        this.$stopped = false;
        this.$paused = false;

        this.create();
    }

    template() {
        return `<video width="100%" height="100%"></video>`;
    }

    create() {
        this.$node = this.manager().player().target().html(this.template()).node;

        this._extendNode();

        this.loadUnit();
    }

    manager() {
        return this.$manager;
    }

    node() {
        return this.$node;
    }

    loadUnit() {
        const attrs = {
            type: this.manager().media().type(),
            src: this.manager().media().source()
        };

        Object.keys(attrs).forEach((key) => {
            this.node().setAttribute(key, attrs[key]);
        });

        return this;
    }

    start() {
        this.node().play();

        return this;
    }

    stop(skipped = false) {
        this.$stopped = true;

        const duration = this.node().duration;

        this.node().currentTime = (isNaN(duration) || !duration) ? 0 : duration;

        if (!skipped) {
            this._event('stopped')
                ._event('videocomplete');
        }

        return this;
    }

    pause() {
        this.$paused = true;

        this.node().pause();

        return this;
    }

    resume() {
        this.start();

        return this;
    }

    skip() {
        this.stop(true);

        this._event('skipped');
    }

    volume(volume = false) {
        if (volume === false) {
            return (this.node().muted == false) ? 1 : 0;
        }

        volume = (volume == 0) ? true : false

        if (volume == this.node().muted) {
            return this;
        }

        this.node().muted = volume;

        return this;
    }

    _event(name, data) {
        // console.info('html5 event', name);

        if (name == 'loaded') {
            this.manager().tracker().setCheckPoints(this.node().duration);
        }

        this.manager().videoListener(name, data);

        return this;
    }

    _extendNode() {
        this.node().oncanplaythrough = () => {
            if (this.$stopped) {
                return false;
            }

            this._event('loaded');
        };

        this.node().onplay = () => {
            if (this.$paused) {
                this.$paused = false;

                this._event('playing');

                return false;
            }

            this._event('started')
                ._event('videostart');
        }

        this.node().onpause = () => {
            // Gets triggered on stop()
            if (this.$stopped) {
                return false;
            }

            if (this.node().currentTime >= this.node().duration) {
                this.stop();

                return false;
            }

            this._event('paused');
        }

        this.node().ontimeupdate = (e) => {
            const time = e.timeStamp / 1000;

            this._event('timeupdate', time);
        }

        this.node().onvolumechange = (e) => {
            this._event('volumechange');
        }

        return this;
    }
}

export default HTML5;
