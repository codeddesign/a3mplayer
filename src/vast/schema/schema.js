import rules from './rules';

export class SchemaError {
    constructor(message) {
        this.message = message;

        this.stack = (new Error(message)).stack;
    }
}

export default class Schema {
    constructor(json, expected_name = false) {
        this._validateJson(json);

        if (json instanceof Schema) {
            this._extend(json);
        } else {
            this._define(json);
        }

        this._validateExpectedName(expected_name);
    }

    /**
     * Tag's name (lowercase).
     *
     * @return {String}
     */
    tagName() {
        return this._tagName;
    }

    /**
     * Tag's value can be it's cdata,
     * an array containing it's children
     * or boolean:false.
     *
     * @return {String|Array|Boolean}
     */
    tagValue() {
        return this._tagValue;
    }

    /**
     * @return {Boolean}
     */
    valueIsArray() {
        return this._tagValue instanceof Array;
    }

    /**
     * Used when expected an
     * array as value.
     *
     * @return {Array}
     */
    valueAsArray() {
        if (!this.valueIsArray()) {
            return [];
        }

        return this._tagValue;
    }

    /**
     * False if value is not an array.
     * Empty array if name is not found.
     * Array with schemas that have the specified name.
     *
     * @param {String|Array} name
     *
     * @throws {Error} If name argument is missing (useful for dev)
     *
     * @return {Mixed}
     */
    valuesWithTagName(name) {
        if (!name) {
            throw new SchemaError(`Tag name is expected to be a string.`);
        }

        if (!this.valueIsArray()) {
            return false;
        }

        if (typeof name == 'string') {
            name = [name];
        }

        const names = new Set(...[name]);
        const filtered = [];
        this._tagValue.forEach((value) => {
            if (names.has(value.tagName())) {
                filtered.push(value);
            }
        });

        return filtered;
    }

    /**
     * Get first value with the specified name.
     *
     * @param {String|Array} name
     *
     * @return {Schema|Boolean}
     */
    valueWithTagName(name) {
        const filtered = this.valuesWithTagName(name);
        if (filtered.length) {
            return filtered[0];
        }

        return false;
    }

    /**
     * Get first value with the specified name.
     *
     * @param {Array} names
     *
     * @return {Schema|Boolean}
     */
    valueWithTagNameFrom(names = []) {
        return this.valueWithTagName(names);
    }

    /**
     * Helper method.
     *
     * Returns $type's value as string
     * or 'false'.
     *
     * @return {String|Boolean}
     */
    type() {
        return this.$type || false;
    }

    /**
     * Helper method.
     *
     * @param {String} name
     *
     * @return {Boolean}
     */
    hasType(name) {
        if (!this.type()) {
            return false;
        }

        return this.type().toLowerCase() == name.toLowerCase();
    }

    /**
     * Clone current Schema.
     *
     * If clean is 'false' return a clone of the Schema,
     *
     * If clean it's 'true', it filters all data that doesn't start with '_'.
     *  It will also go recursively through the rest of it's
     *  children, but skipping the ones
     *  with '$list' property.
     *
     * @param {Boolean} clean
     *
     * @return {Schema}
     */
    clone(clean = false) {
        const obj_ = Object.create(this);

        Object.keys(this).forEach((key) => {
            let value = this[key];

            if (!clean) {
                obj_[key] = value;

                return false;
            }

            if (!key.startsWith('_')) {
                // Manage handled collections
                if (value.all instanceof Function) {
                    value = value.all();
                }

                if (value instanceof Array) {
                    value.forEach((v, index) => {
                        if (v instanceof Schema && !v.$list) {
                            v = v.clone(clean);
                        }

                        value[index] = v;
                    });
                }

                obj_[key] = value;

                return false;
            }
        });

        return obj_;
    }

    /**
     * Return a clean representation of the current Schema.
     *
     * @return {Object}
     */
    clean() {
        return this.clone(true);
    }

    /**
     * Validate given Object.
     *
     * @param {Object} json
     *
     * @throws {Error} If the given attributes is not an object
     */
    _validateJson(json) {
        if (!(json instanceof Object)) {
            throw new SchemaError(`Expected 'Object' but got '${typeof json}'.`);
        }
    }

