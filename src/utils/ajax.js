import config from '../../config';

export class AjaxError {
    constructor(code, message) {
        this.code = code;
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

    get(uri, noCredentials = false) {
        return new Promise((resolve, reject) => {
            if (!this.xhr) {
                reject(new AjaxError(-1, `Ajax is not available.`));

                return false;
            }

            if (uri.indexOf('/campaign') === -1 && !noCredentials)
                this.xhr.withCredentials = true;

            this.xhr.onreadystatechange = () => {
                if (this.xhr.readyState === 4) {
                    if (this.xhr.status != 200) {
                        if (noCredentials || this.xhr.status > 0) {
                            reject(new AjaxError(this.xhr.status, `Failed to get '${uri} via Ajax.'`));

                            return false;
                        }

                        // Make new attempt without credentials
                        const ajax = new Ajax();
                        ajax.get(uri, true)
                            .then((r) => {
                                resolve(r);
                            })
                            .catch((e) => {
                                reject(e);
                            });

                        return false;
                    }

                    resolve({
                        text: this.xhr.responseText,
                        status: this.xhr.status
                    });
                }
            };

            this.xhr.open('GET', uri, true);
            this.xhr.send();
        });
    }

    json(uri) {
        return new Promise((resolve, reject) => {
            this.get(uri)
                .then((response) => {
                    try {
                        response.text = JSON.parse(response.text);

                        resolve(response);
                    } catch (e) {
                        reject(new AjaxError(555, `Failed to parse JSON from '${uri}'.`));
                    }
                })
                .catch((e) => {
                    reject(e);
                })
        })
    }

    payload(object) {
        if (!config.filled_dump) {
            return false;
        }

        const string = JSON.stringify(object);

        this.xhr.open('POST', config.filled_dump);
        this.xhr.withCredentials = true;
        this.xhr.setRequestHeader('Content-Type', 'application/json');
        this.xhr.send(string);
    }
}

export default () => {
    return new Ajax;
};
