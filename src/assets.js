import config from '../config';
import $ from './utils/element';

export class Asset {
    constructor(info) {
        this.info = info;
    }

    attr() {
        return (this.info.attributes['href']) ? 'href' : 'src';
    }

    selector() {
        return `${this.info.tag}[${this.attr()}="${this.info.attributes[this.attr()]}"]`
    }

    exists() {
        return $().find(this.selector(), false)
    }

    load(target) {
        return new Promise((resolve, reject) => {
            const name = this.info.name;
            this.info.events = {
                onload() {
                    resolve(name);
                }
            }

            if (!this.exists()) {
                target.append(this.info.tag, this.info.attributes, this.info.events);

                return this;
            }

            resolve();
        });
    }
};

export const add_assets = () => {
    return new Promise((resolve, reject) => {
        const head = $().find('head');

        const promises = [];
        config.assets.forEach((asset) => {
            promises.push(
                (new Asset(asset)).load(head)
            )
        });

        Promise.all(promises)
            .then((names) => {
                resolve(names);
            })
            .catch((e) => {
                console.error('assets-all catch', e);
            });
    });
};
