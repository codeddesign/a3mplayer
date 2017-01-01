import VastError from './error';
import parseXML from './parser/parser';
import createVast from './factory/vast';
import ajax from '../utils/ajax';

export default (xml) => {
    let json, vast;

    try {
        json = parseXML(xml).json();
    } catch (e) {
        // Parser error
        throw new VastError(100, e.message);
    }

    try {
        vast = createVast(json);
    } catch (e) {
        if (!(e instanceof VastError)) {
            // Schema error
            throw new VastError(101, e.message);
        }

        // Vast error
        throw e;
    }

    return vast;
};
