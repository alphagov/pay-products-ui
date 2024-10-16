/**
 * Credit: https://github.com/ministryofjustice/opg-performance-data/
 */
'use strict'

const markdownIt = require('markdown-it')

/**
 * Rules that can be enabled/disabled for markdown-it can be found here:
 * https://github.com/markdown-it/markdown-it/blob/0fe7ccb4b7f30236fb05f623be6924961d296d3d/lib/parser_block.mjs
 * https://github.com/markdown-it/markdown-it/blob/HEAD/lib/parser_inline.mjs
 */
const md = markdownIt({
  html: false,
  breaks: true
})
  .disable(['heading', 'lheading', 'image', 'table', 'code', 'fence', 'blockquote', 'hr', 'html_block', 'reference', 'emphasis', 'backticks', 'strikethrough', 'html_inline', 'autolink', 'entity'])

md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['class', 'govuk-body'])
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['class', 'govuk-link'])
  tokens[idx].attrPush(['target', '_blank'])
  tokens[idx].attrPush(['rel', 'noreferrer noopener'])
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_close = function (tokens, idx, options, env, self) {
  return '<span class="govuk-visually-hidden">(opens in new tab)</span></a>'
}

md.renderer.rules.bullet_list_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['class', 'govuk-list govuk-list--bullet'])
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.ordered_list_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['class', 'govuk-list govuk-list--number'])
  return self.renderToken(tokens, idx, options)
}

function formatMarkdown (rawText) {
  return md.render(rawText)
}

module.exports = {
  formatMarkdown
}
