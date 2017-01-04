import macro from '../macro';
import $ from '../../utils/element';

class VPAIDJavaScript {
    constructor(manager) {
        this.$manager = manager;

        this.$unit = false;

        this.$volume = 1;

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
        const self = this,
            $target = this.manager().player().slot(),
            template = '<iframe src="about:self" style="border:0;width:100%;height:100%"></iframe>',
            _window = $target.html(template).node.contentWindow,
            _iframe = _window.document;

        const attrs = {
                src: this.manager().media().source()
            },
            events = {
                onload() {
                    self.loadUnit(_window['getVPAIDAd']());
                }
            };

        $(_iframe).find('head').append('script', attrs, events);

        return this;
    }

    loadUnit(unit) {
        this.$unit = unit;

        this.$unit.slot = this.manager().player().slot().node;

        this.$events.forEach((name) => {
            this.$unit.subscribe(() => { this._event(name); }, `Ad${name}`);
        });

        this.$unit.initAd(
            this.$config.width,
            this.$config.height,
            this.$config.view,
            this.$config.bitrate,
            this.manager().creative().adParameters() || '',
            ''
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

    _event(name, data) {
        name = name.toLowerCase();

        // console.info('js event', name);

        this.manager().videoListener(name, data);

        return this;
    }
}

export default VPAIDJavaScript;
