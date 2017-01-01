import { describe, it } from 'mocha';
import { expect, assert } from 'chai';
import { readSyncFixtures, readSyncExpected, prettyjson } from '../utils';
import parseXML from '../../src/vast/parser/parser';
import { XMLParserError } from '../../src/vast/parser/parser';

const __test_dir = 'vast_parser';

describe('vast - xml parser', () => {
    const fixtures = (() => {
        return {
            properties: readSyncFixtures(__test_dir, 'properties.xml'),
            children: readSyncFixtures(__test_dir, 'children.xml'),
            children_chained: readSyncFixtures(__test_dir, 'children_chained.xml'),
            parent_child_same_tag: readSyncFixtures(__test_dir, 'parent_child_same_tag.xml'),
            non_ending: readSyncFixtures(__test_dir, 'non_ending.xml')
        };
    })()

    const expected = (() => {
        return {
            properties: readSyncExpected(__test_dir, 'properties.json'),
            children: readSyncExpected(__test_dir, 'children.json'),
            children_chained: readSyncExpected(__test_dir, 'children_chained.json'),
            children_chained_inlined: readSyncExpected(__test_dir, 'children_chained_inlined.xml'),
            parent_child_same_tag: readSyncExpected(__test_dir, 'parent_child_same_tag.json'),
            non_ending: readSyncExpected(__test_dir, 'non_ending.json')
        }
    })()

    it('should throw error on invalid xml file', () => {
        expect(() => parseXML(false)).to.throw(XMLParserError);

        expect(() => parseXML(null)).to.throw(XMLParserError);

        expect(() => parseXML('')).to.throw(XMLParserError);
    })

    it('should have the body set to inline', () => {
        expect(
            parseXML(fixtures.children_chained).xml
        ).eql(
            parseXML(expected.children_chained_inlined).xml
        );
    })

    it('should replace non-end tags', () => {
        const parsed = parseXML(fixtures.non_ending);

        expect(parsed.json()).eql(expected.non_ending)
    })

    it('should return a tag and properties', () => {
        const parsed = parseXML(fixtures.properties);

        expect(parsed.json()).eql(expected.properties)
    })

    it('should return a tag and it\'s children', () => {
        const parsed = parseXML(fixtures.children);

        expect(parsed.json()).eql(expected.children);
    })

    it('should return a tag and it\'s chained identical children', () => {
        const parsed = parseXML(fixtures.children_chained);

        expect(parsed.json()).eql(expected.children_chained);
    })

    it('should handle parent-child with identical tag name (start-end of regex)', () => {
        const parsed = parseXML(fixtures.parent_child_same_tag);

        expect(parsed.json()).eql(expected.parent_child_same_tag);
    })
})
