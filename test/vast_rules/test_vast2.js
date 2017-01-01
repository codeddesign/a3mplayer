import { describe, it } from 'mocha';
import { expect, assert } from 'chai';
import { readSyncFixtures, readSyncExpected, prettyjson, checkErrorStack, loadedVast } from '../utils';

const __test_dir = 'vast';

const fixtures = (() => {
    return {
        vast2_teads: readSyncFixtures(__test_dir, 'vast2_teads.xml'),
        tremor_inline_linear: readSyncFixtures(__test_dir, 'vast2/tremor_inline_linear.xml'),
        tremor_RegularLinear: readSyncFixtures(__test_dir, 'vast2/tremor_RegularLinear.xml'),
        tremor_VPAIDLinear: readSyncFixtures(__test_dir, 'vast2/tremor_VPAIDLinear.xml'),
        zentrick_pricing: readSyncFixtures(__test_dir, 'vast2/zentrick_pricing.xml'),
        zentrick_sequence: readSyncFixtures(__test_dir, 'vast2/zentrick_sequence.xml'),
    };
})()

const expected = (() => {
    return {
        tremor_inline_linear: readSyncExpected(__test_dir, 'vast2/tremor_inline_linear.json'),
        tremor_RegularLinear: readSyncExpected(__test_dir, 'vast2/tremor_RegularLinear.json'),
        tremor_VPAIDLinear: readSyncExpected(__test_dir, 'vast2/tremor_VPAIDLinear.json'),
        zentrick_pricing: readSyncExpected(__test_dir, 'vast2/zentrick_pricing.json'),
        zentrick_sequence: readSyncExpected(__test_dir, 'vast2/zentrick_sequence.json'),
    };
})()

describe('vast - schema rules (vast2)', () => {
    it('should confirm JSON body for tremor_inline_linear', () => {
        const loaded = loadedVast(fixtures.tremor_inline_linear);
        expect(loaded.data).eql(expected.tremor_inline_linear);
    })

    it('should confirm JSON body for tremor_RegularLinear', () => {
        const vast = loadedVast(fixtures.tremor_RegularLinear);
        expect(vast.data).eql(expected.tremor_RegularLinear);
    })

    it('should confirm JSON body for tremor_VPAIDLinear', () => {
        const vast = loadedVast(fixtures.tremor_VPAIDLinear);
        expect(vast.data).eql(expected.tremor_VPAIDLinear);
    })

    it('should confirm JSON body for zentrick_pricing', () => {
        const vast = loadedVast(fixtures.zentrick_pricing);
        expect(vast.data).eql(expected.zentrick_pricing);
    })

    it('should confirm JSON body for zentrick_sequence', () => {
        const vast = loadedVast(fixtures.zentrick_sequence);
        expect(vast.data).eql(expected.zentrick_sequence);
    })

    /* @ignore: wrappers are tested in browser .. */

    // it('should confirm JSON body for tremor_wrapper_linear_1', () => {
    //     const vast = loadedVast(fixtures.tremor_wrapper_linear_1);
    //     expect(vast.data).eql(expected.tremor_wrapper_linear_1);
    // })

    // it('should confirm JSON body for tremor_wrapper_linear_2', () => {
    //     const vast = loadedVast(fixtures.tremor_wrapper_linear_2);
    //     expect(vast).eql(expected.tremor_wrapper_linear_2);
    // })
});
