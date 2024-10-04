const { expect } = require('chai')

const { formatMarkdown } = require('./format-markdown')

describe('Format markdown utilities', () => {
  describe('format markdown', () => {
    it('formats paragraphs', () => {
      const input = 'This is a paragraph\n\nAnd another paragraph\n'

      const expectedHTML = '<p class="govuk-body">This is a paragraph</p>\n' +
        '<p class="govuk-body">And another paragraph</p>\n'

      expect(formatMarkdown(input)).to.eq(expectedHTML)
    })

    it('formats links', () => {
      const input = 'This is a [link](http://www.example.com)'
      const expectedHtml = '<p class="govuk-body">This is a <a href="http://www.example.com" class="govuk-link" ' +
        'target="_blank" rel="noreferrer noopener">link<span class="govuk-visually-hidden">(opens in new tab)</span></a></p>\n'

      expect(formatMarkdown(input)).to.eq(expectedHtml)
    })

    it('formats a bulleted list created with asterisks', () => {
      const input = 'This is a list:\n\n' +
        '* something\n' +
        '* something else'

      const expectedHTML = '<p class="govuk-body">This is a list:</p>\n' +
        '<ul class="govuk-list govuk-list--bullet">\n<' +
        'li>something</li>\n<li>something else</li>\n' +
        '</ul>\n'

      expect(formatMarkdown(input)).to.eq(expectedHTML)
    })

    it('formats a bulleted list created with dashes', () => {
      const input = 'This is a list:\n\n' +
        '- something\n' +
        '- something else'

      const expectedHTML = '<p class="govuk-body">This is a list:</p>\n' +
        '<ul class="govuk-list govuk-list--bullet">\n<' +
        'li>something</li>\n' +
        '<li>something else</li>\n' +
        '</ul>\n'

      expect(formatMarkdown(input)).to.eq(expectedHTML)
    })

    it('formats an ordered list', () => {
      const input = 'This is a list:\n\n' +
        '1. something\n' +
        '1. something else'

      const expectedHTML = '<p class="govuk-body">This is a list:</p>\n' +
        '<ol class="govuk-list govuk-list--number">\n<' +
        'li>something</li>\n' +
        '<li>something else</li>\n' +
        '</ol>\n'

      expect(formatMarkdown(input)).to.eq(expectedHTML)
    })

    it('escapes HTML', () => {
      const input = '<div class="this is an html block">\n' +
        'blah blah\n' +
        '</div>'

      expect(formatMarkdown(input)).to.contain('&lt;div')
    })

    it('does not format headings', () => {
      const input = '# A heading'

      expect(formatMarkdown(input)).to.not.contain('<h1')
    })

    it('does not format headings with dash syntax', () => {
      const input = 'Heading level 1\n==============='

      expect(formatMarkdown(input)).to.not.contain('<h1')
    })

    it('does not format images', () => {
      const input = '![An image!](/assets/images/govuk-crest.png "An image")'

      expect(formatMarkdown(input)).to.not.contain('<img')
    })

    it('does not format tables', () => {
      const input = '|Heading|\n|---|\n|value|'

      expect(formatMarkdown(input)).to.not.contain('<table')
    })

    it('does not format code blocks', () => {
      const input = '    a\n' +
        '    code\n' +
        '    block'

      expect(formatMarkdown(input)).to.not.contain('<code')
    })

    it('does not format code fences', () => {
      const input = '```\nSome code\n```'

      expect(formatMarkdown(input)).to.not.contain('<code')
    })

    it('does not format blockquotes', () => {
      const input = '> A blockquote'

      expect(formatMarkdown(input)).to.not.contain('<blockquote')
    })

    it('does not format horizontal rules', () => {
      const input = ' ________\n'

      expect(formatMarkdown(input)).to.not.contain('<hr')
    })

    it('does not format references', () => {
      const input = '[1]\n\n[1]: <http://something.example.com/foo/bar>'

      expect(formatMarkdown(input)).to.not.contain('<a')
    })

    it('does not format bold', () => {
      const input = '**emphasis**'

      expect(formatMarkdown(input)).to.not.contain('<strong')
    })

    it('does not format italics', () => {
      const input = '_italics_'

      expect(formatMarkdown(input)).to.not.contain('<em')
    })

    it('does not format backticks', () => {
      const input = 'Some `code`'

      expect(formatMarkdown(input)).to.not.contain('<code')
    })

    it('does not format strikethrough', () => {
      const input = '~~strikethrough~~'

      expect(formatMarkdown((input))).to.not.contain('<s')
    })

    it('does not format autolinks', () => {
      const input = '<http://www.example.com>'

      expect(formatMarkdown((input))).to.not.contain('<a')
    })

    it('does not format entities', () => {
      const input = '&copy;'

      expect(formatMarkdown((input))).to.not.contain('©')
    })
  })
})
