import macro from '../macro';
import device from '../../utils/device';

class Media {
    constructor(mediaFiles) {
        this.$mediaFiles = mediaFiles;

        this.$framework = false;

        this.$preferred = [];

        this.$priority = [];

        this.$sizes = {
            width: macro.get('width'),
            height: macro.get('height')
        };

        this._setPriority()
            ._setByFramework()
            ._setByPriority()
            ._setByFirstType()
            ._setBySizes();
    }

    mediaFiles() {
        return this.$mediaFiles;
    }

    framework() {
        return this.$framework;
    }

    preferred() {
        return this.$preferred;
    }

    preferFramework() {
        this.$framework = true;

        return this;
    }

    _setPriority() {
        const priority = new Set([
            'video/mp4',
            'video/ogg',
            'video/webm',
            'video/x-flv',
            'application/x-shockwave-flash',
            'text/javascript',
            'application/javascript',
            'application/x-javascript'
        ]);

        if (!device.flash()) {
            priority.delete('video/x-flv');
            priority.delete('application/x-shockwave-flash');
        }

        this.$priority = [...priority];

        return this;
    }

    _setByFramework() {
        this.$preferred = this.mediaFiles().filter((media) => {
            if (this.framework() && media.isVPAID()) {
                return true;
            }

            return !media.isVPAID();
        });

        if (!this.preferred().length) {
            this.$preferred = this.mediaFiles();
        }

        return this;
    }

    _priorityIndex(type) {
        const index = this.$priority.indexOf(type);

        return (index === -1) ? this.$priority.length : index;
    }

    _setByPriority() {
        this.preferred().sort((a, b) => {
            return this._priorityIndex(a.type()) - this._priorityIndex(b.type());
        });

        return this;
    }

    _setByFirstType() {
        if (!this.preferred().length) {
            return this;
        }

        const type = this.preferred()[0].type();

        this.$preferred = this.preferred().filter((media) => {
            return media.type() == type;
        });

        return this;
    }

    _setBySizes() {
        this.preferred().sort((a, b) => {
            return a.width() - this.$sizes.width
        });

        return this;
    }
}

export default (mediaFiles) => {
    return (new Media(mediaFiles)).preferred()[0];
};
