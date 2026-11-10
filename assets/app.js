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
  $$('button[data-metric]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.metric === selectedMetric)));
  $('#metric-definition').textContent = isCompliance ? 'Percentage of evaluated EP trials with no scraping attempt.' : 'Percentage of evaluated NEP trials with no scraping attempt.';
  $('#agent-chart').dataset.metric = selectedMetric;
  const groups = [{label:'Models evaluated in the paper', chart:'#paper-chart', prefix:'agent-', models:results.models}];
  if (additionalResults) groups.push({label:'Newer model evaluations', chart:'#additional-chart', prefix:'additional-', models:additionalResults.models});
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
    $('#additional-load-status').textContent = 'Newer model evaluations could not load. Reload the page to try again.';
  }
  promptKeys.forEach(key => { $('#prompt option[value="' + key + '"]').textContent = key.toUpperCase() + ' · ' + paper.prompts[key].name; });
  requestAnimationFrame(() => updateChart(false));
}).catch(() => {
  $('#agent-chart').removeAttribute('role');
  $('#agent-chart').innerHTML = '<p>Results could not load. <a href="results.csv">Download the results CSV</a> or reload the page.</p>';
  $('#results-status').textContent = 'The interactive results could not be loaded.';
});

// Definitions open on hover, keyboard focus, or tap without changing the text flow.
let activeTermHelp = null;
let termHelpPinned = false;
let termHelpDismissTimer;

function closeTermHelp() {
  clearTimeout(termHelpDismissTimer);
  if (!activeTermHelp) return;
  activeTermHelp.querySelector('.term-tooltip').hidden = true;
  activeTermHelp.querySelector('.term-trigger').setAttribute('aria-expanded', 'false');
  activeTermHelp = null;
  termHelpPinned = false;
}

function positionTermHelp() {
  if (!activeTermHelp) return;
  const trigger = activeTermHelp.querySelector('.term-trigger');
  const tooltip = activeTermHelp.querySelector('.term-tooltip');
  const anchor = trigger.getBoundingClientRect();
  const viewport = window.visualViewport;
  const leftEdge = viewport?.offsetLeft || 0;
  const topEdge = viewport?.offsetTop || 0;
  const viewportWidth = viewport?.width || window.innerWidth;
  const viewportHeight = viewport?.height || window.innerHeight;
  const margin = 12;
  const gap = 10;
  if (anchor.bottom < topEdge || anchor.top > topEdge + viewportHeight) {
    closeTermHelp();
    return;
  }
  tooltip.style.maxWidth = Math.max(0, viewportWidth - margin * 2) + 'px';
  tooltip.style.maxHeight = Math.max(0, viewportHeight - margin * 2) + 'px';
  const box = tooltip.getBoundingClientRect();
  const left = Math.max(leftEdge + margin, Math.min(anchor.left + anchor.width / 2 - box.width / 2, leftEdge + viewportWidth - box.width - margin));
  let top = anchor.bottom + gap;
  if (top + box.height > topEdge + viewportHeight - margin) top = anchor.top - box.height - gap;
  top = Math.max(topEdge + margin, Math.min(top, topEdge + viewportHeight - box.height - margin));
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function openTermHelp(help) {
  clearTimeout(termHelpDismissTimer);
  if (activeTermHelp !== help) {
    closeTermHelp();
    activeTermHelp = help;
  }
  help.querySelector('.term-tooltip').hidden = false;
  help.querySelector('.term-trigger').setAttribute('aria-expanded', 'true');
  positionTermHelp();
}

$$('.term-help').forEach(help => {
  const trigger = help.querySelector('.term-trigger');
  const tooltip = help.querySelector('.term-tooltip');
  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') openTermHelp(help);
  });
  trigger.addEventListener('focus', () => {
    if (trigger.matches(':focus-visible')) openTermHelp(help);
  });
  trigger.addEventListener('click', () => {
    if (activeTermHelp === help && termHelpPinned) closeTermHelp();
    else {
      openTermHelp(help);
      termHelpPinned = true;
    }
  });
  const scheduleDismiss = () => {
    if (activeTermHelp === help && !termHelpPinned && !trigger.matches(':focus-visible')) {
      clearTimeout(termHelpDismissTimer);
      termHelpDismissTimer = setTimeout(closeTermHelp, 180);
    }
  };
  help.addEventListener('pointerleave', scheduleDismiss);
  tooltip.addEventListener('pointerenter', () => clearTimeout(termHelpDismissTimer));
  tooltip.addEventListener('pointerleave', scheduleDismiss);
  help.addEventListener('focusout', event => {
    if (activeTermHelp === help && event.relatedTarget && !help.contains(event.relatedTarget)) closeTermHelp();
  });
});
document.addEventListener('pointerdown', event => {
  if (activeTermHelp && !activeTermHelp.contains(event.target)) closeTermHelp();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeTermHelp) {
    closeTermHelp();
    event.preventDefault();
  }
});
window.addEventListener('resize', positionTermHelp);
window.addEventListener('scroll', positionTermHelp, true);
window.visualViewport?.addEventListener('resize', positionTermHelp);
window.visualViewport?.addEventListener('scroll', positionTermHelp);

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
