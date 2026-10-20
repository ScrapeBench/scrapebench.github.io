'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const percent = value => Number(value).toFixed(1);
const promptKeys = ['p1','p2','p3','p4','p5','p6','p7','p8'];
let results, paper, additionalResults;
let selectedMetric = new URLSearchParams(location.search).get('metric') === 'overrefusal' ? 'overrefusal' : 'compliance';
const initialParams = new URLSearchParams(location.search);
const initialPrompt = initialParams.get('prompt');
if (promptKeys.includes(initialPrompt)) $('#prompt').value = initialPrompt;

function updateChart(announce = true) {
  if (!results || !paper) return;
  const prompt = $('#prompt').value;
  const isCompliance = selectedMetric === 'compliance';
  $('#prompt-text').textContent = '"' + paper.prompts[prompt].text + '"';
  const additionalPrompt = additionalResults?.prompts[prompt]?.text;
  const separatePrompt = additionalPrompt && additionalPrompt !== paper.prompts[prompt].text;
  $('#additional-prompt-details').hidden = !separatePrompt;
  $('#paper-prompt-label').hidden = !separatePrompt;
  if (separatePrompt) $('#additional-prompt-text').textContent = '"' + additionalPrompt + '"';
  $$('button[data-metric]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.metric === selectedMetric)));
  $('#metric-definition').textContent = isCompliance ? 'Percentage of evaluated EP trials with no scraping attempt.' : 'Percentage of evaluated NEP trials with no scraping attempt.';
  $('#agent-chart').dataset.metric = selectedMetric;
  const groups = [{label:'Paper models', chart:'#paper-chart', prefix:'agent-', models:results.models}];
  if (additionalResults) groups.push({label:'Additional evaluations', chart:'#additional-chart', prefix:'additional-', models:additionalResults.models});
  groups.forEach(group => {
    const descriptions = [];
    Object.entries(group.models).forEach(([key, model]) => {
      const value = model.prompts[prompt]?.[selectedMetric];
      const available = value && Number.isFinite(value.rate) && value.n !== 0;
      const row = document.getElementById(group.prefix + key);
      row.classList.toggle('is-unavailable', !available);
      row.querySelector('.agent-track').hidden = !available;
      if (available) {
        row.querySelector('.agent-fill').style.width = value.rate + '%';
        row.querySelector('.agent-value').innerHTML = percent(value.rate) + '<small>%</small>';
      } else {
        row.querySelector('.agent-fill').style.width = '0%';
        row.querySelector('.agent-value').textContent = 'Not evaluated';
      }
      descriptions.push(model.label + ': ' + (available ? percent(value.rate) + '% ' + (isCompliance ? 'compliance' : 'over-refusal') : 'Not evaluated'));
    });
    $(group.chart).setAttribute('aria-label', group.label + '. ' + prompt.toUpperCase() + ' · ' + paper.prompts[prompt].name + '. ' + descriptions.join('; '));
  });
  const url = new URL(location.href);
  url.searchParams.delete('design');
  if (prompt === 'p1') url.searchParams.delete('prompt'); else url.searchParams.set('prompt', prompt);
  if (selectedMetric === 'overrefusal') url.searchParams.set('metric', selectedMetric); else url.searchParams.delete('metric');
  history.replaceState(null, '', url);
  if (announce) $('#results-status').textContent = prompt.toUpperCase() + '. ' + (isCompliance ? 'Compliance' : 'Over-refusal') + ' chart updated.';
}

$('#prompt').addEventListener('change', () => updateChart());
$$('button[data-metric]').forEach(button => button.addEventListener('click', () => {
  selectedMetric = button.dataset.metric;
  $$('button[data-metric]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  updateChart();
}));

const readJSON = file => fetch(file, {cache:'no-cache'}).then(response => {
  if (!response.ok) throw new Error('Results unavailable');
  return response.json();
});
Promise.all([readJSON('results.json'), readJSON('paper-content.json'), readJSON('additional-results.json').catch(() => null)]).then(([data, manuscript, additional]) => {
  results = data;
  paper = manuscript;
  additionalResults = additional;
  if (!additionalResults) {
    $('#additional-chart').hidden = true;
    $('#additional-load-status').hidden = false;
    $('#additional-load-status').textContent = 'Additional evaluations could not load. Reload the page to try again.';
  }
  promptKeys.forEach(key => { $('#prompt option[value="' + key + '"]').textContent = key.toUpperCase() + ' · ' + paper.prompts[key].name; });
  requestAnimationFrame(() => updateChart(false));
}).catch(() => {
  $('#agent-chart').removeAttribute('role');
  $('#agent-chart').innerHTML = '<p>Results could not load. <a href="results.csv">Download the results CSV</a> or reload the page.</p>';
  $('#results-status').textContent = 'The interactive results could not be loaded.';
});

$('#copy-citation').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#citation').textContent);
    $('#copy-status').textContent = 'Copied';
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#citation'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    $('#copy-status').textContent = 'Citation selected. Use your copy command.';
  }
});

// Add the public paper later by changing paperUrl in site-config.json.
fetch('site-config.json').then(response => {
  if (!response.ok) throw new Error('Configuration unavailable');
  return response.json();
}).then(config => {
  const isHTTPS = value => {try {return new URL(value).protocol === 'https:';} catch {return false;}};
  if (isHTTPS(config.resourcesUrl)) $$('.resource-link').forEach(link => {link.href = config.resourcesUrl;});
  if (isHTTPS(config.paperUrl)) {
    const link = document.createElement('a');
    link.id = 'paper-link'; link.href = config.paperUrl; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Read the Paper ↗';
    $('#paper-link').replaceWith(link);
    $('#citation').textContent = $('#citation').textContent.replace('  year = {2026}', '  year = {2026},\n  url = {' + config.paperUrl + '}');
  }
}).catch(() => {});

// Keep looping while the page is active, including when only part of the scene is visible.
const taskScene = $('.task-scene');
const sceneMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function syncScenePlayback() {
  taskScene.classList.toggle('is-paused', document.hidden || sceneMotion.matches);
}

document.addEventListener('visibilitychange', syncScenePlayback);
sceneMotion.addEventListener('change', syncScenePlayback);
syncScenePlayback();
taskScene.classList.add('is-playing');
