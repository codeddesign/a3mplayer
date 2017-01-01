import createPlayer from './player';
import $ from '../utils/element';

window.postMessage('player-exists', location.href);

$('body').sub('player-init', (event) => {
    const source = event.detail;

    if (source.initiated) {
        return false;
    }

    source.initiated = true;

    createPlayer(source)
        .then((player) => {
            console.log('player-init', player);
        })
        .catch((e) => {
            console.error('create player catch', e);
        });
});
