import { describe, it } from 'mocha';
import { expect, assert } from 'chai';
import Schema from '../../src/vast/schema/schema';
import { SchemaError } from '../../src/vast/schema/schema';
import { readSyncFixtures, readSyncExpected, prettyjson, checkErrorStack } from '../utils';

class Standard extends Schema {
    constructor(tag) {
        super(tag, 'standard');
    }
}

const tagWihURI = new Standard({
    standard: {
        attributes: {},
        value: 'http://google.com'
    }
});

const tagWithChildren = new Standard({
    standard: {
        attributes: {},
        value: [{
            two: {
                attributes: {},
                value: 'http://google.com',
            }
        }, {
            two: {
                attributes: {},
                value: false,
            }
        }, {
            single: {
                attributes: {},
                value: false,
            }
        }, {
            alternative: {
                attributes: {},
                value: false,
            }
        }]
    }
});

// template:
checkErrorStack(() => {})

describe('vast - schema', () => {
    it('should throw error if given data is missing or not json', () => {
        expect(() => {
            new Standard();
        }).to.throw(SchemaError);
    })

    it('should throw error if name is missing', () => {
        expect(() => {
            new Standard({});
        }).to.throw(SchemaError);
    })

    it('should throw error if attributes are missing', () => {
        expect(() => {
            new Standard({ standard: {} });
        }).to.throw(SchemaError);
    })

    it('should throw error if name is different than expected one', () => {
        class Different extends Schema {
            constructor(tag) {
                super(tag, 'something');
            }
        }

        expect(() => {
            new Different({ different: { attributes: {} } });
        }).to.throw(SchemaError);
    })

    it('should return tag\'s name', () => {
        expect(tagWihURI.tagName()).eql('standard');
    })

    it('should return tag\'s value', () => {
        expect(tagWihURI.tagValue()).eql('http://google.com');
    })

    it('should return false if value is not an array', () => {
        expect(tagWihURI.valueIsArray()).eql(false);
    })

    it('should enforce array with valueAsArray', () => {
        expect(tagWihURI.valueAsArray()).eql([]);
    })

    it('should return tag with given name (ALL)', () => {
        const tags = tagWithChildren.valuesWithTagName('two'),
            expected = [{
                _tagName: 'two',
                _tagValue: 'http://google.com',
            }, {
                _tagName: 'two',
                _tagValue: false
            }];

        expect(tags).eql(expected);
    })

    it('should return tag with given name - expect one, gets false', () => {
        const tag = tagWithChildren.valueWithTagName('missing');

        expect(tag).eql(false);
    })

    it('should return tag with given name - expect one, gets first', () => {
        const tag = tagWithChildren.valueWithTagName('two');

        expect(tag).eql({
            _tagName: 'two',
            _tagValue: 'http://google.com'
        });
    })

    it('should return tag with given name - expect one, gets first from alternatives', () => {
        const tag = tagWithChildren.valueWithTagNameFrom(['single', 'alternative']);

        expect(tag).eql({
            _tagName: 'single',
            _tagValue: false
        });
    })
});
