/**
 * Collection class for ads, creatives, mediafiles, ..
 *
 * Notes:
 * - forEach(), some(), filter() are direct implementations
 *   of Array, to ease up workflow.
 */
export default class Collection {
    constructor(items, schema) {
        this.$items = [];

        items = items || [];
        items.forEach((item) => {
            this.add(
                schema(item)
            );
        });

        this.sortBySequence();
    }

    /**
     * @param {Schema} item
     *
     * @return {Collection}
     */
    add(item) {
        this.$items.push(item);

        this.sortBySequence();

        return this;
    }

    /**
     * @return {Boolean}
     */
    isEmpty() {
        return this.$items.length == 0;
    }

    /**
     * @return {Array}
     */
    all() {
        return this.$items;
    }

    /**
     * @param {Function} callback
     *
     * @return {undefined}
     */
    forEach(callback) {
        return this.all().forEach(callback);
    }

    /**
     * @param {Function} callback
     *
     * @return {Boolean}
     */
    some(callback) {
        return this.all().some(callback);
    }

    /**
     * @param {Function} callback
     *
     * @return {Boolean}
     */
    filter(callback) {
        return this.all().filter(callback);
    }

    /**
     * Gets one item from the list that
     * meets the callback condition.
     *
     * @param {Function} condition
     *
     * @return {Schema|boolean}
     */
    one(condition) {
        let item = false;

        if (!(condition instanceof Function)) {
            throw new Error('Expected a function');
        }

        this.some((_item) => {
            if (condition(_item)) {
                item = _item;

                return true;
            }

            return false;
        });

        return item;
    }

    /**
     * @return {Schema|Boolean}
     */
    first() {
        return this.byIndex(0);
    }

    /**
     * The type can be any string that is an item 'type'.
     *
     * The condition callback must always
     *  return the given 'item' instead of 'true'
     *  and 'false' if it's not passing.
     *
     * @param {Boolean|String} type
     * @param {Function} condition
     *
     * @return {Array}
     */
    withType(type = false, condition = (item) => item) {
        if (!type) return this.$items;

        type = type.toLowerCase();

        const filtered = [];
        this.$items.forEach((item, index) => {
            if (!item.hasType(type)) {
                return false;
            }

            let _clone = item.clone();
            if (_clone = condition(_clone, index)) {
                filtered[index] = _clone;
            }
        });

        return filtered;
    }

    /**
     * @return {Collection}
     */
    sortBySequence() {
        this.$items.sort((a, b) => {
            if (typeof a.sequence != 'function') {
                return false;
            }

            return a.sequence() - b.sequence();
        });

        return this;
    }

    /**
     * @param {Integer} index
     *
     * @return {Schema|Boolean}
     */
    byIndex(index) {
        if (!this.$items[index]) {
            return false;
        }

        return this.$items[index];
    }

    /**
     * @param {Integer} index
     * @param {Schema} item
     *
     * @return {Collection}
     */
    replaceByIndex(index, item) {
        this.$items[index] = item.clone();

        return this;
    }
};
