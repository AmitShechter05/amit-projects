/**
 * IndexNow - מודיע ל-Bing (ומשם ל-DuckDuckGo, Copilot וחיפוש של ChatGPT) ול-Yandex
 * על כל הכתובות במפת האתר. בלי חשבון: ההוכחה היא קובץ המפתח ב-public/.
 * הרצה אחרי שינוי גדול באתר: node scripts/indexnow.mjs
 */
const KEY = '4689388eb6db10c04e0b000f54635bf0';
const HOST = 'mikra.shop';
const xml = await (await fetch('https://' + HOST + '/sitemap.xml')).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList }),
});
console.log(urlList.length, 'כתובות ·', res.status, res.statusText);
