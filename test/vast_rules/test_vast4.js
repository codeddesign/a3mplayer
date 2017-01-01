import { describe, it } from 'mocha';
import { expect, assert } from 'chai';
import { readSyncFixtures, readSyncExpected, prettyjson, checkErrorStack, loadedVast } from '../utils';

const __test_dir = 'vast';

const fixtures = (() => {
    return {
        error: readSyncFixtures(__test_dir, 'vast4/error.xml')
    };
})()

const expected = (() => {
    return {
        error: readSyncExpected(__test_dir, 'vast4/error.json')
    };
})()

describe('vast - schema rules (vast4)', () => {
    it('should confirm JSON for vast direct error', () => {
        const loaded = loadedVast(fixtures.error);
        expect(loaded.data).eql(expected.error);
    })
});
