import macro from './macro';
import Manager from './manager/manager';
import { request_campaign } from './request';
import $ from '../utils/element';
import { create } from '../utils/element';

class Player {
    constructor() {
        this.$els = {};

        this.$campaign = false;

        this.$manager = false;
    }

    create(source) {
        const template = `<a3m-wrapper data-campaign="${source.id}">
            <a3m-filler></a3m-filler>
            <a3m-container class="slide slided">
                <a3m-loader>
                    <a3m-loader-in class="shape-one"></a3m-loader-in>
                    <a3m-loader-in class="shape-two"></a3m-loader-in>
                    <a3m-loader-in class="shape-three"></a3m-loader-in>
                </a3m-loader>
                <a3m-youtube></a3m-youtube>
                <a3m-slot></a3m-slot>
            </a3m-container>
        </a3m-wrapper>`;

        const wrapper = source.script.replaceHtml(template);

        this.$els = {
            wrapper,
            filler: wrapper.find('a3m-filler'),
            container: wrapper.find('a3m-container'),
            slot: wrapper.find('a3m-slot')
        };

        return this;
    }

    /**
     * @return {Element|Boolean}
     */
    els(name) {
        return this.$els[name];
    }

    /**
     * @return {Element|Boolean}
     */
    slot() {
        return this.els('slot');
    }

    /**
     * @return {Campaign|Boolean}
     */
    campaign() {
        return this.$campaign;
    }

    /**
     * @return {Manager|Boolean}
     */
    manager() {
        return this.$manager;
    }

    /**
     * Helper method.
     *
     * @return {Controller}
     */
    controller() {
        return this.manager().controller();
    }

    /**
     * Initialize manager one time only.
     *
     * @return {Player}
     */
    initialize() {
        if (!this.$manager) {
            this.$manager = new Manager(this);
        }

        return this;
    }

    /**
     * Schedule tags one time only.
     *
     * @return {Player}
     */
    scheduleTags() {
        this.campaign().loaded()
            .forEach((tag, index) => {
                if (tag.failed()) {
                    tag.schedule();
                }
            });

        return this;
    }

    /**
     * Listener method.
     *
     * Gets called when a tag gets loaded.
     *
     * @return {Player}
     */
    tagListener() {
        console.info('One tag was updated this time and has some ads..');

        if (!this.manager().tag() || !this.controller().isPlaying()) {
            this.manager().initialize();
        }

        return this;
    }
}

/**
 * Makes the request to given campaign id and
 * then it sets the campaign that loads the tags.
 *
 * Makes an attempt to play
 * and schedules failed ones.
 *
 * @return {Promise}
 */
export default (source) => {
    const player = new Player(source);

    player.create(source);

    macro.setSizes(player.slot().size());

    return new Promise((resolve, reject) => {
        request_campaign(source)
            .then((campaign) => {
                campaign.addPlayer(player);

                player.$campaign = campaign;

                if (!player.campaign().loaded().length) {
                    console.warn(`No tags available for current browser.`);

                    return false;
                }

                player.initialize();

                player.scheduleTags();

                resolve(player);
            })
            .catch((e) => {
                console.error('request player catch', e);
            });
    });
};
