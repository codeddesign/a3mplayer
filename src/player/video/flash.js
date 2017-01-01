import macro from '../macro';
import source from '../../source';
import random from '../../utils/random';

class Flash {
    constructor(manager) {
        this.$id = `v${random()}`;

        this.$manager = manager;

        this.$unit = false;

        this.$volume = 1;

        this.$config = {
            view: 'transparent',
            bitrate: this.manager().media().bitrate() || 59.97,
            width: macro.get('width'),
            height: macro.get('height'),
        };

        this.$meta = false;
        this.$time = false

        this.create();
    }

    template() {
        return `<object type="application/x-shockwave-flash"
            width="${this.$config.width}"
            height="${this.$config.height}"
            data="${source.path}/flv.swf">
            <param name="wmode" value="transparent"></param>
            <param name="allowScriptAccess" value="always"></param>
            <param name="quality" value="high"></param>
            <param name="FlashVars" value="handler=handler_${this.id()}"></param>
        </object>`;
    }

    create() {
        this._addWindowListener();

        this.$unit = this.manager().player().target().html(this.template()).node;

        return this;
    }

    id() {
        return this.$id;
    }

    manager() {
        return this.$manager;
    }

    unit() {
        return this.$unit;
    }

    handShake() {
        this.unit().loadUnit({ src: this.manager().media().source() })

        return this;
    }

    start() {
        this.unit().start();

        return this;
    }

    stop() {
        this.unit().stop();
    }

    pause() {
        this.unit().pause();
    }

    resume() {
        this.unit().resume();
    }

    skip() {
        this.unit().skip();
    }

    volume(volume = false) {
        if (volume === false) {
            return this.$volume;
        }

        this.$volume = volume;

        this.unit().setVolume(volume);

        return this;
    }

    remainingTime() {
        if (!this.$meta) {
            return false;
        }

        return this.$meta.duration - this.$time;
    }

    resize(size = {}) {
        //
    }

    _addWindowListener() {
        const handler = `handler_${this.id()}`;

        window[handler] = (typeName, typeId, data) => {
            const info = { typeName, typeId, data };

            if (typeName == 'method') {
                this._method(typeId, data);

                return false;
            }

            if (typeName == 'event') {
                if (typeId == 'loaded') {
                    this.$meta = data;
                }

                if (typeId == 'timeupdate') {
                    this.$time = data;
                }

                this._event(typeId, data);

                return false;
            }
        };

        return this;
    }

    _method(name, data) {
        if (this[name]) {
            this[name](data);
        }

        return this;
    }

    _event(name, data) {
        // console.info('flv event', name);

        if (name == 'loaded') {
            this.manager().tracker().setCheckPoints(data.duration);
        }

        this.manager().videoListener(name, data);

        return this;
    }
}

export default Flash;
