import device from '../utils/device';
import { referrer } from '../utils/parse_link';

// @@todo: add macros (timestamp format.. cachebuster is actually Date.now())

class Macro {
    constructor() {
        this.$mapped = {};

        this.set('user_agent', device.agent)
            .set('referrer_root', referrer.base)
            .set('referrer_url', referrer.complete)
            .set('description_url', referrer.complete)
            .set('width', 0)
            .set('height', 0)
            .set('timestamp', 0)
            .set('ip_address', 0);
    }

    uri(_uri) {
        Object.keys(this.$mapped).forEach((key) => {
            _uri = _uri.replace(
                new RegExp(`\\[${key}\\]`, 'gi'),
                this.$mapped[key]
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

    setSizes({ width, height }) {
        this.set('width', width)
            .set('height', height);

        return this;
    }
}

export default (() => {
    return new Macro();
})();
