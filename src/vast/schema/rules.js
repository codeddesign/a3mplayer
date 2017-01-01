export default {
    key_value: new Set([
        // inline
        'adsystem',
        'adtitle',
        'description',
        'survey',
        'error',
        'impression',

        // wrapper
        'vastadtaguri',

        // linear
        'duration',

        // companion/nonlinearads
        'iframeresource',
        'htmlresource',
        'staticresource',

        // trackingevents
        'companionclickthrough',
        'alttext',
        'adparameters',
    ]),
    key_value_many: new Set([
        'impression',
        'error'
    ]),
    collection: new Set([
        'extensions',
        'creatives',
        'trackingevents',
        'mediafiles',
        'videoclicks'
    ]),
    extend_direct: new Set([
        'inline',
        'wrapper',
        'linear',
    ]),
    extend_collection: new Set([
        'companionads',
        'nonlinearads'
    ])
};
