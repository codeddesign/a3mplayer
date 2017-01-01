import $ from './element';
import { parse_link } from './parse_link';

/**
 * Get information about the js element.
 * Used to create the player.
 */
class Source {
    constructor(script) {
        const link = parse_link(script.src).link,
            matched = link.file_name.match(/\d+/g);

        if (!matched.length) {
            throw new Error('Failed to parse source id.');
        }

        this.id = matched[0];

        this.path = link.base;

        this.script = $(script);
    }
}

export default (() => {
    return new Source(document.currentScript);
})();
