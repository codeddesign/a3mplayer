import Campaign from './campaign/campaign';
import { track } from './manager/tracker';
import vastLoadXML from '../vast/base';
import ajax from '../utils/ajax';
import config from '../../config';

/**
 * Makes a request to campaign uri.
 * Then it makes requests to tags that can be loaded.
 *
 * @param {Source} source
 *
 * @return {Promise}
 */
export const request_campaign = (source) => {
    const uri = `${config.app_path}/campaign/${source.id}`;

    return new Promise((resolve, reject) => {
        ajax().json(uri)
            .then((response) => {
                track().campaignEvent(source.id, response.status);

                const campaign = new Campaign(response.text);

                resolve(campaign);
            })
            .catch((e) => {
                console.error(e);

                track().campaignEvent(source.id, e.code);
            });
    });
};

/**
 * Makes a request to tag uri.
 *
 * @param {String} uri
 * @param {Object} config
 * @param {Boolean|Vast} mainVast
 * @param {Boolean|Integer} wrapperIndex
 *
 * @return Promise}
 */
export const request_tag = (uri, config = {}, mainVast = false, wrapperIndex = false) => {
    const virtual = document.createElement('textarea');
    virtual.innerHTML = uri;
    uri = virtual.value.trim();

    return new Promise((resolve, reject) => {
        ajax().get(uri)
            .then((response) => {
                if (wrapperIndex === false) {
                    track().tagEvent(config.id(), response.status);

                    if (response.text)
                        ajax().payload({ vast: response.text, uri: uri, wrapper: 0 });
                }

                const vast = vastLoadXML(response.text),
                    wrappers = vast.ads().withType('wrapper'),
                    promises = [];

                // backup main vast
                if (!mainVast) {
                    mainVast = vast;
                }

                // save wrapper's index
                if (wrapperIndex !== false) {
                    vast.$index = wrapperIndex;
                }

                // has wrappers
                if (wrappers.length) {
                    wrappers.forEach((wrapper, index) => {
                        if (wrapperIndex !== false) {
                            index = wrapperIndex;
                        }

                        const mainWrapper = mainVast.ads().byIndex(index);

                        if (wrapper.followAdditionalWrappers() &&
                            !mainWrapper.reachedRedirectsLimit(config.$wrapper_limit)
                        ) {
                            mainWrapper.addRedirect();

                            promises.push(
                                request_tag(wrapper.adTagUri(), config, mainVast, index)
                            );
                        }
                    });

                    Promise.all(promises)
                        .then((finished) => {
                            if (finished instanceof Array) {
                                finished = finished[0];
                            }

                            resolve(finished);
                        })
                        .catch((e) => {
                            reject(e);
                        });

                    return false;
                }

                // finished
                if (typeof vast.$index !== 'undefined') {
                    const $index = vast.$index;

                    if (response.text)
                        ajax().payload({ vast: response.text, uri: uri, wrapper: 1 });

                    let mainWrapper = false;
                    vast.ads().forEach((ad, index) => {
                        if (!mainWrapper) {
                            mainWrapper = mainVast.ads().byIndex($index);
                        }

                        ad.extendWithWrapper(mainWrapper);

                        if (index == 0) {
                            mainVast.ads().replaceByIndex($index, ad);

                            return false;
                        }

                        if (mainWrapper.allowMultipleAds()) {
                            mainVast.ads().add(ad);
                        }
                    });
                }

                resolve(mainVast);
            })
            .catch((e) => {
                if (wrapperIndex === false) {
                    console.error(e);

                    track().tagEvent(config.id(), e.code);
                }

                resolve(mainVast);
            });
    });
};
