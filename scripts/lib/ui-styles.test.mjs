/**
 * ui-styles.mjs 单元测试（使用 Node 内置 node:test）
 * 运行: node --test scripts/lib/ui-styles.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadDefaults,
  uiStyleIds,
  renderUiStyleMenuHtml,
  renderUiStyleBootstrapScript,
  renderUiStyleSheetBootstrapScript,
  renderPortalUiStyleConfig,
  applyShellTemplatePlaceholders,
  applyShellAppPlaceholders,
} from './ui-styles.mjs';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..', '..');

describe('loadDefaults', () => {
  it('返回对象含 uiStyles / shellVersion / defaultUiStyle', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    assert.ok('shellVersion' in defaults);
    assert.ok('uiStyles' in defaults);
    assert.ok('defaultUiStyle' in defaults);
    assert.ok(Array.isArray(defaults.uiStyles));
  });

  it('uiStyles 每条含 id 和 label', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    for (const s of defaults.uiStyles) {
      assert.ok('id' in s);
      assert.ok('label' in s);
      assert.equal(typeof s.id, 'string');
      assert.equal(typeof s.label, 'string');
    }
  });

  it('uiStyles 含 12 套风格', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    assert.equal(defaults.uiStyles.length, 12);
  });
});

describe('uiStyleIds', () => {
  it('从 defaults 提取所有 id', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const ids = uiStyleIds(defaults);
    assert.equal(ids.length, 12);
    assert.ok(ids.includes('vibrant'));
    assert.ok(ids.includes('minimal'));
    assert.ok(ids.includes('terminal'));
    assert.ok(ids.includes('soft'));
  });

  it('空数组输入返回空数组', () => {
    assert.deepEqual(uiStyleIds({}), []);
    assert.deepEqual(uiStyleIds({ uiStyles: [] }), []);
  });
});

describe('renderUiStyleMenuHtml', () => {
  it('生成 12 个按钮含 data-style', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const html = renderUiStyleMenuHtml(defaults);
    const matches = html.match(/data-style="(\w+)"/g);
    assert.ok(matches !== null);
    assert.equal(matches.length, 12);
  });

  it('defaultUiStyle 对应按钮 aria-checked=true', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const def = defaults.defaultUiStyle;
    const html = renderUiStyleMenuHtml(defaults);
    assert.ok(html.includes(`data-style="${def}"`));
    assert.ok(html.includes(`data-style="${def}" aria-checked="true"`));
  });

  it('非默认风格 aria-checked=false', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const html = renderUiStyleMenuHtml(defaults);
    const falseCount = (html.match(/aria-checked="false"/g) || []).length;
    assert.equal(falseCount, 11);
  });

  it('生成的按钮含正确的 label', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const html = renderUiStyleMenuHtml(defaults);
    assert.ok(html.includes('简约'));
    assert.ok(html.includes('活力'));
    assert.ok(html.includes('终端'));
  });
});

describe('renderUiStyleBootstrapScript', () => {
  it('包含正确的 localStorage key', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const script = renderUiStyleBootstrapScript(defaults);
    assert.ok(script.includes("localStorage.getItem('study-self_ui-style')"));
    assert.ok(script.includes("localStorage.getItem('study-self_theme')"));
  });

  it('包含默认 UI 风格', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const script = renderUiStyleBootstrapScript(defaults);
    assert.ok(script.includes(`|| '${defaults.defaultUiStyle}'`));
  });

  it('是自执行函数', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const script = renderUiStyleBootstrapScript(defaults);
    assert.ok(script.includes('(function ()'));
    assert.ok(script.includes('})();'));
  });
});

describe('renderUiStyleSheetBootstrapScript', () => {
  it('包含 data-ui-style-sheet 查询', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const script = renderUiStyleSheetBootstrapScript(defaults);
    assert.ok(script.includes('[data-ui-style-sheet]'));
  });
});

describe('renderPortalUiStyleConfig', () => {
  it('包含 GLOBAL_THEME_KEY', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const config = renderPortalUiStyleConfig(defaults);
    assert.ok(config.includes('GLOBAL_THEME_KEY'));
    assert.ok(config.includes(`'${defaults.globalThemeKey}'`));
  });

  it('包含 UI_STYLE_IDS 数组', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const config = renderPortalUiStyleConfig(defaults);
    assert.ok(config.includes('UI_STYLE_IDS = ['));
    assert.ok(config.includes("'vibrant'"));
  });
});

describe('applyShellTemplatePlaceholders', () => {
  const template = `
    <html data-ui-style="{{DEFAULT_UI_STYLE}}">
    <script>
      const GLOBAL_THEME_KEY = '{{GLOBAL_THEME_KEY}}';
      const GLOBAL_UI_STYLE_KEY = '{{GLOBAL_UI_STYLE_KEY}}';
      const UI_STYLE_IDS = {{UI_STYLE_IDS_JSON}};
      /* {{UI_STYLE_MENU_HTML}} */
      /* {{UI_STYLE_BOOTSTRAP_SCRIPT}} */
      /* {{UI_STYLE_SHEET_BOOTSTRAP_SCRIPT}} */
    </script>`;

  it('替换 {{DEFAULT_UI_STYLE}}', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const result = applyShellTemplatePlaceholders(template, defaults);
    assert.ok(!result.includes('{{DEFAULT_UI_STYLE}}'));
    assert.ok(result.includes(`"${defaults.defaultUiStyle}"`));
  });

  it('替换 {{GLOBAL_THEME_KEY}}', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const result = applyShellTemplatePlaceholders(template, defaults);
    assert.ok(!result.includes('{{GLOBAL_THEME_KEY}}'));
    assert.ok(result.includes(`'${defaults.globalThemeKey}'`));
  });

  it('替换 {{GLOBAL_UI_STYLE_KEY}}', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const result = applyShellTemplatePlaceholders(template, defaults);
    assert.ok(!result.includes('{{GLOBAL_UI_STYLE_KEY}}'));
    assert.ok(result.includes(`'${defaults.globalUiStyleKey}'`));
  });

  it('无残留 {{...}}', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const result = applyShellTemplatePlaceholders(template, defaults);
    const remaining = result.match(/\{\{/g);
    assert.equal(remaining, null);
  });
});

describe('applyShellAppPlaceholders', () => {
  const js = `
    const GLOBAL_THEME_KEY = '{{GLOBAL_THEME_KEY}}';
    const GLOBAL_UI_STYLE_KEY = '{{GLOBAL_UI_STYLE_KEY}}';
    const UI_STYLE_IDS = {{UI_STYLE_IDS_JSON}};
    const DEFAULT_UI_STYLE = '{{DEFAULT_UI_STYLE}}';`;

  it('替换所有占位符', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const result = applyShellAppPlaceholders(js, defaults);
    assert.ok(!result.includes('{{GLOBAL_THEME_KEY}}'));
    assert.ok(!result.includes('{{GLOBAL_UI_STYLE_KEY}}'));
    assert.ok(!result.includes('{{UI_STYLE_IDS_JSON}}'));
    assert.ok(!result.includes('{{DEFAULT_UI_STYLE}}'));
  });

  it('替换后包含实际值', () => {
    const defaults = loadDefaults(SKILL_ROOT);
    const result = applyShellAppPlaceholders(js, defaults);
    assert.ok(result.includes(`'${defaults.globalThemeKey}'`));
    assert.ok(result.includes(`'${defaults.globalUiStyleKey}'`));
    assert.ok(result.includes(`'${defaults.defaultUiStyle}'`));
    assert.ok(result.includes('['));
    const match = result.match(/UI_STYLE_IDS = (\[[\s\S]*?\])/);
    assert.ok(match !== null);
    const arr = JSON.parse(match[1]);
    assert.ok(Array.isArray(arr));
  });
});
