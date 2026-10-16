# -*- coding: utf-8 -*-
"""Backup every landing-page field of account 881-646-4595 and build Google Ads Editor
import files that point all ads and sitelinks to TARGET.

Reads a COPY of Editor's local database (never the live file):
    python editor_landing_pages.py <copy of ape_8816464595.db> <output folder for CSVs>

Writes:
  scripts/google-ads-backups/landing-pages-backup-<timestamp>.json   (full old values)
  <out>/HOMEPAGE_1_CAMPAIGN_SITELINKS.csv   campaign-level rows, no "Ad Group" column
  <out>/HOMEPAGE_2_ADGROUP_ADS_SITELINKS.csv ad-group-level rows (RSAs + ad group sitelinks)

Only campaigns listed in CAMPAIGNS are touched; removed/foreign campaigns are left alone.
Ads and sitelinks already on TARGET are skipped so they do not go back into review.
Editor's copy is only as fresh as its last "Get recent changes": run that first.
"""
import collections, csv, datetime, json, os, sqlite3, struct, sys

TARGET = 'https://www.brandeduk.com/'
CAMPAIGNS = ('Search | UK | Products', 'Search | UK | Industries', 'Search | Local')
STATUS = {0: 'Enabled', 1: 'Paused', 2: 'Removed'}
HERE = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(HERE, '..', 'google-ads-backups')


def urls(b):
    if not isinstance(b, bytes):
        return b
    if len(b) < 4:
        return []
    n = struct.unpack('>I', b[:4])[0]; o = 4; res = []
    for _ in range(n):
        ln = struct.unpack('>I', b[o:o + 4])[0]; o += 4
        res.append(b[o:o + ln].decode('utf-16-be')); o += ln
    return res


def clean(d):
    out = {}
    for k, v in d.items():
        if k.endswith('_history'):
            continue
        if isinstance(v, bytes):
            v = urls(v) if ('Url' in k or 'url' in k) else None
        if v not in (None, '', []):
            out[k] = v
    return out


