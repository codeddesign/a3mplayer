export class AjaxError {
    constructor(message) {
        this.message = message;

        this.stack = (new Error(message)).stack;
    }
}

class Ajax {
    constructor() {
        const versions = [
            'MSXML2.XmlHttp.5.0',
            'MSXML2.XmlHttp.4.0',
            'MSXML2.XmlHttp.3.0',
            'MSXML2.XmlHttp.2.0',
            'Microsoft.XmlHttp'
        ];

        this.xhr = false;

        if (typeof XMLHttpRequest !== 'undefined') {
            this.xhr = new XMLHttpRequest();

            return;
        }

        versions.some((version) => {
            try {
                this.xhr = new ActiveXObject(version);

                return true;
            } catch (e) {
                return false;
            }
        });
    }

    get(uri, callback = () => {}) {
        if (!this.xhr) {
            throw new AjaxError(`Ajax is not available.`)
        }

        this.xhr.onreadystatechange = () => {
            if (this.xhr.readyState === 4) {
                if (this.xhr.status != 200) {
                    throw new AjaxError(`Failed to get '${uri} via Ajax.'`);
                }

                callback(this.xhr.responseText, this.xhr.status);
            }
        };

        this.xhr.open('GET', uri, true);
        this.xhr.send();
    }

    json(uri, callback) {
        this.get(uri, (response, status) => {
            try {
                response = JSON.parse(response);
            } catch (e) {
                throw new AjaxError(`Failed to parse JSON from '${uri}'.`);
            }

            callback(response, status);
        });
    }
}

export default () => {
    return new Ajax;
};
