// Run: node check-site.cjs
const assert = require('assert');
const fs = require('fs');
const pages = ['index', 'about', 'contact', 'writing', 'aiq', 'myos', 'steelpan', 'datamatch', 'aadt'];
for (const page of pages) {
  const html = fs.readFileSync(page + '.html', 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${page}: IDs must be unique`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${page}: one page heading`);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(url)) continue;
    const [path, fragment] = decodeURIComponent(url).split('#');
    const file = path.split('?')[0];
    if (file) assert(fs.existsSync(file), `${page}: missing file ${file}`);
    if (fragment) {
      const target = file ? fs.readFileSync(file, 'utf8') : html;
      assert(target.includes(`id="${fragment}"`), `${page}: missing anchor ${url}`);
    }
  }
  for (const target of ['index', 'about', 'contact']) assert(html.includes(`href="${target}.html"`));
  assert(!html.includes('href="art.html"'), 'Art must be removed from navigation');
  assert(!html.includes('src="work.js"'));
}
const home = fs.readFileSync('index.html', 'utf8');
for (const id of ['about', 'writing', 'art', 'contact', 'pubs']) assert(!home.includes(`id="${id}"`), 'Secondary content must be on its own page');
assert(home.includes('project-rail') && !home.includes('rail-controls'));
assert(home.includes('tabindex="0" role="region"'), 'Keep native keyboard scrolling accessible');
assert(!home.includes('project-grid'));
const aiqPreview = home.match(/<article class="project project-phone"[\s\S]*?<\/article>/)[0];
assert.equal((aiqPreview.match(/<img /g) || []).length, 3);
assert.equal(new Set([...aiqPreview.matchAll(/src="([^"]+)"/g)].map(match => match[1])).size, 3);
assert(aiqPreview.includes('href="aiq.html"'));
const aiqPage = fs.readFileSync('aiq.html', 'utf8');
assert.equal(new Set([...aiqPage.matchAll(/src="(projects\/aiq\/[^"]+)"/g)].map(match => match[1])).size, 7);
for (const project of ['aiq', 'myos', 'steelpan', 'datamatch', 'aadt']) {
  const preview = home.match(new RegExp('<article[^>]+id="' + project + '"[\\s\\S]*?</article>'))[0];
  assert(preview.includes('class="device-stage" href="' + project + '.html"'));
}
const about = fs.readFileSync('about.html', 'utf8');
assert(about.includes('Harvard University'));
assert(about.includes('Major: CS &amp; Statistics'));
assert(about.includes('Thomas Jefferson High School for Science and Technology'));
for (const removed of ['GPA', 'SAT:', 'Experience', 'class="pub"', 'regenerative biology']) assert(!about.includes(removed));
assert(about.includes('id="links"'));
assert(about.includes('https://scholar.google.com/citations?user=ds3ZFjMAAAAJ&amp;hl=en'));
assert(!home.includes('id="research"'));
assert(fs.readFileSync('research.html', 'utf8').includes('url=about.html#links'));
const myos = fs.readFileSync('myos.html', 'utf8');
for (const screenshot of ['myos.webp', 'myos-dashboard.webp', 'myos-digest.webp']) assert(myos.includes('projects/' + screenshot));
console.log('Passed: page links, project navigation, screenshots, CS and statistics, and research relocation.');

assert(!home.includes('more-work'));
for (const [id, device] of [['datamatch', 'laptop'], ['aadt', 'phone']]) {
  const card = home.match(new RegExp('<article class="project[^>]*id="' + id + '"[\\s\\S]*?</article>'))[0];
  assert(card.includes('class="' + device + (id === 'datamatch' ? ' device' : '') + '"'));
  if (id === 'aadt') {
    assert(card.includes('phone-row'));
    assert.equal(new Set([...card.matchAll(/src="([^"]+)"/g)].map(match => match[1])).size, 3);
  }
  if (id === 'datamatch') assert(card.includes('projects/datamatch.webp'));

  assert(home.indexOf(card) > home.indexOf('class="project-rail"'));
  assert(home.indexOf(card) < home.indexOf('</section>'));
}
