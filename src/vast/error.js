const errors = {
    100: 'XML parsing error.',
    101: 'VAST schema validation error.',
    102: 'VAST version of response not supported.',
    201: 'Video player expecting different linearity.',
    202: 'Video player expecting different linearity.',
    302: 'Wrapper limit reached, as defined by the video player. Too many Wrapper responses have been received with no InLine response.',
    303: 'No Ads VAST response after one or more Wrappers.',
    403: 'Couldn’t find MediaFile that is supported by this video player, based on the attributes of the MediaFile element.',
    405: 'Problem displaying MediaFile. Video player found a MediaFile with supported type but couldn’t display it.'
};

export default class VastError {
    constructor(code, info = false) {
        this.code = code;

        this.message = errors[code];

        this.stack = (new Error(info || this.message)).stack;
    }
};
