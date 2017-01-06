import device from '../utils/device';
import { referrer } from '../utils/parse_link';

// @@todo: add macros (timestamp format.. cachebuster is actually Date.now())

class Macro {
    constructor() {
        this.$mapped = {};

        this.set('media_id', 'Ad3')
            .set('user_agent', device.agent)
            .set('referrer_root', referrer.base)
            .set('referrer_url', referrer.complete)
            .set('width', 0)
            .set('height', 0)
            .set('timestamp', 0)
            .set('campaign_id', 0)
            .set('ip_address', 0);
    }

    uri(_uri, macros = {}) {
        macros = Object.assign({}, macros, this.$mapped);

        Object.keys(macros).forEach((key) => {
            _uri = _uri.replace(
                new RegExp(`\\[${key}\\]`, 'gi'),
                encodeURIComponent(macros[key])
            );
        });

        this.set('timestamp', Date.now());

        return _uri;
    }

    get(key) {
        return this.$mapped[key];
    }

    set(key, value) {
        this.$mapped[key] = encodeURIComponent(value);

        return this;
    }

    setIp(ip) {
        return this.set('ip_address', ip);
    }

    setCampaign(id) {
        return this.set('campaign_id', id);
    }

    setSizes({ width, height }) {
        this.set('width', width || 640)
            .set('height', height || 360);

        return this;
    }
}

export default (() => {
    return new Macro();
})();
