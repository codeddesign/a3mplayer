/**
 * Extends given object with the source.
 *
 * If 'direct' contains items, those items are being checked
 * for existence and it adds them directly to object.
 *
 * @param {Object} object
 * @param {Object} source
 * @param {Array} direct
 * @param {Boolean} mark_key
 *
 * @return {Object}
 */
export const extend_object = (object, source, direct = [], mark_key = true) => {
    if (!(direct instanceof Set)) {
        direct = new Set([...direct]);
    }

    Object.keys(source).forEach((key) => {
        if (direct.has(key)) {
            extend_object(object, source[key], direct);

            return false;
        }

        if (mark_key) {
            object[`$${key}`] = source[key];
        } else {
            object[key] = source[key];
        }
    });

    return object;
};
