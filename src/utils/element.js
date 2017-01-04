/**
 * Creates a virtual element with properties and event listeners.
 */
export const create = (tag, properties = {}, events = {}) => {
    let virtual = document.createElement(tag);

    Object.keys(properties).forEach((key) => {
        if (key.includes('data')) {
            Object.keys(properties[key]).forEach((_key) => {
                virtual.dataset[_key] = properties[key][_key];
            });

            return false;
        }

        virtual[key] = properties[key];
    });

    Object.keys(events).forEach((key) => {
        virtual[key] = () => {
            events[key].apply(virtual)
        };
    });

    return virtual;
}

/**
 * Minimal jQuery-like custom class.
 */
class Element {
    constructor(node) {
        if (typeof node == 'string') {
            node = (new Element(document).find(node)).node;
        }

        this.node = node || document;

        return this;
    }

    find(selector, hasWarning = true) {
        const found = this.node.querySelector(selector);

        if (!found) {
            if (hasWarning) {
                console.warn('Failed to find: ' + selector);
            }

            return false;
        }

        return new Element(found);
    }

    findId(id) {
        return this.find('#' + id);
    }

    findAll(selector) {
        const els = this.node.querySelectorAll(selector);
        let list = [],
            i;

        for (i = 0; i < els.length; i++) {
            list.push(new Element(els[i]));
        }

        return list;
    }

    data() {
        return this.node.dataset;
    }

    html(content = false) {
        if (content === false) {
            return this.node.innerHTML;
        }

        this.node.innerHTML = content.trim();

        return new Element(this.node.firstChild);
    }

    htmlOuter() {
        return this.node.outerHTML.trim();
    }

    css(property, value) {
        this.node.style[property] = value;

        return this;
    }

    hasClass(class_) {
        return this.classes().contains(class_);
    }

    addClass(class_) {
        if (!this.hasClass(class_)) {
            this.classes().add(class_);
        }

        return this;
    }

    removeClass(class_) {
        if (this.hasClass(class_)) {
            this.classes().remove(class_);
        }

        return this;
    }

    classes() {
        return this.node.classList;
    }

    classesStr() {
        return this.classes().toString();
    }

    toggleClasses(first, second) {
        let temp;

        if (this.hasClass(first)) {
            temp = first;
            first = second;
            second = temp;
        }

        this.addClass(first);
        this.removeClass(second);

        return this;
    }

    attr(name, value = false) {
        if (value === false) {
            return this.node.getAttribute(name);
        }

        this.node.setAttribute(name, value);

        return this;
    }

    remove() {
        this.parent().node.removeChild(this.node);

        return this;
    }

    parent() {
        return new Element(this.node.parentNode);
    }

    style(key, value) {
        this.node.style[key] = value;

        return this;
    }

    append(tag, properties, events) {
        let virtual = create(tag, properties, events);

        this.node.appendChild(virtual);

        return new Element(virtual);
    }

    before(tag, properties, events, remove = false) {
        let virtual = create(tag, properties, events);

        this.parent().node.insertBefore(virtual, this.node.nextSibling);

        if (remove) {
            this.remove();
        }

        return new Element(virtual);
    }

    replace(tag, properties, events) {
        return this.before(tag, properties, events, true);
    }

    replaceHtml(content) {
        let virtual = create('div'),
            fresh;

        virtual.innerHTML = content.trim();

        this.parent().node.insertBefore(virtual.firstChild, this.node.nextSibling);

        fresh = this.node.nextSibling;

        this.node.remove();

        return new Element(fresh);
    }

    select() {
        this.node.select();

        return this;
    }

    bounds() {
        return this.node.getBoundingClientRect();
    }

    inView() {
        const bottomPixels = 10, // extra button pixels required
            bounds = this.bounds(),
            fullHeight = bounds.height || 360,
            halfHeight = fullHeight / 2,
            topAbs = Math.abs(bounds.top),
            diffAbs = window.innerHeight - topAbs,
            inView = bounds.top < window.innerHeight && bounds.bottom > 0,
            inViewPercentage = diffAbs >= (halfHeight + bottomPixels),
            mustPause = (bounds.top < 0 && topAbs >= halfHeight) || (diffAbs <= halfHeight) || false,
            mustPlay = inView && inViewPercentage && !mustPause;

        return {
            mustPlay,
            mustPause,
            diffAbs
        };
    }

    offset() {
        return {
            left: this.node.offsetLeft,
            right: this.node.offsetRight
        };
    }

    size(size = false) {
        if (size) {
            Object.keys(size).forEach((key) => {
                this.style(key, `${size[key]}px`);
            });
        }

        return {
            width: this.node.offsetWidth,
            height: this.node.offsetHeight
        };
    }

    sub(evName, callback) {
        this.node.addEventListener(evName, (ev) => {
            callback.call(this, ev, this)
        });
    }

    pub(evName, data = {}) {
        const event = new CustomEvent(evName, { detail: data });

        this.node.dispatchEvent(event);
    }
}

export default (node) => new Element(node);
