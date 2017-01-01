import macro from '../macro';

// @@todo: add own tracking links

class Tracker {
    constructor(manager) {
        this.$manager = manager;

        this.$checkPoints = {};
        this.$checked = new Set();
        this.$progressed = new Set();

        this.$sources = {
            ad: new Set([
                'impression',
                'error'
            ]),
            creative: new Set([
                'firstquartile',
                'midpoint',
                'thirdquartile',
                'complete',
                'start',
                'skip',
                'pause',
                'resume',
                'timeupdate'
            ]),
            clicks: new Set([
                'clicktracking'
            ])
        };

        this.$aliases = {
            clickthru: 'clicktracking',
            clickthrough: 'clicktracking',
            skipped: 'skip',
            playing: 'resume',
            volumechange: () => {
                return this.manager().video().volume() ? 'unmute' : 'mute';
            }
        };
    }

    manager() {
        return this.$manager;
    }

    setCheckPoints(duration) {
        this.$checkPoints = {
            impression: 1,
            videofirstquartile: Math.round(.25 * duration),
            videomidpoint: Math.round(.5 * duration),
            videothirdquartile: Math.round(.75 * duration),
        };

        return this;
    }

    URI(uri) {
        uri = macro.uri(uri);

        // @@uncomment:
        // const image = new Image;
        // image.src = uri;

        // @@remove:
        console.log(uri);

        return this;
    }

    event(name, data) {
        name = name.replace('video', '');

        let alias = false;
        if (alias = this.$aliases[name]) {
            if (typeof alias == 'function') {
                name = alias();
            } else {
                name = alias;
            }
        }

        if (name != 'timeupdate') {
            console.info('@track:', name);
        }

        Object.keys(this.$sources).forEach((_source) => {
            const source = this.$sources[_source];

            if (!source.has(name)) {
                return false;
            }

            let _uris = [];

            if (_source == 'ad') {
                if (name == 'impression') {
                    _uris = this.manager().ad().impression();
                }

                if (name == 'error') {
                    _uris = this.manager().ad().error();
                }
            }

            if (_source == 'creative') {
                if (name == 'timeupdate' && data) {
                    const _second = Math.floor(data);

                    if (!this.$progressed.has(_second)) {
                        this.$progressed.add(_second);

                        _uris = this.manager().creative().trackingEventProgress(data);
                    }

                    Object.keys(this.$checkPoints).forEach((point) => {
                        const _checkPointTime = this.$checkPoints[point];
                        if (!this.$checked.has(point) && data >= _checkPointTime) {
                            this.$checked.add(point);

                            this.event(point);
                        }
                    });
                } else {
                    _uris = this.manager().creative().trackingEvent(name);
                }
            }

            if (_source == 'clicks') {
                _uris = this.manager().creative().videoClick(name);
            }

            this._trackEventURIs(name, _uris);
        });
    }

    _trackEventURIs(name, uris = []) {
        uris.forEach((uri) => {
            this.URI(uri);
        });

        return this;
    }
}

export default Tracker;
