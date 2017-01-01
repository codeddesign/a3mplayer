import { describe, it } from 'mocha';
import { expect, assert } from 'chai';
import { readSyncFixtures, readSyncExpected, prettyjson, checkErrorStack, loadedVast } from '../utils';

const __test_path = 'vast';

const fixtures = (() => {
    return {
        kaltura: readSyncFixtures(__test_path, 'vast3/kaltura.xml'),
        unruly_linear_ad: readSyncFixtures(__test_path, 'vast3/unruly_linear_ad.xml'),
        unruly_linear_non_linear_ads: readSyncFixtures(__test_path, 'vast3/unruly_linear_non_linear_ads.xml'),
        videoplaza: readSyncFixtures(__test_path, 'vast3/videoplaza.xml')
    };
})()

const expected = (() => {
    return {
        kaltura: readSyncExpected(__test_path, 'vast3/kaltura.json'),
        unruly_linear_ad: readSyncExpected(__test_path, 'vast3/unruly_linear_ad.json'),
        unruly_linear_non_linear_ads: readSyncExpected(__test_path, 'vast3/unruly_linear_non_linear_ads.json'),
        videoplaza: readSyncExpected(__test_path, 'vast3/videoplaza.json')
    };
})()

describe('vast - schema rules (vast3)', () => {
    it('should confirm JSON body for kaltura', () => {
        const loaded = loadedVast(fixtures.kaltura);
        expect(loaded.data).eql(expected.kaltura);
    })

    it('should confirm JSON body for unruly_linear_ad', () => {
        const loaded = loadedVast(fixtures.unruly_linear_ad);
        expect(loaded.data).eql(expected.unruly_linear_ad);
    })

    it('should confirm JSON body for unruly_linear_non_linear_ads', () => {
        const loaded = loadedVast(fixtures.unruly_linear_non_linear_ads);
        expect(loaded.data).eql(expected.unruly_linear_non_linear_ads);
    })

    it('should confirm JSON body for videoplaza', () => {
        const loaded = loadedVast(fixtures.videoplaza);
        expect(loaded.data).eql(expected.videoplaza);
    })
});
