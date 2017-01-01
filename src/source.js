import { parse_link } from './utils/parse_link';
import $ from './utils/element';

/**
 * Get information about the js element
 * used to create the player.
 */
class Source {
    constructor(script) {
        const link = parse_link(script.src),
            matched = link.file_name.match(/\d+/g) || [1];

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
