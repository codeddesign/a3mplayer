import macro from './macro';
import Manager from './manager/manager';
import { request_campaign } from './request';
import $ from '../utils/element';
import { create } from '../utils/element';
import { referrer } from '../utils/parse_link';
import config from '../../config';

class Player {
    constructor() {
        this.$els = {};

        this.$campaign = false;

        this.$manager = false;
    }

    create(source) {
        const template = `<a3m-wrapper data-campaign="${source.id}">
            <a3m-filler class="hidden">${this.fillerHtml()}</a3m-filler>
            <a3m-container class="slide slided">
                <a3m-loader class="hidden">
                    <a3m-loader-in class="shape-one"></a3m-loader-in>
                    <a3m-loader-in class="shape-two"></a3m-loader-in>
                    <a3m-loader-in class="shape-three"></a3m-loader-in>
                </a3m-loader>
                <a3m-youtube></a3m-youtube>
                <a3m-slot></a3m-slot>
                <a3m-sound class="hidden on"></a3m-sound>
            </a3m-container>
        </a3m-wrapper>`;

        const wrapper = source.script.replaceHtml(template);

        this.$els = {
            wrapper,
            filler: wrapper.find('a3m-filler'),
            container: wrapper.find('a3m-container'),
            loader: wrapper.find('a3m-loader'),
            slot: wrapper.find('a3m-slot'),
            sound: wrapper.find('a3m-sound')
        };

        let sizes = this.slot().size();

        if (this.campaign().isSidebarInfinity()) {
            wrapper.addClass('sidebarinfinity');

            if (wrapper.bounds().top <= 0) {
                wrapper.addClass('fixed');
            }

            this.els('filler').show();

            sizes = { width: 300, height: 169 };
        }

        macro.setSizes(sizes);

        return this;
    }

    fillerHtml() {
        if (this.campaign().isOnScroll()) {
            return '';
            return `<ins class="adsbygoogle" style="display:inline-block;width:336px;height:280px"
                data-ad-client="${config.filler.client}"
                data-ad-slot="${config.filler.slot}">
            </ins>`;
        }

        if (this.campaign().isSidebarInfinity()) {
            return `<a3m-fbfiller>
                <a3m-fbwrapper>
                    <a3m-fblike>
                        <iframe
                        src="https://www.facebook.com/plugins/like.php?href=${referrer.complete}&appId=${config.fb_appID}&width=61&layout=button_count&action=like&size=small&show_faces=false&share=false&height=21"
                        width="86" height="21" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
                    </a3m-fblike>
                    <a3m-fbshare>
                        <iframe
                        src="https://www.facebook.com/plugins/share_button.php?href=${referrer.complete}&appId=${config.fb_appID}&layout=button_count&size=small&mobile_iframe=true&width=88&height=20"
                        width="96" height="20" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
                    </a3m-fbshare>
                </a3m-fbwrapper>
            </a3m-fbfiller>`;
        }

        return '';
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

        if (this.controller().isFilled()) {
            return this;
        }

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

    return new Promise((resolve, reject) => {
        request_campaign(source)
            .then((campaign) => {
                player.$campaign = campaign;

                player.create(source);

                campaign.addPlayer(player);

                campaign.requestTags()
                    .then((tags) => {
                        player.$campaign.$loaded = tags;

                        if (!player.campaign().loaded().length) {
                            console.warn(`No tags available for current browser.`);

                            return false;
                        }

                        player.initialize();

                        player.scheduleTags();

                        resolve(player);
                    });
            })
            .catch((e) => {
                console.error('request player catch', e);
            });
    });
};
