/**
 * Current device browser.
 */
class Device {
    constructor() {
        this.agent = navigator.userAgent;

        this.platform = navigator.platform;
    }

    mobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.agent);
    }

    igadget() {
        return /webOS|iPhone|iPad|iPod/i.test(this.agent)
    }

    iphone() {
        const agent = /iPhone|iPod/i.test(this.agent),
            platform = /iPhone|iPod/i.test(this.platform);

        return agent && platform;
    }

    flash() {
        let flash = false;
        Object.keys(navigator.plugins).forEach((key) => {
            const plugin = navigator.plugins[key];

            Object.keys(plugin).forEach((key) => {
                const mime = plugin[key];

                if (mime.type == 'application/x-shockwave-flash') {
                    flash = true;
                }
            })
        })

        return flash;
    }
}

export default (() => {
    return new Device();
})();
