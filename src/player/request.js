import Campaign from './campaign/campaign';
import vastLoadXML from '../vast/base';
import ajax from '../utils/ajax';

/**
 * Makes a request to campaign uri.
 * Then it makes requests to tags that can be loaded.
 *
 * @param {String} uri
 *
 * @return {Promise}
 */
export const request_campaign = (uri) => {
    return new Promise((resolve, reject) => {
        ajax().json(uri, (response, status) => {
            const campaign = new Campaign(response);

            campaign.requestTags()
                .then((tags) => {
                    campaign.$loaded = tags;

                    resolve(campaign);
                })
                .catch((e) => {
                    console.error('request campaign catch', e);
                });
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
    return new Promise((resolve, reject) => {
        ajax().get(uri, (text) => {
            try {
                const vast = vastLoadXML(text),
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
                            console.error('request tags all catch', e);
                        });

                    return false;
                }

                // finished
                if (typeof vast.$index !== 'undefined') {
                    const $index = vast.$index;

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
            } catch (e) {
                // @@todo: logging only
                console.log(e);

                resolve(mainVast);
            }
        });
    });
};
