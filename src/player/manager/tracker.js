import macro from '../macro';
import scriptSource from '../../source';
import { object_to_query } from '../../utils/parse_link';

class Tracker {
    constructor(manager) {
        this.$manager = manager;

        this.$checkPoints = {};
        this.$checked = new Set();
        this.$progressed = new Set();

        this.$avoid = new Set(['timeupdate']);

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
                'timeupdate',
                'mute',
                'unmute'
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
            paused: 'pause',
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

    URI(uri, macros) {
        uri = macro.uri(uri, macros);

        // const image = new Image;
        // image.src = uri;

        console.log(uri);

        return this;
    }

    appUri(source, status, tag = false, campaign = false) {
        if (status instanceof Object) {
            const key = Object.keys(status)[0];

            status = status[key];
        }

        const data = object_to_query({
            source,
            status,
            tag,
            campaign: campaign || '[campaign_id]',
            referrer: '[referrer_url]'
        });

        return macro.uri(`${scriptSource.path}/track?${data}`);
    }

    campaignEvent(campaign, status) {
        this.URI(
            this.appUri('campaign', status, false, campaign)
        );

        return this;
    }

    tagEvent(tag, status) {
        this.URI(
            this.appUri('tag', status, tag)
        );

        return this;
    }

    videoEvent(name, data) {
        name = name.replace('video', '');

        let alias = false;
        if (alias = this.$aliases[name]) {
            if (typeof alias == 'function') {
                name = alias();
            } else {
                name = alias;
            }
        }

        if (!this.$avoid.has(name)) {
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
                    name = { errorcode: data };
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

                            this.videoEvent(point);
                        }
                    });
                } else {
                    _uris = this.manager().creative().trackingEvent(name);
                }
            }

            if (_source == 'clicks') {
                _uris = this.manager().creative().videoClick(name);
            }

            this._trackEventURIs('ad', name, _uris);
        });

        return this;
    }

    _trackEventURIs(source, status, uris = []) {
        if (!this.$avoid.has(status)) {
            uris.push(
                this.appUri(
                    source,
                    status,
                    this.manager().tag().id(),
                    this.manager().player().campaign().id()
                )
            );
        }

        uris.forEach((uri) => {
            this.URI(uri, status);
        });

        return this;
    }
}

export const track = () => {
    return new Tracker();
};

export default Tracker;
