export default {
    app_path: 'http://a3mapp.dev',

    app_track: 'http://a3mapp.io:5000',

    filled_dump: 'http://a3mapp.dev/index.php',

    track_request: true,

    animator_fps: 60,

    filler: {
        client: 'ca-pub-1234567890123456',
        slot: 1234567890,
        pixels: -50
    },

    assets: [{
        name: 'style',
        tag: 'link',
        attributes: {
            rel: 'stylesheet',
            href: `http://a3mplayer.dev/style.css`
        }
    }, {
        name: 'player',
        tag: 'script',
        attributes: {
            src: `http://a3mplayer.dev/player.js`
        }
    }, {
        name: 'filler',
        tag: 'script',
        attributes: {
            src: '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
        }
    }]
};
