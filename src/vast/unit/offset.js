import seconds from './seconds';

/**
 * Determine offset in seconds with
 *  given 'duration' and vast's offset value.
 *
 * Vast's offset can be in a time format (hh:mm:ss)
 *  or a percentage.
 *
 * @param {String} duration
 * @param {String} offset
 *
 * @return {Integer}
 */
export default (duration, offset) => {
    duration = seconds(duration).toInteger();

    if (!offset.includes('%')) {
        return seconds(offset).toInteger();
    }

    offset = parseInt(offset);

    return Math.round(offset / 100 * duration);
};
