import createMediaFile from './mediafile';
import seconds from '../unit/seconds';

class Trackingevents {
    constructor(events, duration) {
        events = events || [];

        this.$start = [];
        this.$firstquartile = [];
        this.$midpoint = [];
        this.$thirdquartile = [];
        this.$complete = [];
        this.$pause = [];
        this.$resume = [];
        this.$mute = [];
        this.$unmute = [];
        this.$expand = [];
        this.$collapse = [];
        this.$rewind = [];
        this.$skip = [];
        this.$close = [];
        this.$closelinear = [];
        this.$creativeview = [];
        this.$fullscreen = [];
        this.$acceptinvitation = [];
        this.$exitfullscreen = [];
        this.$acceptinvitationlinear = [];

        this.$progress = {};

        this._addProgress(duration);

        events.forEach((value) => {
            if (value.$offset) {
                this._addUri(value);

                return false;
            }

            this._addEvent(value);
        });
    }

    add(trackingEvents) {
        Object.keys(trackingEvents).forEach((key) => {
            // Just in case: if wrapper has $progress too
            if (key == '$progress') {
                Object.keys(this[key]).forEach((second) => {
                    if (trackingEvents[key][second]) {
                        this[key][second].push(
                            ...trackingEvents[key][second]
                        );
                    }
                });

                return false;
            }

            this[key].push(...trackingEvents[key]);
        });

        return this;
    }

    _addProgress(duration) {
        seconds(duration).toArray().forEach((second) => {
            second++;

            this.$progress[second] = [];
        });

        return this;
    }

    _addUri(value) {
        const _seconds = seconds(value.$offset).toInteger();

        if (!this.$progress[_seconds]) {
            this.$progress[_seconds] = [];
        }

        this.$progress[_seconds].push(
            value.tagValue()
        );

        return this;
    }

    _addEvent(value) {
        this[`$${value.$event.toLowerCase()}`].push(
            value.tagValue()
        );

        return this;
    }
};

export default (events, duration) => {
    return new Trackingevents(events, duration);
};
