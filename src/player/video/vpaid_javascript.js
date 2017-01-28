import Animator from './animator';
import macro from '../macro';
import $ from '../../utils/element';
import device from '../../utils/device';

class VPAIDJavaScript {
    constructor(manager) {
        this.$manager = manager;

        this.$unit = false;

        this.$volume = 1;

        this.$byUser = false;

        this.$config = {
            view: 'transparent',
            bitrate: this.manager().media().bitrate() || 59.97,
            width: macro.get('width'),
            height: macro.get('height'),
        };

        this.$events = [
            'Loaded',
            'Skipped',
            'Started',
            'Stopped',
            'LinearChange',
            'ExpandedChange',
            'RemainingTimeChange',
            'VolumeChange',
            'Impression',
            'VideoStart',
            'VideoFirstQuartile',
            'VideoMidpoint',
            'VideoThirdQuartile',
            'VideoComplete',
            'ClickThru',
            'Interaction',
            'UserAcceptInvitation',
            'UserMinimize',
            'UserClose',
            'Paused',
            'Playing',
            'Log',
            'Error',
        ];

        this.create();
    }

    manager() {
        return this.$manager;
    }

    create() {
        if (this.manager().$filled) {
            return false;
        }

        const self = this,
            $target = this.manager().player().slot(),
            template = `<iframe src="javascript:false;" frameborder="0"
            marginwidth="0" marginheight="0" vspace="0" hspace="0"
            allowtransparency="true" scrolling="no" allowfullscreen="true"
            seamless="seamless" width="100%" height="100%"></iframe>`,
            _window = $target.html(template).node.contentWindow,
            _iframe = _window.document;

        _iframe.inDapIF = true;

        const attrs = {
                src: this.manager().media().source()
            },
            events = {
                onload() {
                    self.$vpaid = _window['getVPAIDAd']();

                    self.loadUnit(this.$vpaid);
                }
            };

        $(_iframe).find('head').append('script', attrs, events);

        const _body = $(_iframe).find('body');

        this.$slot = _body;
        this.$videoSlot = _body.append('video', {
            'webkit-playsinline': 'true',
            'playsinline': 'true',
            'preload': 'auto'
        });

        return this;
    }

    loadUnit(unit) {
        if (this.$unit) {
            if (device.mobile() && this.$byUser) {
                this.start();
            }

            return this;
        }

        unit = unit || this.$vpaid;
        if (!this.$vpaid) {
            return false;
        }

        this.$unit = unit;

        this.$events.forEach((name, data) => {
            this.$unit.subscribe((ev) => { this._event(name, ev); }, `Ad${name}`);
        });

        let creativeData = {
            AdParameters: this.manager().creative().adParameters()
        };

        let environmentVars = {
            slot: this.$slot.node,
            videoSlot: this.$videoSlot.node,
            videoSlotCanAutoPlay: false
        };

        this.$unit.initAd(
            this.$config.width,
            this.$config.height,
            this.$config.view,
            this.$config.bitrate,
            creativeData,
            environmentVars
        );

        return this;
    }

    unit() {
        return this.$unit;
    }

    start() {
        this.unit().startAd();

        return this;
    }

    stop() {
        this.unit().stopAd();

        return this;
    }

    pause() {
        this.unit().pauseAd();

        return this;
    }

    resume() {
        this.unit().resumeAd();

        return this;
    }

    skip() {
        this.unit().skipAd();

        return this;
    }

    volume(volume = false) {
        if (volume === false) {
            return this.$volume;
        }

        this.$volume = volume;

        this.unit().setAdVolume(volume);

        return this;
    }

    remainingTime() {
        return this.unit().getAdRemainingTime();
    }

    resize(size = {}) {
        const { width, height } = size;

        this.unit().resizeAd(width, height);

        return this;
    }

    _event(name, ev) {
        name = name.replace('Ad', '').toLowerCase();

        let data = (ev) ? ev.data : undefined;

        // console.info('js event', name, data);

        if (name == 'loaded') {
            this.$videoSlot.style('width', '100%');
            this.$videoSlot.style('height', '100%');
        }

        if (name == 'error') {
            data = (data && data.errorCode) ? data.errorCode : false;
            if (!data || data < 100 || data > 901) {
                data = 900;
            }
        }

        this.manager().videoListener(name, data);

        return this;
    }
}

export default VPAIDJavaScript;
