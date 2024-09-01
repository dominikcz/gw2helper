export const EVENTS_PARTIAL = { events: '{{#plural}}events: {{/plural}}{{^plural}}event{{/plural}} {{eventsList}} {{#plural}}are{{/plural}}{{^plural}}is{{/plural}} starting'};
export const EVENT_TEMPLATE = 'It is {{time}}. {{^immediate}}In {{inAdvance}} minutes {{> events}} {{/immediate}}{{#immediate}}{{> events}} now{{/immediate}}';
