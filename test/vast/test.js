import { describe, it } from 'mocha';
import { expect, assert } from 'chai';
import { readSyncFixtures, readSyncExpected, prettyjson, checkErrorStack } from '../utils';
import vastLoadXML from '../../src/vast/base';

const __test_dir = 'vast';

const fixtures = (() => {
    return {
        kaltura: readSyncFixtures(__test_dir, 'vast3/kaltura.xml'),
    };
})()

describe('vast', () => {
    it('should return an ad', () => {
        checkErrorStack(() => {
            const vast = vastLoadXML(fixtures.kaltura);

            const ad = vast.ads().first(),
                creative = ad.creatives().first(),
                media = creative.mediaFiles().first()

            console.log(
                // ad,
                // creative,
                // media
            );
        })
    })

    // @@todo test important methods ..
});
