import syspath from 'path';
import sysfs from 'fs';
import vastLoadXML from '../src/vast/base';

export const readSync = (file_path) => {
    file_path = syspath.resolve(__dirname, file_path);

    let content = sysfs.readFileSync(file_path, 'utf-8');

    if (file_path.includes('.json')) {
        content = JSON.parse(content);
    }

    return content;
};

export const readSyncFixtures = (dir, file) => {
    return readSync(`${dir}/fixtures/${file}`);
};

export const readSyncExpected = (dir, file) => {
    return readSync(`${dir}/expected/${file}`);
};

export const prettyjson = (json, spaces = '  ') => {
    console.log(
        JSON.stringify(json, null, spaces)
    );
};

export const checkErrorStack = (callback) => {
    try {
        callback();
    } catch (e) {
        console.log(e);
    }
};

export const loadedVast = (source, print) => {
    const vast = vastLoadXML(source),
        data = JSON.parse(JSON.stringify(vast.clean()));

    if (print) prettyjson(data);

    return { vast, data };
}
