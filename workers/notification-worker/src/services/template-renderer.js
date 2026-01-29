'use strict';

/**
 * Render template with variables
 */
function render(template, variables = {}) {
  const renderText = (text) => {
    if (!text) {
      return '';
    }
    let rendered = text;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }
    return rendered;
  };

  return {
    emailSubject: renderText(template.emailSubject || template.subject),
    emailBody: renderText(template.emailBody),
    smsBody: renderText(template.smsBody),
    pushTitle: renderText(template.pushTitle || template.name),
    pushBody: renderText(template.pushBody || template.emailBody),
  };
}

module.exports = {
  render,
};
