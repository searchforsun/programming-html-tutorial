import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  hasIllegalTags,
  countSteps,
  countTerms,
  extractTermIds,
  isTheoryChapter,
  extractH3Texts,
  getChapterPhaseId,
  getChapterOutlineEntry,
  fixH5Check,
  getQuizSection,
  quizHasTypes,
  findQuizMetaKey,
  loadQualityConfig,
} from '../chapter-quality.mjs';

describe('hasIllegalTags', () => {
  it('detects <motion>', () => {
    assert.ok(hasIllegalTags('<motion class="fade">text</motion>'));
  });

  it('detects <TAGDIV>', () => {
    assert.ok(hasIllegalTags('<TAGDIV>text</TAGDIV>'));
  });

  it('returns false for clean HTML', () => {
    assert.ok(!hasIllegalTags('<div class="normal"><p>clean</p></div>'));
  });
});

describe('countSteps', () => {
  it('counts li in steps ol', () => {
    const html = '<ol class="steps"><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol>';
    assert.strictEqual(countSteps(html), 3);
  });

  it('returns 0 when no steps ol', () => {
    assert.strictEqual(countSteps('<p>no steps</p>'), 0);
  });

  it('ignores li outside steps ol', () => {
    const html = '<ol class="steps"><li>Step 1</li></ol><ul><li>other</li></ul>';
    assert.strictEqual(countSteps(html), 1);
  });
});

describe('countTerms', () => {
  it('counts term spans', () => {
    const html = '<span class="term">A</span> text <span class="term">B</span>';
    assert.strictEqual(countTerms(html), 2);
  });

  it('returns 0 for no terms', () => {
    assert.strictEqual(countTerms('<p>nothing</p>'), 0);
  });
});

describe('extractTermIds', () => {
  it('extracts unique data-term-id values', () => {
    const html = '<span class="term" data-term-id="t1">A</span><span class="term" data-term-id="t2">B</span><span class="term" data-term-id="t1">A2</span>';
    const ids = extractTermIds(html);
    assert.strictEqual(ids.size, 2);
    assert.ok(ids.has('t1'));
    assert.ok(ids.has('t2'));
  });

  it('returns empty set for no terms', () => {
    assert.strictEqual(extractTermIds('<p>none</p>').size, 0);
  });
});

describe('isTheoryChapter', () => {
  const config = { terms: { theoryPhaseIds: ['basics', 'advanced'] } };

  it('returns true when phaseId is theory', () => {
    assert.ok(isTheoryChapter('basics', 'basics-01', config));
  });

  it('returns true when chapterId matches theory prefix', () => {
    assert.ok(isTheoryChapter(null, 'advanced-config', config));
  });

  it('returns false for practice chapter', () => {
    assert.ok(!isTheoryChapter('practice', 'practice-01', config));
  });

  it('uses default theoryPhaseIds when config lacks terms', () => {
    assert.ok(isTheoryChapter('basics', 'basics-intro', {}));
  });
});

describe('extractH3Texts', () => {
  it('extracts h3 plain text', () => {
    const html = '<h3>第一节</h3><p>text</p><h3>动手练习</h3>';
    const texts = extractH3Texts(html);
    assert.deepStrictEqual(texts, ['第一节', '动手练习']);
  });

  it('returns empty array for no h3', () => {
    assert.deepStrictEqual(extractH3Texts('<p>none</p>'), []);
  });
});

describe('getChapterPhaseId', () => {
  const course = {
    outline: [
      {
        phaseId: 'basics',
        chapters: [{ id: 'basics-01' }, { id: 'basics-02' }],
      },
      {
        phaseId: 'practice',
        chapters: [{ id: 'practice-01' }],
      },
    ],
  };

  it('returns phaseId for matching chapter', () => {
    assert.strictEqual(getChapterPhaseId(course, 'basics-02'), 'basics');
    assert.strictEqual(getChapterPhaseId(course, 'practice-01'), 'practice');
  });

  it('returns null for unknown chapter', () => {
    assert.strictEqual(getChapterPhaseId(course, 'nonexistent'), null);
  });
});

describe('getChapterOutlineEntry', () => {
  const course = {
    outline: [{ chapters: [{ id: 'ch1', title: 'Chapter One' }] }],
  };

  it('finds chapter by id', () => {
    const entry = getChapterOutlineEntry(course, 'ch1');
    assert.strictEqual(entry.title, 'Chapter One');
  });

  it('returns null for missing chapter', () => {
    assert.strictEqual(getChapterOutlineEntry(course, 'ch99'), null);
  });
});

describe('fixH5Check', () => {
  it('detects h5 outside mermaid-wrap', () => {
    assert.ok(fixH5Check('<h5>bad heading</h5>'));
  });

  it('ignores h5 inside mermaid-wrap', () => {
    const html = '<div class="mermaid-wrap"><h5>inside</h5></div><p>clean</p>';
    assert.ok(!fixH5Check(html));
  });

  it('detects h5 when both inside and outside exist', () => {
    const html = '<div class="mermaid-wrap"><h5>inside</h5></div><h5>outside</h5>';
    assert.ok(fixH5Check(html));
  });

  it('returns false when no h5 at all', () => {
    assert.ok(!fixH5Check('<p>no headings</p>'));
  });
});

describe('getQuizSection', () => {
  const quizHtml = '<section class="quiz-section" data-chapter="ch1"><div>quiz</div></section><section class="quiz-section" data-chapter="ch2">other</section>';

  it('extracts matching quiz section', () => {
    const section = getQuizSection(quizHtml, 'ch1');
    assert.ok(section.includes('quiz'));
    assert.ok(!section.includes('other'));
  });

  it('returns null for missing chapter', () => {
    assert.strictEqual(getQuizSection(quizHtml, 'ch99'), null);
  });

  it('returns null when quizHtml is falsy', () => {
    assert.strictEqual(getQuizSection(null, 'ch1'), null);
  });
});

describe('quizHasTypes', () => {
  it('checks all required types present', () => {
    const html = '<input type="radio"><input type="checkbox"><div class="fill-input">';
    assert.ok(quizHasTypes(html, ['single', 'multi', 'fill']));
  });

  it('returns false when a type is missing', () => {
    const html = '<input type="radio"><input type="checkbox">';
    assert.ok(!quizHasTypes(html, ['single', 'multi', 'fill']));
  });
});

describe('findQuizMetaKey', () => {
  const quizzes = {
    'ch1-quiz': { chapterId: 'ch1' },
    'misc-quiz': { chapterId: 'ch2' },
  };

  it('finds by standard key pattern', () => {
    assert.strictEqual(findQuizMetaKey(quizzes, 'ch1'), 'ch1-quiz');
  });

  it('finds by chapterId fallback', () => {
    assert.strictEqual(findQuizMetaKey(quizzes, 'ch2'), 'misc-quiz');
  });

  it('returns null when not found', () => {
    assert.strictEqual(findQuizMetaKey(quizzes, 'ch99'), null);
  });

  it('returns null when quizzes is falsy', () => {
    assert.strictEqual(findQuizMetaKey(null, 'ch1'), null);
  });
});
