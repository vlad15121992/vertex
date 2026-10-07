'use strict';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const header = $('#site-header');
const nav = $('#main-nav');
const menuButton = $('.menu-toggle');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 32);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
function closeMenu() { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('is-open', open); menuButton.setAttribute('aria-expanded', String(open)); });
$$('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });
window.matchMedia('(min-width:761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const range = $('#compare-range');
range.addEventListener('input', () => { $('#comparison').style.setProperty('--position', `${range.value}%`); range.setAttribute('aria-valuetext', `Ескіз ${range.value}%, візуалізація ${100 - Number(range.value)}%`); });

const projects = $$('.project').map(button => ({ button, title: button.querySelector('.project-title').textContent.trim(), category: button.dataset.category, image: button.querySelector('img').getAttribute('src'), alt: button.querySelector('img').alt }));
let currentFilter = 'all';
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  projects.forEach(project => { project.button.hidden = currentFilter !== 'all' && project.category !== currentFilter; if (!project.button.hidden) count++; });
  $('#filter-status').textContent = `Показано проєктів: ${count}`;
}));

const projectDialog = $('#project-dialog');
const requestDialog = $('#request-dialog');
let activeProject = 0;
let lastFocused = null;
function openDialog(dialog) { lastFocused = document.activeElement; dialog.showModal(); document.body.classList.add('modal-open'); }
function closeDialog(dialog) { dialog.close(); }
function updateProject(index) {
  activeProject = index;
  const project = projects[index];
  $('#lightbox-title').textContent = project.title;
  $('#lightbox-category').textContent = project.category === 'interior' ? 'Інтер’єри' : 'Архітектура';
  $('#lightbox-image').src = project.image;
  $('#lightbox-image').alt = project.alt;
  const visible = projects.filter(item => currentFilter === 'all' || item.category === currentFilter);
  $('#lightbox-count').textContent = `${visible.indexOf(project) + 1} / ${visible.length}`;
  $('.lightbox-prev').disabled = visible.length < 2;
  $('.lightbox-next').disabled = visible.length < 2;
}
function stepProject(direction) { const visible = projects.map((item, i) => ({...item,index:i})).filter(item => currentFilter === 'all' || item.category === currentFilter); const at = visible.findIndex(item => item.index === activeProject); updateProject(visible[(at + direction + visible.length) % visible.length].index); }
projects.forEach((project,index) => project.button.addEventListener('click', () => { updateProject(index); openDialog(projectDialog); }));
$('.lightbox-prev').addEventListener('click', () => stepProject(-1));
$('.lightbox-next').addEventListener('click', () => stepProject(1));
projectDialog.addEventListener('keydown', event => { if (event.key === 'ArrowRight') { event.preventDefault(); stepProject(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); stepProject(-1); } });
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(document.getElementById(button.dataset.close))));
[projectDialog,requestDialog].forEach(dialog => {
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (lastFocused?.isConnected) lastFocused.focus({preventScroll:true}); });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),textarea,input,select')].filter(element => !element.hidden);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });
});
$('#lightbox-contact').addEventListener('click', () => { const project = projects[activeProject]; $('#service-select').value = project.category === 'interior' ? 'Дизайн інтер’єру' : 'Проєктування'; $('#contact-form [name="message"]').value = `Цікавить проєкт, подібний до «${project.title}».`; closeDialog(projectDialog); });
$$('[data-service]').forEach(link => link.addEventListener('click', () => { $('#service-select').value = link.dataset.service; }));

const form = $('#contact-form');
const phone = form.elements.phone;
phone.addEventListener('input', () => { phone.setCustomValidity(''); phone.removeAttribute('aria-invalid'); $('#phone-error').hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const digits = phone.value.replace(/\D/g, '');
  if(digits.length < 9 || digits.length > 15){phone.setCustomValidity('Вкажіть номер телефону: від 9 до 15 цифр.');phone.setAttribute('aria-invalid','true');$('#phone-error').hidden=false;phone.reportValidity();return;}
  const name = form.elements.name.value.trim();
  if(name.length < 2){form.elements.name.setCustomValidity('Вкажіть ім’я (щонайменше 2 символи).');form.elements.name.reportValidity();return;}
  const message = form.elements.message.value.trim();
  $('#request-text').value = [`Вітаю! Хочу обговорити проєкт із VERTEX.`, ``, `Ім’я: ${name}`, `Телефон: ${phone.value.trim()}`, `Тип проєкту: ${form.elements.service.value}`, ...(message ? [``,message] : [])].join('\n');
  $('#copy-status').textContent = 'Заявка ще не надіслана. Надішліть її в чаті.';
  $('#copy-request').firstChild.textContent = 'Скопіювати текст';
  openDialog(requestDialog);
});
form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
$('#copy-request').addEventListener('click', async () => {
  const text = $('#request-text');
  try { await navigator.clipboard.writeText(text.value); $('#copy-status').textContent = 'Текст скопійовано. Відкрийте Telegram, вставте його в чат та надішліть.'; $('#copy-request').firstChild.textContent = 'Скопійовано'; }
  catch { text.focus();text.select();$('#copy-status').textContent = 'Виділено весь текст. Скопіюйте його вручну та вставте в Telegram.'; }
});
$('#year').textContent = new Date().getFullYear();
