import config from '../../../config';

function AnimatorAudio(video) {
    let audio = new Audio,
        canplay = false,
        _play,
        _pause;

    audio.src = video.src;
    audio.preload = 'metadata';
    audio.isPlaying = false;
    audio.isMuted = true;

    audio.addEventListener('canplaythrough', function() {
        if (!canplay) {
            canplay = true;

            audio.play();
        }
    })

    _play = audio.play;
    audio.play = function() {
        if (!canplay) {
            audio.load();

            return false;
        }

        if (!canplay || audio.isPlaying) {
            return false;
        }

        audio.isPlaying = true;

        audio.currentTime = video.currentTime;

        _play.apply(this, arguments);
    }

    _pause = audio.pause;
    audio.pause = function() {
        if (!audio.isPlaying) {
            return false;
        }

        audio.isPlaying = false;

        video.currentTime = audio.currentTime;

        _pause.apply(this, arguments);
    }

    return audio;
}

export default function(HTML5) {
    const fps = config.animator_fps;

    let self = this,
        video = HTML5.unit(),
        next,
        hasFuture,
        audio = false;

    function draw() {
        if (video.isPaused || video.hasFinished) {
            return false;
        }

        if (video.currentTime >= video.duration) {
            video.hasFinished = true;

            HTML5.stop();

            return false;
        }

        if (!audio.isPlaying) {
            // console.log('from video');

            requestAnimationFrame(draw);
        }

        next = video.currentTime + fps / 1000;
        hasFuture = video.readyState >= video.HAVE_FUTURE_DATA;

        if (video.currentTime <= next && hasFuture) {
            video.currentTime = next;
        }
    }

    video.hasFinished = false;
    video.isPaused = true;

    video.addEventListener('canplaythrough', function() {
        if (!audio) {
            audio = new AnimatorAudio(video);
        }
    })

    video.addEventListener('timeupdate', function() {
        if (audio.isPlaying && !video.isPaused && !video.hasFinished) {
            // console.log('from audio')

            requestAnimationFrame(draw);

            if (audio.currentTime - video.currentTime > .1) {
                video.currentTime = audio.currentTime;
            }
        }
    })

    video.play = function(forced) {
        if (!video.isPaused && !forced) return false;

        video.isPaused = false;

        draw();

        video.onplay(); //direct call

        if (!audio.isPlaying && !audio.isMuted && typeof audio.play !== 'undefined') {
            audio.play();
        }
    }

    video.pause = function() {
        if (video.isPaused) return false;

        video.isPaused = true;

        video.onpause(); //direct call

        if (audio.isPlaying && !audio.isMuted) {
            audio.pause();
        }
    }

    video.stop = function() {
        video.hasFinished = true;
        video.currentTime = video.duration;
    }

    video.unmute = function() {
        if (video.hasFinished || !audio.isMuted) return false;

        audio.isMuted = false;

        if (!video.isPaused) {
            audio.play();
        }
    }

    video.mute = function() {
        if (video.hasFinished || audio.isMuted) return false;

        audio.isMuted = true;

        audio.pause();

        if (!video.isPaused) {
            video.play(true);
        }
    }

    return video;
}
