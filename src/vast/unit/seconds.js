class Seconds {
    /**
     * @param {String} time in format hh:mm:ss
     *
     * @return {Seconds}
     */
    constructor(time) {
        this.time = time;
    }

    /**
     * Number of seconds in given time.
     *
     * @return {Integer}
     */
    toInteger() {
        if (typeof this.time == 'number') {
            return this.time;
        }

        const [hour, minute, second] = this.time.split(':');

        let seconds = parseInt(second);
        seconds += 60 * parseInt(minute);
        seconds += 60 * 60 * parseInt(hour);

        return seconds;
    }

    /**
     * Returns an array having the same
     * number of elements as given time in seconds,
     * starting from '0'.
     *
     * @return {Array}
     */
    toArray() {
        const seconds = this.toInteger();

        return [...Array(seconds).keys()];
    }
}

export default (time) => {
    return new Seconds(time);
};
