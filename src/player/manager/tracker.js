import macro from '../macro';
import scriptSource from '../../source';
import { object_to_query, referrer } from '../../utils/parse_link';
import device from '../../utils/device';
import config from '../../../config';
import ajax from '../../utils/ajax';

class Tracker {
    constructor(manager) {
        this.$manager = manager;

        this.$checkPoints = {};
        this.$checked = new Set();
        this.$progressed = new Set();

        this.$events = {
            'filled': {
                code: 0,
                source: false
            },
            'loaded': {
                code: 1,
                source: false
            },
            'start': {
                code: 2,
                source: 'creative'
            },
            'impression': {
                code: 3,
                source: 'ad',
            },
            'error': {
                code: null, // replaced with vast error code
                source: 'ad'
            },
            'firstquartile': {
                code: 4,
                source: 'creative'
            },
            'midpoint': {
                code: 5,
                source: 'creative'
            },
            'thirdquartile': {
                code: 6,
                source: 'creative'
            },
            'complete': {
                code: 7,
                source: 'creative'
            },
            'skip': {
                code: 8,
                source: 'creative'
            },
            'pause': {
                code: 9,
                source: 'creative'
            },
            'resume': {
                code: 10,
                source: 'creative'
            },
            'mute': {
                code: 11,
                source: 'creative'
            },
            'unmute': {
                code: 12,
                source: 'creative'
            },
            'timeupdate': {
                code: 13,
                source: 'creative'
            },
            'clickthrough': {
                code: 14,
                source: 'videoclicks'
            }
        };

        this.$aliases = {
            clickthru: 'clickthrough',
            skipped: 'skip',
            playing: 'resume',
            paused: 'pause',
            volumechange: () => {
                return this.manager().video().volume() ? 'unmute' : 'mute';
            }
        };

        // string and event code
        this.$avoid = new Set(['timeupdate', 13]);
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

        if (config.track_request && !referrer.data._tid) {
            const image = new Image;
            image.src = uri;
        } else {
            console.log(uri);
        }

        return this;
    }

    appUri(source, status, tag = false, campaign = false) {
        if (status instanceof Object) {
            const key = Object.keys(status)[0];

            status = status[key];
        }

        const data = {
            source,
            status,
            tag,
            campaign: campaign || '[campaign_id]',
            w: '[w]',
            referrer: '[referrer_url]',
        };

        data[config.cachebreaker_key] = Date.now();

        return macro.uri(`${config.app_track}/track?${object_to_query(data)}`);
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

    visitEvent() {
        if (window.__a3mVisit) {
            return this;
        }

        window.__a3mVisit = true;

        const data = {
            source: 'visit',
            w: '[w]',
            platform: (device.mobile()) ? 'mobile' : 'desktop',
            referrer: '[referrer_url]',
            user_agent: '[user_agent]',
        };

        this.URI(
            macro.uri(`${config.app_track}/track?${object_to_query(data)}`)
        );

        return this;
    }

    videoEvent(name, data, tag_id, campaign_id, creative) {
        name = this._eventName(name);

        if (name == 'filled') {
            ajax().payload({ creative: creative, event: name, platform: (device.mobile()) ? 'mobile' : 'desktop' });
        }

        if (!tag_id) {
            if (!this.manager() || !this.manager().tag()) {
                return false;
            }

            tag_id = this.manager().tag().id();
        }

        campaign_id = campaign_id || this.manager().player().campaign().id();

        if (!this.$avoid.has(name)) {
            console.info('@track:', name, data || '');
        }

        const event = this.$events[name];
        if (!event) {
            return false;
        }

        const uris = [];

        switch (event.source) {
            case 'ad':
                if (name == 'impression') {
                    uris.push(
                        ...this.manager().ad().impression()
                    );
                }

                if (name == 'error') {
                    macro.set('errorcode', data);
                    if (this.manager() && this.manager().ad()) {
                        uris.push(
                            ...this.manager().ad().error()
                        );
                    }

                    event.code = data;
                }

                break;
            case 'creative':
                if (name == 'timeupdate' && data) {
                    const _second = Math.floor(data);

                    if (!this.$progressed.has(_second)) {
                        this.$progressed.add(_second);

                        uris.push(
                            ...this.manager().creative().trackingEventProgress(data)
                        );
                    }

                    Object.keys(this.$checkPoints).forEach((point) => {
                        const _checkPointTime = this.$checkPoints[point];
                        if (!this.$checked.has(point) && data >= _checkPointTime) {
                            this.$checked.add(point);

                            this.videoEvent(point);
                        }
                    });
                } else {
                    uris.push(
                        ...this.manager().creative().trackingEvent(name)
                    );
                }
                break;
            case 'videoclicks':
                uris.push(
                    ...this.manager().creative().videoClick(name)
                );

                break
            case false:
                break;
        }

        this._trackEventURIs('ad', event.code, tag_id, campaign_id, uris);

        return this;
    }

    _eventName(name) {
        name = name.replace('video', '');

        const alias = this.$aliases[name];
        if (alias) {
            if (typeof alias == 'function') {
                name = alias();
            } else {
                name = alias;
            }
        }

        return name;
    }

    _trackEventURIs(source, status, tag_id, campaign_id, uris = []) {
        if (!this.$avoid.has(status)) {
            uris.push(
                this.appUri(
                    source,
                    status,
                    tag_id,
                    campaign_id
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
