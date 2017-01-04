import scriptSource from './source';
import { add_assets } from './assets';
import $ from './utils/element';
import { parse_link } from './utils/parse_link';

window.addEventListener('message', (ev) => {
    if (ev.origin != parse_link(location.href).base) return false;

    if (ev.data == 'player-exists') {
        $('body').pub('player-init', scriptSource);
    }
});

add_assets()
    .then(() => {
        $('body').pub('player-init', scriptSource);
    })
    .catch((e) => {
        console.error('assets catch', e);
    });
