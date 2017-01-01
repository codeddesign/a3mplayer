class VideoClicks {
    constructor(videoclicks) {
        videoclicks = videoclicks || [];

        this.$clickthrough = [];
        this.$clicktracking = [];
        this.$customclick = [];

        videoclicks.forEach((click) => {
            const name = `$${click.tagName()}`;
            if (!this[name]) {
                this[name] = [];
            }

            this[name].push(click.tagValue());
        });
    }

    /**
     * Add uris to current ones.
     *
     * @param {Object} videoClicks
     */
    add(videoClicks) {
        Object.keys(videoClicks).forEach((key) => {
            this[key].push(
                ...videoClicks[key]
            );
        });

        return this;
    }

    /**
     * Get the video 'click' uri.
     *
     * Note: it should be only one.
     *
     * @return {String|Boolean}
     */
    clickThrough() {
        const length = this.$clickthrough.length;
        if (!length) {
            return false;
        }

        return this.$clickthrough[length - 1];
    }
};

export default (videoclicks) => {
    return new VideoClicks(videoclicks);
};
