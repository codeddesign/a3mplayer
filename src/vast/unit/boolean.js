/**
 * If value is 'undefined' and a default
 *  is given, then it will return it.
 *
 * @param {String} value
 * @param {Boolean|Null} _default
 *
 * @return {Boolean}
 */
export default (value, _default = null) => {
    if (!value && _default !== null) {
        return _default;
    }

    return (value == 'true' || value == true) ? true : false;
};
