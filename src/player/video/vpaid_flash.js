import macro from '../macro';
import source from '../../source';
import random from '../../utils/random';

class VPAIDFlash {
    constructor(manager) {
        this.$id = `v${random()}`;

        this.$manager = manager;

        this.$unit = false;

        this.$called = {};
        this.$calledOnce = new Set(['handshake', 'start', 'stop']);
        this.$calledMinMls = 3; // milliseconds between events

        this.$volume = 1;

        this.$config = {
            view: 'transparent',
            bitrate: this.manager().media().bitrate() || 59.97,
            width: macro.get('width'),
            height: macro.get('height'),
        };

        this.create();
    }

    template() {
        return `<object type="application/x-shockwave-flash"
            width="${this.$config.width}"
            height="${this.$config.height}"
            data="${source.path}/vpaid.swf">
            <param name="wmode" value="transparent"></param>
            <param name="salign" value="tl"></param>
            <param name="align" value="left"></param>
            <param name="allowScriptAccess" value="always"></param>
            <param name="scale" value="noScale"></param>
            <param name="allowFullScreen" value="true"></param>
            <param name="quality" value="high"></param>
            <param name="FlashVars" value="flashid=${this.id()}&handler=handler_${this.id()}&debug=false&salign=tl"></param>
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
        if (this._calledOnce('handShake')) {
            return this;
        }

        this.unit().loadAdUnit([this.id(), this.manager().media().source()]);

        return this;
    }

    loadUnit() {
        if (this._calledOnce('loadUnit')) {
            return this;
        }

        this.unit().initAd([
            this.id(),
            this.$config.width,
            this.$config.height,
            this.$config.view,
            this.$config.bitrate,
            this.manager().creative().adParameters() || '',
            '',
        ]);

        return this;
    }

    start() {
        if (this._calledOnce('start')) {
            return this;
        }

        this.unit().startAd([this.id()]);

        return this;
    }

    stop() {
        if (this._calledOnce('stop')) {
            return this;
        }

        this.unit().stopAd([this.id()]);

        return this;
    }

    pause() {
        this.unit().pauseAd([this.id()]);

        return this;
    }

    resume() {
        this.unit().resumeAd([this.id()]);

        return this;
    }

    skip() {
        this.unit().skipAd([this.id()]);

        return this;
    }

    volume(volume = false) {
        if (volume === false) {
            return this.$volume;
        }

        this.$volume = volume;

        this.unit().setAdVolume([this.id(), volume]);

        return this;
    }

    remainingTime() {
        return this.unit().getAdRemainingTime([this.id()]);
    }

    resize(size = {}) {
        const { width, height } = size;

        this.unit().resizeAd([this.id(), width, height, this.$config.view]);

        return this;
    }

    _addWindowListener() {
        const handler = `handler_${this.id()}`;

        window[handler] = (id, typeName, typeId, callbackId, error, data) => {
            const info = { id, typeName, typeId, callbackId, error, data };

            if (typeName == 'method') {
                this._method(typeId);

                return false;
            }

            if (typeName == 'event') {
                this._event(typeId, data);

                return false;
            }
        };

        return this;
    }

    _calledOnce(name) {
        return this.$calledOnce.has(name) && this.$called[name];
    }

    _canCall(name) {
        if (!this.$called[name]) {
            this.$called[name] = Date.now();

            return true;
        }

        const _diff = Date.now() - this.$called[name];

        if (_diff > this.$calledMinMls) {
            this.$called[name] = Date.now();

            return true;
        }

        return false;
    }

    _method(name) {
        name = name.replace('Ad', '');

        if (!this._canCall(name)) {
            return false;
        }

        // console.info('vpaid method', name);

        if (this[name]) {
            this[name]();
        }

        return this;
    }

    _event(name, data) {
        name = name.replace('Ad', '');

        if (!this._canCall(name)) {
            return false;
        }

        // console.info('vpaid event', name);

        this.manager().videoListener(name, data);

        return this;
    }
}

export default VPAIDFlash;
