import fs from 'fs';
import path from 'path';

export function loadDefaults(skillRoot) {
  return JSON.parse(fs.readFileSync(path.join(skillRoot, 'config/defaults.json'), 'utf8'));
}

export function uiStyleIds(defaults) {
  return (defaults.uiStyles || []).map((s) => s.id);
}

export function renderUiStyleMenuHtml(defaults) {
  const defaultId = defaults.defaultUiStyle || 'vibrant';
  return defaults.uiStyles
    .map(({ id, label }) => {
      const checked = id === defaultId ? 'true' : 'false';
      return `          <button type="button" class="ui-style-option" role="menuitemradio" data-style="${id}" aria-checked="${checked}">
            <span class="ui-style-swatch" data-style-swatch="${id}" aria-hidden="true"></span>
            <span class="ui-style-name">${label}</span>
          </button>`;
    })
    .join('\n');
}

export function renderUiStyleBootstrapScript(defaults) {
  const uiKey = defaults.globalUiStyleKey || 'study-self_ui-style';
  const themeKey = defaults.globalThemeKey || 'study-self_theme';
  const def = defaults.defaultUiStyle || 'vibrant';
  return `    (function () {
      try {
        var s = localStorage.getItem('${uiKey}') || '${def}';
        document.documentElement.setAttribute('data-ui-style', s);
        var t = localStorage.getItem('${themeKey}');
        if (t) document.documentElement.setAttribute('data-theme', t);
      } catch (e) { /* ignore */ }
    })();`;
}

export function renderUiStyleSheetBootstrapScript(defaults) {
  const def = defaults.defaultUiStyle || 'vibrant';
  return `    (function () {
      try {
        var s = document.documentElement.getAttribute('data-ui-style') || '${def}';
        document.querySelectorAll('[data-ui-style-sheet]').forEach(function (el) {
          el.disabled = el.getAttribute('data-ui-style-sheet') !== s;
        });
      } catch (e) { /* ignore */ }
    })();`;
}

export function renderPortalUiStyleConfig(defaults) {
  const uiKey = defaults.globalUiStyleKey || 'study-self_ui-style';
  const themeKey = defaults.globalThemeKey || 'study-self_theme';
  const ids = uiStyleIds(defaults)
    .map((id) => `'${id}'`)
    .join(', ');
  return `  var GLOBAL_THEME_KEY = '${themeKey}';
  var GLOBAL_UI_STYLE_KEY = '${uiKey}';
  var UI_STYLE_IDS = [${ids}];`;
}

export function applyShellTemplatePlaceholders(html, defaults) {
  const def = defaults.defaultUiStyle || 'vibrant';
  const idsJson = JSON.stringify(uiStyleIds(defaults));
  const uiKey = defaults.globalUiStyleKey || 'study-self_ui-style';

  return html
    .replace(/\{\{DEFAULT_UI_STYLE\}\}/g, def)
    .replace(/\{\{GLOBAL_UI_STYLE_KEY\}\}/g, uiKey)
    .replace(/\{\{GLOBAL_THEME_KEY\}\}/g, defaults.globalThemeKey || 'study-self_theme')
    .replace(/\{\{UI_STYLE_IDS_JSON\}\}/g, idsJson)
    .replace(/\{\{UI_STYLE_MENU_HTML\}\}/g, renderUiStyleMenuHtml(defaults))
    .replace(/\{\{UI_STYLE_BOOTSTRAP_SCRIPT\}\}/g, renderUiStyleBootstrapScript(defaults))
    .replace(/\{\{UI_STYLE_SHEET_BOOTSTRAP_SCRIPT\}\}/g, renderUiStyleSheetBootstrapScript(defaults));
}

export function applyShellAppPlaceholders(js, defaults) {
  const def = defaults.defaultUiStyle || 'vibrant';
  return js
    .replace(/\{\{GLOBAL_UI_STYLE_KEY\}\}/g, defaults.globalUiStyleKey || 'study-self_ui-style')
    .replace(/\{\{GLOBAL_THEME_KEY\}\}/g, defaults.globalThemeKey || 'study-self_theme')
    .replace(/\{\{UI_STYLE_IDS_JSON\}\}/g, JSON.stringify(uiStyleIds(defaults)))
    .replace(/\{\{DEFAULT_UI_STYLE\}\}/g, def);
}

const MENU_START = '<!-- ui-style-menu:start -->';
const MENU_END = '<!-- ui-style-menu:end -->';
const CONFIG_START = '// ui-style-config:start';
const CONFIG_END = '// ui-style-config:end';
const BOOT_START = '// ui-style-bootstrap:start';
const BOOT_END = '// ui-style-bootstrap:end';
const SHEET_BOOT_START = '// ui-style-sheet-bootstrap:start';
const SHEET_BOOT_END = '// ui-style-sheet-bootstrap:end';

function replaceBetween(html, start, end, content) {
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(`Marker not found: ${start} … ${end}`);
  }
  return html.slice(0, a + start.length) + '\n' + content + '\n' + html.slice(b);
}

export function applyPortalUiStyleFragments(html, defaults) {
  const def = defaults.defaultUiStyle || 'vibrant';
  let out = html.replace(/data-ui-style="[^"]+"/, `data-ui-style="${def}"`);
  out = replaceBetween(out, MENU_START, MENU_END, renderUiStyleMenuHtml(defaults));
  out = replaceBetween(out, BOOT_START, BOOT_END, renderUiStyleBootstrapScript(defaults).trim());
  out = replaceBetween(
    out,
    SHEET_BOOT_START,
    SHEET_BOOT_END,
    renderUiStyleSheetBootstrapScript(defaults).trim()
  );
  out = replaceBetween(out, CONFIG_START, CONFIG_END, renderPortalUiStyleConfig(defaults));

  const uiKey = defaults.globalUiStyleKey || 'study-self_ui-style';
  out = out.replace(
    /if \(UI_STYLE_IDS\.indexOf\(style\) === -1\) style = '[^']+';/,
    `if (UI_STYLE_IDS.indexOf(style) === -1) style = '${def}';`
  );
  out = out.replace(
    new RegExp(`applyUiStyle\\(storageGet\\(GLOBAL_UI_STYLE_KEY\\) \\|\\| '[^']+'\\)`),
    `applyUiStyle(storageGet(GLOBAL_UI_STYLE_KEY) || '${def}')`
  );
  out = out.replace(
    /localStorage\.getItem\('study-self_ui-style'\)/g,
    `localStorage.getItem('${uiKey}')`
  );
  out = out.replace(
    /document\.documentElement\.getAttribute\('data-ui-style'\) \|\| 'vibrant'/g,
    `document.documentElement.getAttribute('data-ui-style') || '${def}'`
  );
  return out;
}