def main(db_path, out_dir):
    db = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    rows = lambda t: [dict(r) for r in db.execute(f'select * from "{t}"')]
    lo = lambda p: p & 0xFFFFFFFF
    hi = lambda p: p >> 32

    account = rows('AccountSetting')[0]
    camps = {c['localId']: c for c in rows('Campaign')}
    ags = {a['localId']: a for a in rows('AdGroup')}
    rsas = rows('ResponsiveSearchAd')
    sitelinks = {s['localId']: s for s in rows('SitelinkV2')}
    edges = rows('SitelinkV2Edge')
    keywords_with_urls = [k for k in rows('Keyword') if urls(k['finalUrls']) or k['u2TrackingUrl'] or k['u2FinalUrlSuffix']]

    in_scope = {cid for cid, c in camps.items() if c['name'] in CAMPAIGNS}
    ag_campaign = {aid: lo(a['parentId']) for aid, a in ags.items()}

    backup = {
        'account': {'customerId': '881-646-4595', 'name': account['name'],
                    'trackingTemplate': account['u2TrackingUrl'], 'finalUrlSuffix': account['u2FinalUrlSuffix'],
                    'finalUrlSuffix_serverIfUnposted': account['u2FinalUrlSuffix_revert']},
        'source': 'Google Ads Editor local DB copy ' + os.path.basename(db_path),
        'takenAt': datetime.datetime.now().isoformat(timespec='seconds'),
        'target': TARGET,
        'campaigns': [clean(c) | {'statusText': STATUS.get(c['status'])} for c in camps.values()],
        'adGroups': [clean(a) | {'campaign': camps[lo(a['parentId'])]['name']} for a in ags.values()],
        'responsiveSearchAds': [clean(r) | {'campaign': camps[ag_campaign[lo(r['parentId'])]]['name'],
                                           'adGroup': ags[lo(r['parentId'])]['name']} for r in rsas],
        'callOnlyAds': [clean(r) for r in rows('CallOnlyAd')],
        'sitelinks': [clean(s) for s in sitelinks.values()],
        'sitelinkLinks': [clean(e) | {'level': {2: 'campaign', 4: 'adGroup'}.get(hi(e['parentId']), 'account'),
                                      'ownerLocalId': lo(e['parentId'])} for e in edges],
        'keywordsWithUrlFields': [clean(k) for k in keywords_with_urls],
    }
    os.makedirs(BACKUP_DIR, exist_ok=True)
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    backup_path = os.path.abspath(os.path.join(BACKUP_DIR, f'landing-pages-backup-{stamp}.json'))
    with open(backup_path, 'w', encoding='utf-8') as fh:
        json.dump(backup, fh, ensure_ascii=False, indent=1, default=str)

    head = [f'Headline {i}' for i in range(1, 16)]
    desc = [f'Description {i}' for i in range(1, 5)]
    changes = []

    cols2 = ['Campaign', 'Ad Group', 'Status', 'Ad type', 'Final URL'] + head + desc + \
            ['Path 1', 'Path 2', 'Link source', 'Link Text', 'Description Line 1', 'Description Line 2']
    rows2 = []
    pinned = []
    for r in rsas:
        ag = lo(r['parentId'])
        cid = ag_campaign[ag]
        if cid not in in_scope or r['status'] == 2:
            continue
        old = urls(r['finalUrls'])
        if old == [TARGET] and not urls(r.get('finalMobileUrls')):
            continue
        row = {'Campaign': camps[cid]['name'], 'Ad Group': ags[ag]['name'], 'Status': STATUS[r['status']],
               'Ad type': 'Responsive search ad', 'Final URL': TARGET,
               'Path 1': r.get('path1') or '', 'Path 2': r.get('path2') or ''}
        for i in range(1, 16):
            row[f'Headline {i}'] = r.get(f'headline{i}') or ''
            if r.get(f'headline{i}Pos'):
                pinned.append((ags[ag]['name'], f'headline{i}'))
        for i in range(1, 5):
            row[f'Description {i}'] = r.get(f'description{i}') or ''
            if r.get(f'description{i}Pos'):
                pinned.append((ags[ag]['name'], f'description{i}'))
        rows2.append(row)
        changes.append(('Ad', camps[cid]['name'], ags[ag]['name'], r['headline1'], old))

    cols1 = ['Campaign', 'Status', 'Link source', 'Link Text', 'Description Line 1', 'Description Line 2', 'Final URL']
    rows1 = []
    for e in edges:
        level, owner = hi(e['parentId']), lo(e['parentId'])
        s = sitelinks[e['sourceId']]
        if level not in (2, 4):
            print('WARNING account-level sitelink not exported:', s['displayText'], urls(s['finalUrls']))
            continue
        if urls(s['finalUrls']) == [TARGET]:
            continue
        base = {'Status': STATUS[e['status']], 'Link source': 'Advertiser', 'Link Text': s['displayText'],
                'Description Line 1': s.get('description1') or '', 'Description Line 2': s.get('description2') or '',
                'Final URL': TARGET}
        if level == 2 and owner in in_scope:
            rows1.append({'Campaign': camps[owner]['name']} | base)
            changes.append(('Sitelink', camps[owner]['name'], '', s['displayText'], urls(s['finalUrls'])))
        elif level == 4 and ag_campaign.get(owner) in in_scope:
            rows2.append({'Campaign': camps[ag_campaign[owner]]['name'], 'Ad Group': ags[owner]['name']} | base)
            changes.append(('Sitelink', camps[ag_campaign[owner]]['name'], ags[owner]['name'], s['displayText'], urls(s['finalUrls'])))

    os.makedirs(out_dir, exist_ok=True)
    for name, cols, data in (('HOMEPAGE_1_CAMPAIGN_SITELINKS.csv', cols1, rows1),
                             ('HOMEPAGE_2_ADGROUP_ADS_SITELINKS.csv', cols2, rows2)):
        with open(os.path.join(out_dir, name), 'w', encoding='utf-8-sig', newline='') as fh:
            w = csv.writer(fh, lineterminator='\r\n')
            w.writerow(cols)
            for d in data:
                w.writerow([d.get(c, '') for c in cols])

    meta = rows('MetaInfo')[0]
    last_sync = datetime.datetime.fromtimestamp(meta['accountLevelLastSync'] / 1e6)
    print('BACKUP', backup_path)
    print('EDITOR last download from Google:', last_sync.isoformat(timespec='minutes'),
          '(anything changed in the web UI after this is not in these files)')
    print('ACCOUNT final URL suffix:', repr(account['u2FinalUrlSuffix']), '| tracking template:', repr(account['u2TrackingUrl']))
    for label, items in (('ACCOUNT', [account]), ('CAMPAIGN', [c for c in camps.values() if c['localId'] in in_scope]),
                         ('AD GROUP', [a for a in ags.values() if ag_campaign[a['localId']] in in_scope])):
        for it in items:
            if '://' in (it.get('u2FinalUrlSuffix') or ''):
                print(f'WARNING {label} final URL suffix is a URL, clear it by hand:', it.get('name'), repr(it['u2FinalUrlSuffix']))
    if keywords_with_urls:
        print('WARNING keywords with their own URL fields (not exported, fix by hand):', len(keywords_with_urls))
    if pinned:
        print('WARNING pinned assets are not written to the CSV, check them after import:', pinned)
    print(f'file1 rows {len(rows1)}, file2 rows {len(rows2)}')
    counts = collections.Counter((c[1], c[0]) for c in changes)
    for (campaign, kind), n in sorted(counts.items()):
        print(f'COUNT {campaign} | {kind}: {n}')
    for c in changes:
        print('CHANGE', c[0], '|', c[1], '|', c[2], '|', c[3], '|', c[4], '->', TARGET)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
