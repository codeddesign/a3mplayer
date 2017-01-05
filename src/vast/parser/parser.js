export class XMLParserError {
    constructor(message) {
        this.message = message;

        this.stack = (new Error(message)).stack;
    }
}

export class XMLParser {
    constructor() {
        this.xml = null;

        this.__json = null;

        this.__chunk = null;

        this.__failed = '__failed';
    }

    /**
     * Get parsed xml in json format
     *
     * @return {Object}
     */
    json() {
        return this.__json;
    }

    /**
     * Prepare xml and parse it
     *
     * @param {String} xml
     *
     * @return {XMLParser}
     */
    parse(xml) {
        xml = xml || '';

        this._xmlRemoveDefinition(xml)
            ._xmlInline()
            ._xmlEndTags();

        this.__json = this._parseTag();

        this.__validateJson();

        return this;
    }

    /**
     * Determine if a failed pattern exists
     * in the parsed json.
     *
     * @throws {Error} If failed to parse
     *
     * @return {XMLParser}
     */
    __validateJson() {
        let stringified = JSON.stringify(this.__json),
            position;

        if ((position = stringified.indexOf(this.__failed)) !== -1) {
            throw new XMLParserError(`Failed to parse ${stringified.substr(0, position)}`);
        }

        return this;
    }

    /**
     * Remove "<?xml ..?>" definition
     *
     * @param {String} xml
     *
     * @return {XMLParser}
     */
    _xmlRemoveDefinition(xml) {
        let matched = xml.match(new RegExp(/(<\?xml(.*?)\?>)/));
        if (!matched) {
            throw new XMLParserError(`'${xml}' is not a valid xml.`);
        }

        xml = xml.replace(matched[0], '');

        this.xml = xml;

        return this;
    }

    /**
     * Remove any spaces or new lines
     *
     * @return {XMLParser}
     */
    _xmlInline() {
        this.xml = this.xml.split('\n')
            .map((line) => {
                return line.trim();
            })
            .join('');

        if (!this.xml.length) {
            throw new XMLParserError(`XML has no body.`)
        }

        return this;
    }

    /**
     * Replace non-ending tags (e.g.: "<tag/>" / "<tag id="123"/>")
     *
     * @return {XMLParser}
     */
    _xmlEndTags() {
        const expression = {
            single: /<(.*?)\s?\/>/,
            global: /<(.*?)\s?\/>/g
        };

        let matched;
        if (matched = this.xml.match(new RegExp(expression.global))) {
            matched.forEach((one) => {
                // Regex matches any content. So we need to slice from last "><" found
                one = one.slice(one.lastIndexOf('><') + 1)

                if (matched = one.match(new RegExp(expression.single))) {
                    const name = this._getTagName(matched[0]);

                    this.xml = this.xml
                        .replace(matched[0], `${matched[0]}</${name}>`)
                        .replace('/>', '>');
                }
            })
        }

        return this;
    }

    /**
     * Set current chunk to current xml is not set
     * and then return it.
     *
     * @return {String}
     */
    _chunk() {
        if (this.__chunk === null) {
            this.__chunk = this.xml;
        }

        return this.__chunk;
    }

    /**
     * Parse tag from current chunk
     *
     * @param {Object} tag
     * @param {Array|null} siblings
     *
     * @return {Object|Array}
     */
    _parseTag(tag = {}, siblings) {
        if (this.__json) {
            return this.__json;
        }

        let name = this._getTagName(),
            key = name.toLowerCase(),
            tagParts = this._getTagByName(name);

        if (name && tagParts) {
            tag = this._getTagData(tagParts);

            // First: add children
            if (tag[key].value === false) {
                this.__chunk = tagParts.body;

                let children = this._parseTag();

                // Add it to a new array when it has only one
                if (!(children instanceof Array)) {
                    children = [children];
                }

                tag[key].value = children;
            }

            // Then: add siblings
            let matched;
            if ((matched = tagParts.input.replace(tagParts.matched, '')).length) {
                this.__chunk = matched;

                if (!this.__chunk.trim().length) {
                    debugger;
                }

                // Initiate siblings array
                if (!siblings) {
                    siblings = [];
                }

                // Push current tag
                siblings.push(tag);

                // Push last sibling
                const sibling = this._parseTag({}, siblings);

                if (!(sibling instanceof Array)) {
                    siblings.push(sibling);
                }

                return siblings;
            }

            return tag;
        }

        return this.__failed;
    }

    /**
     * Parse a tag name for the given source
     * or for the current chunk
     *
     * @param {String|undefined} source
     *
     * @return {String|Boolean}
     */
    _getTagName(source) {
        let matched;

        source = source || this._chunk();

        if (matched = source.match(new RegExp(/<([^\!].*?)\s?>/))) {
            return matched[1].split(' ').shift().replace('/', '');
        }

        return false;
    }

    /**
     * Get tag's matched chunks
     *
     * @param {String} name
     *
     * @return {Object|Boolean}
     */
    _getTagByName(name) {
        let matched,
            tag = false;

        if (matched = this._chunk().match(new RegExp(`<${name}(.*?)>(.*?)<\/${name}>`))) {
            tag = {
                name,
                input: matched.input.trim(),
                matched: matched[0],
                attributes: matched[1],
                body: matched[2]
            };

            // if parent tag is contained inside it's body match start-end
            if (tag.body.includes(`<${name}`) && !tag.body.includes(`</${name}`)) {
                matched = this._chunk().match(new RegExp(`^(<${name}(.*?)>)(.*?)(<\/${name}>)$`));

                tag = {
                    name,
                    input: matched.input.trim(),
                    matched: matched[0],
                    attributes: matched[2],
                    body: matched[3]
                };
            }

            return tag;
        }

        return tag;
    }

    /**
     * Get tag data/text in case it has no children
     *
     * @param {Object} tag
     *
     * @return {Object}
     */
    _getTagData(tag) {
        let key = tag.name.toLowerCase(),
            data = {},
            cdata;

        data[key] = {
            name: tag.name,
            value: false,
            attributes: {}
        };

        // Add attributes
        tag.attributes.split(' ').forEach((split) => {
            let matched;
            if (matched = split.match(/(.*?)="(.*?)"/)) {
                data[key].attributes[matched[1].toLowerCase()] = matched[2];
            }
        });

        // Determine it's text
        if (cdata = this._getCData(tag.body)) {
            data[key].value = cdata;
        } else if (!tag.body.startsWith('<')) {
            data[key].value = tag.body.trim();
        }

        return data;
    }

    /**
     * If it's not CDATA it returns 'false'.
     * Otherwise it will split the CDATA
     *   and loop throw all of them  (if many)
     *
     * @param {String} body
     *
     * @return {String|Boolean}
     */
    _getCData(body) {
        let matched,
            cdata = '',
            ending = ']]>';

        if (!(matched = this._matchCData(body))) {
            return false;
        }

        body.split(ending).forEach((slice) => {
            slice += ending;

            if (matched = this._matchCData(slice)) {
                cdata += matched[1];
            }
        });

        return cdata;
    }

    /**
     * Returns the matched CDATA.
     *
     * @param {String} body
     *
     * @return {String|Boolean}
     */
    _matchCData(body) {
        return body.match(/^<\!\[CDATA\[(.*?)\]\]>/);
    }
}

export default ((xml) => {
    const parser = new XMLParser()

    parser.parse(xml);

    return parser;
});