    /**
     * Validate Schema's name.
     *
     * @param {String} name
     *
     * @throws {Error} If expected name doesn't match current name (useful for dev)
     */
    _validateExpectedName(name) {
        if (name && name != this.tagName()) {
            throw new SchemaError(`'${this.constructor.name}' schema expected '${name}' as name. [${this.tagName()}]`);
        }
    }

    /**
     * Set all properties of the given Schema
     * to the current Schema.
     *
     * @param {Schema} json
     * @param {Boolean} direct
     *
     * @return {Schema}
     */
    _extend(json, direct = false) {
        Object.keys(json).forEach((key) => {
            if (!direct) {
                this[key] = json[key];

                return false;
            }

            // skip keys that start with '_' when it's direct extending
            if (!key.startsWith('_')) {
                this[key] = json[key];
            }
        });

        return this;
    }

    /**
     * Set tag name, it's attributes
     * and it's value.
     *
     * @param {Object} json
     *
     * @return {Schema}
     */
    _define(json) {
        this._addTagName(json)
            ._addTagAttributes(json)
            ._addTagValue(json);

        return this;
    }

    /**
     * Set Schema name.
     *
     * @throws {Error} If the name is undefined
     *
     * @param {Schema} json
     */
    _addTagName(json) {
        this._tagName = Object.keys(json)[0];

        if (!this._tagName) {
            throw new SchemaError(`Give tag doesn't have a name '${JSON.stringify(json)}'.`);
        }

        return this;
    }

    /**
     * Add all Object attributes to the current
     * one as it's properties.
     *
     * @throws {Error} If attributes is missing from Object
     *
     * @param {Object} json
     *
     * @return {Schema}
     */
    _addTagAttributes(json) {
        if (!json[this.tagName()].attributes) {
            throw new SchemaError(`Tag with name '${this.tagName()}' is missing attributes.`);
        }

        Object.keys(json[this.tagName()].attributes).forEach((key) => {
            this[`$${key}`] = json[this.tagName()].attributes[key];
        });

        return this;
    }

    /**
     * Add Object's value to the current Schema.
     *
     * If the value is an array it acts based upon rules:
     * - if the child name belongs to 'key_value_many'
     *   and it's not yet defined, it creates it as an empty array.
     *
     * - if the child name belongs to 'key_value' or to
     *   'collection' it ads it as property with it's value.
     *   When the property already exists, it makes it an array.
     *
     * - if the child name belongs to 'extend_direct' it ads all properties to
     *   the parent Schema and sets parent's 'type' with the child name.
     *
     * - if the child name belongs to 'extend_collection' it adds the name
     *   as 'type' and it's 'value' to parent's 'collection' property.
     *
     * If the value is not an array it adds it as is.
     *
     * @param {Schema} json
     */
    _addTagValue(json) {
        if (json[this.tagName()].value instanceof Array) {
            const _value = [];
            json[this.tagName()].value.forEach((value) => {
                const schema = new Schema(value),
                    schemaTagName = `$${schema.tagName()}`;

                // define key_value pairs that expects to have one or more values
                if (
                    rules.key_value_many.has(schema.tagName()) &&
                    !(this[schemaTagName] instanceof Array)
                ) {
                    this[schemaTagName] = [];
                }

                // 'key' as property and it's value as 'value' (array/string/false)
                if (
                    rules.key_value.has(schema.tagName()) ||
                    rules.collection.has(schema.tagName())
                ) {
                    const current = this[schemaTagName];
                    if (current instanceof Array && schema.tagValue()) {
                        this[schemaTagName].push(schema.tagValue());

                        return false;
                    }

                    this[schemaTagName] = schema.tagValue();

                    return false;
                }

                // 'type' with it's name and properties are added to parent
                if (rules.extend_direct.has(schema.tagName())) {
                    this.$type = schema.tagName();

                    this._extend(schema, true);

                    return false;
                }

                // 'type' with it's name and 'collection' keeping it's value as an unhandled collection
                if (rules.extend_collection.has(schema.tagName())) {
                    this.$type = schema.tagName();

                    this.$list = schema.tagValue();

                    return false;
                }

                _value.push(schema);
            });

            this._tagValue = _value;

            return this;
        }

        this._tagValue = json[this.tagName()].value

        return this;
    }
};
