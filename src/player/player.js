import macro from './macro';
import Manager from './manager/manager';
import { request_campaign } from './request';
import $ from '../utils/element';

class Player {
    constructor() {
        this.$target = false;

        this.$campaign = false;

        this.$manager = false;
    }

    setTarget(source) {
        this.$target = source.script.replace('div', {
            className: 'a3mplayer',
            data: {
                campaign: source.id
            }
        });

        this.$target.size({
            maxWidth: 640,
            maxHeight: 360,
            minWidth: 640,
            minHeight: 360
        });

        return this;
    }

    /**
     * @return {Element|Boolean}
     */
    target() {
        return this.$target;
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

    initialize() {
        this.$manager = new Manager(this);
    }

    scheduleTags() {
        this.campaign().loaded()
            .forEach((tag, index) => {
                if (tag.failed()) {
                    tag.schedule(this, index);
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
        console.log('some tag was updated this time and has some ads..');

        // if no ad is playing.. handle it..

        return this;
    }
}

/**
 * Makes the request to given uri/source and
 * then it sets the campaign that loads the tags.
 *
 * Makes an attempt to play
 * and schedules failed ones.
 *
 * @param {String|Source} uri
 *
 * @return {Promise}
 */
export default (source) => {
    const uri = `${source.path}/campaign/${source.id}.json`,
        player = new Player(source);

    player.setTarget(source);

    macro.setSizes(
        player.target().size()
    );

    return new Promise((resolve, reject) => {
        request_campaign(uri)
            .then((campaign) => {
                player.$campaign = campaign;
                if (!player.campaign().loaded().length) {
                    // @@todo: error logging
                    console.error(`No tags available for current browser.`);

                    return false;
                }

                player.initialize();

                $().sub('touchend', () => {
                    // @@todo: loadUnit checks for mobile

                    // player.manager().video().node().load(); // works for html5

                    // player.manager().video().unit().load(); // ..
                })

                player.scheduleTags();

                resolve(player);
            })
            .catch((e) => {
                console.error('request player catch', e);
            });
    });
};
