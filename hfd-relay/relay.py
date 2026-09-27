r"""
HFD tracking relay — runs hourly on this PC (Windows Task Scheduler).

HFD's tracking service refuses cloud servers (403 from Cloudflare), but a
home connection in Israel gets through. This script is the bridge:

  1. asks onezonejersey.com which parcels are on their way   (GET  /api/hfd/sync)
  2. asks HFD about each one, a third of a second apart
  3. hands the answers back in batches of 20                   (POST /api/hfd/sync)

The site stores a small summary on the order, only when something changed.
Nothing is written on this PC except a short log.

Secret: C:\Users\amith\.secrets\hfd-sync-secret.txt (same value as the
HFD_SYNC_SECRET env var on Vercel). Run by hand:  python relay.py
"""
import json, sys, time, urllib.parse, urllib.request
from datetime import datetime
from pathlib import Path

SITE = 'https://onezonejersey.com/api/hfd/sync'
HFD = 'https://ws.hfd.co.il/Epost-Tracking/service.php'
SECRET = Path(r'C:\Users\amith\.secrets\hfd-sync-secret.txt').read_text().strip()
LOG = Path(__file__).parent / 'logs' / 'relay.log'
UA = 'OneZone-HFD-Relay/1.0'
BATCH = 20


def log(msg: str) -> None:
    line = f'{datetime.now():%Y-%m-%d %H:%M:%S} {msg}'
    print(line)
    LOG.parent.mkdir(exist_ok=True)
    # keep the log short: last ~500 lines
    old = LOG.read_text(encoding='utf-8').splitlines()[-500:] if LOG.exists() else []
    LOG.write_text('\n'.join(old + [line]) + '\n', encoding='utf-8')


def site(method: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        SITE, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': f'Bearer {SECRET}', 'Content-Type': 'application/json', 'User-Agent': UA},
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def hfd(tn: str) -> str | None:
    body = urllib.parse.urlencode({'client_id': '8260', 'tracking_id': tn, 'ref': 'ALL', 'lang': 'he'}).encode()
    req = urllib.request.Request(HFD, data=body, headers={'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            xml = r.read().decode('utf-8', 'ignore')
        return xml if '<ship_stages>' in xml else None
    except Exception as e:  # one parcel failing never stops the run
        log(f'  HFD {tn}: {e}')
        return None


def main() -> int:
    try:
        todo = site('GET')
    except Exception as e:
        log(f'list failed: {e}')
        return 1
    items = todo.get('items', [])
    results, asked, got = [], 0, 0
    totals = {'written': 0, 'unchanged': 0, 'unparsable': 0}

    def flush():
        if not results:
            return
        try:
            r = site('POST', {'results': results})
            for k in totals:
                totals[k] += r.get(k, 0)
        except Exception as e:
            log(f'post failed: {e}')
        results.clear()

    for it in items:
        asked += 1
        xml = hfd(it['tn'])
        if xml:
            got += 1
            results.append({'orderId': it['orderId'], 'tn': it['tn'], 'h': it.get('h', ''), 'xml': xml})
        if len(results) >= BATCH:
            flush()
        time.sleep(0.35)
    flush()
    log(f'parcels {len(items)} · HFD answered {got}/{asked} · updated {totals["written"]} · unchanged {totals["unchanged"]} · unparsable {totals["unparsable"]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
