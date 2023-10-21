// Path: ssg/helpers/regexes.test.js

const {
    validateMediaLink,
    codeFromMediaLink,
    hostFromMediaLink,
    parseMediaLink
} = require('./regexes')

describe('regexes', () => {
    describe('validateMediaLink', () => {
        it('should return true for valid youtube links', () => {
            expect(validateMediaLink('https://www.youtube.com/watch?v=abc123')).toBe(true)
            expect(validateMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail')).toBe(true)
            expect(validateMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar')).toBe(true)
        })
        it('should return true for valid vimeo links', () => {
            expect(validateMediaLink('https://vimeo.com/abc123')).toBe(true)
            expect(validateMediaLink('https://vimeo.com/abc123?foo=bar')).toBe(true)
        })
        it('should return false for invalid links', () => {
            expect(validateMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar&baz=qux')).toBe(false)
            expect(validateMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar&baz=qux')).toBe(false)
            expect(validateMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar&baz=qux')).toBe(false)
        })
    }),
    describe('codeFromMediaLink', () => {
        it('should return code for youtube links', () => {
            expect(codeFromMediaLink('https://www.youtube.com/watch?v=abc123')).toBe('abc123')
            expect(codeFromMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail')).toBe('abc123')
            expect(codeFromMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar')).toBe('abc123')
        })
        it('should return code for vimeo links', () => {
            expect(codeFromMediaLink('https://vimeo.com/abc123')).toBe('abc123')
            expect(codeFromMediaLink('https://vimeo.com/abc123?foo=bar')).toBe('abc123')
        })
    }),
    describe('hostFromMediaLink', () => {
        it('should return host for youtube links', () => {
            expect(hostFromMediaLink('https://www.youtube.com/watch?v=abc123')).toBe('youtube.com')
            expect(hostFromMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail')).toBe('youtube.com')
            expect(hostFromMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar')).toBe('youtube.com')
        })
        it('should return host for vimeo links', () => {
            expect(hostFromMediaLink('https://vimeo.com/abc123')).toBe('vimeo.com')
            expect(hostFromMediaLink('https://vimeo.com/abc123?foo=bar')).toBe('vimeo.com')
        })
    }),
    describe('parseMediaLink', () => {
        it('should return code and host for youtube links', () => {
            expect(parseMediaLink('https://www.youtube.com/watch?v=abc123')).toEqual({ code: 'abc123', host: 'youtube.com' })
            expect(parseMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail')).toEqual({ code: 'abc123', host: 'youtube.com' })
            expect(parseMediaLink('https://www.youtube.com/watch?v=abc123&feature=em-uploademail&foo=bar')).toEqual({ code: 'abc123', host: 'youtube.com' })
        })
        it('should return code and host for vimeo links', () => {
            expect(parseMediaLink('https://vimeo.com/abc123')).toEqual({ code: 'abc123', host: 'vimeo.com' })
            expect(parseMediaLink('https://vimeo.com/abc123?foo=bar')).toEqual({ code: 'abc123', host: 'vimeo.com' })
        })
    })
})
