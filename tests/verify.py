# 計算問題の正解を、問題文の数値から独立に計算し直して照合する（tests/test.js の後に実行）
# 使い方（リポジトリ直下で）: python tests/verify.py
import json, math, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
S = json.load(open(ROOT / 'samples.json', encoding='utf8'))
num = lambda s: float(s.replace('−', '-'))
# 普通幾何公差（JIS B 0419:1991）。res.js とは別に書き、表の写し間違いも検出する
B0419 = {
    '真直度・平面度': ([10, 30, 100, 300, 1000, 3000], {'H': [0.02, 0.05, 0.1, 0.2, 0.3, 0.4], 'K': [0.05, 0.1, 0.2, 0.4, 0.6, 0.8], 'L': [0.1, 0.2, 0.4, 0.8, 1.2, 1.6]}),
    '直角度': ([100, 300, 1000, 3000], {'H': [0.2, 0.3, 0.4, 0.5], 'K': [0.4, 0.6, 0.8, 1], 'L': [0.6, 1, 1.5, 2]}),
    '対称度': ([100, 300, 1000, 3000], {'H': [0.5, 0.5, 0.5, 0.5], 'K': [0.6, 0.6, 0.8, 1], 'L': [0.6, 1, 1.5, 2]}),
}
RUN = {'H': 0.1, 'K': 0.2, 'L': 0.5}
ng = 0
for o in S:
    q, a, i = o['q'], o['a'], o['id']
    try:
        if i == 'g_posdev':
            dx, dy = [num(x) for x in re.findall(r'方向 (−?-?[\d.]+) mm', q)]
            ok = abs(float(a) - 2 * math.hypot(dx, dy)) <= 0.0006
        elif i in ('g_posjudge', 'g_mmcjudge'):
            m = re.search(r'Δx＝([\d.]+)( mm)?、Δy＝([\d.]+)', q); dx, dy = float(m.group(1)), float(m.group(3))
            t = float(re.search(r'位置度 φ([\d.]+)', q).group(1))
            if i == 'g_mmcjudge':
                D = float(re.search(r'穴 φ(\d+) ', q).group(1)); d = float(re.search(r'実寸法は φ([\d.]+)', q).group(1)); t += d - D
            v = 2 * math.hypot(dx, dy)
            g = re.search(r'位置度 φ([\d.]+)、許容 φ([\d.]+) → (合格|不合格)', a)
            ok = abs(float(g.group(1)) - v) <= 0.0006 and abs(float(g.group(2)) - t) <= 1e-9 and ((g.group(3) == '合格') == (round(v, 3) <= round(t, 3)))
        elif i == 'g_bonus':
            # 公差値は問題の図（公差記入枠）にある
            hole = q.startswith('穴'); D = float(re.search(r'φ(\d+) ', q).group(1)); d = float(re.search(r'実寸法は φ([\d.]+)', q).group(1))
            t = float(re.search(r'φ([\d.]+)\(M\)', o['fig'][1]['tol']).group(1))
            ok = abs(float(a) - (t + (d - D if hole else D - d))) <= 0.0006 and (d >= D if hole else d <= D)
        elif i == 'g_vc':
            hole = q.startswith('穴'); D = float(re.search(r'φ(\d+) ', q).group(1)); t = float(re.search(r'位置度 φ([\d.]+) Ⓜ', q).group(1))
            ok = abs(float(a) - (D - t if hole else D + t)) <= 0.006
        elif i == 'g_runout':
            vals = [num(x) for x in re.findall(r'[+−-][\d.]+', q.split('\n')[1])]
            ok = len(vals) == 8 and abs(float(a) - (max(vals) - min(vals))) <= 0.0006
        elif i == 'g_gen0419':
            cls = re.search(r'0419-m([HKL])', q).group(1); L = float(re.search(r'呼び長さ (\d+) mm', q).group(1))
            name = re.search(r'」と指示されている。(.+?)の普通公差', q).group(1)
            if name == '円周振れ': want = RUN[cls]
            else:
                ub, v = B0419[name]; want = next(v[cls][k] for k, u in enumerate(ub) if L <= u)
            ok = abs(float(a) - want) < 1e-9
        elif i == 'g_float':
            H = float(re.search(r'通し穴（φ([\d.]+)）', q).group(1)); F = float(re.search(r'M(\d+)', q).group(1))
            ok = abs(float(a) - ((H - F) if '浮動締結' in q else (H - F) / 2)) <= 0.0006
        elif i == 'g_coax':
            e = float(re.search(r'偏心）は ([\d.]+) mm', q).group(1)); ok = abs(float(a) - 2 * e) <= 0.0006
        elif i == 'g_square':
            a0 = float(re.search(r'±([\d.]+) mm', q).group(1)); ok = abs(float(a) - 2 * math.sqrt(2) * a0) <= 0.0006
        elif i == 'g_cmm':
            mx, my = [float(x) for x in re.search(r'x＝([\d.]+)、y＝([\d.]+) だった', q).groups()]
            tx, ty = [float(x) for x in re.search(r'x＝(\d+)、y＝(\d+)。', q).groups()]
            ok = abs(float(a) - 2 * math.hypot(mx - tx, my - ty)) <= 0.0006
        elif i == 'g_zero':
            D = float(re.search(r'穴 φ(\d+) ', q).group(1)); d = float(re.search(r'実寸法は φ([\d.]+)', q).group(1))
            dx, dy = [float(x) for x in re.search(r'Δx＝([\d.]+)、Δy＝([\d.]+)', q).groups()]
            v = 2 * math.hypot(dx, dy); t = d - D
            g = re.search(r'位置度 φ([\d.]+)、許容 φ([\d.]+) → (合格|不合格)', a)
            ok = abs(float(g.group(1)) - v) <= 0.0006 and abs(float(g.group(2)) - t) <= 1e-9 and ((g.group(3) == '合格') == (round(v, 3) <= round(t, 3)))
        elif i == 'g_zeroconv':
            m = re.search(r'(穴|軸) φ(\d+) (?:\+([\d.]+)/0|0/−([\d.]+)) に位置度 φ([\d.]+) Ⓜ', q)
            hole = m.group(1) == '穴'; D = float(m.group(2)); tol = float(m.group(3) or m.group(4)); t = float(m.group(5))
            g = re.search(r'(穴|軸) φ([\d.]+) (?:\+([\d.]+)/0|0/−([\d.]+))、位置度 φ0 Ⓜ', a)
            newD = float(g.group(2)); newT = float(g.group(3) or g.group(4))
            ok = (g.group(1) == m.group(1)) and abs(newD - (D - t if hole else D + t)) < 1e-9 and abs(newT - (tol + t)) < 1e-9
        elif i == 'g_parallel':
            vals = [num(x) for x in re.findall(r'[+−][\d.]+', q.split('\n')[1])]
            ok = len(vals) == 9 and abs(float(a) - (max(vals) - min(vals))) <= 0.0006
        elif i == 'g_trun':
            mx = [num(x) for x in re.findall(r'最大 ([+−][\d.]+)', q)]; mn = [num(x) for x in re.findall(r'最小 ([+−][\d.]+)', q)]
            ok = len(mx) == 3 and abs(float(a) - (max(mx) - min(mn))) <= 0.0006
        elif i == 'g_profjudge':
            t = float(re.search(r'面の輪郭度 ([\d.]+)', q).group(1)); d = [num(x) for x in re.findall(r'[+−][\d.]+', q.split('\n')[1])]
            g = re.search(r'ずれの最大 ([\d.]+)、許容 ±([\d.]+) → (合格|不合格)', a)
            m = max(abs(x) for x in d)
            ok = g is not None and abs(float(g.group(1)) - m) < 1e-9 and abs(float(g.group(2)) - t / 2) < 1e-9 and ((g.group(3) == '合格') == (m <= t / 2 + 1e-9))
        elif i == 'g_gauge':
            hole = '穴' in q.split('に、')[0]; D = float(re.search(r'φ(\d+) ', q).group(1))
            t = float(re.search(r'φ([\d.]+)\(M\)', o['fig'][1]['tol']).group(1))
            ok = abs(float(a) - (D - t if hole else D + t)) <= 0.006
        elif i == 'g_clear':
            Dh, ah, t1 = [float(x) for x in re.search(r'穴 φ([\d.]+) \+([\d.]+)/0 に位置度 φ([\d.]+) Ⓜ', q).groups()]
            Dp, ap, t2 = [float(x) for x in re.search(r'ピン φ([\d.]+) 0/−([\d.]+) に位置度 φ([\d.]+) Ⓜ', q).groups()]
            ok = abs(num(a) - ((Dh - t1) - (Dp + t2))) <= 0.006
        elif i == 'g_stack':
            ta, tb, tc = [float(x) for x in re.findall(r'＝[\d.]+±([\d.]+)', q)]; tp = float(re.search(r'位置度 φ([\d.]+)', q).group(1))
            want = (ta + tb + tc + tp / 2) if '最悪値法' in q else math.sqrt(ta**2 + tb**2 + tc**2 + (tp / 2)**2)
            ok = abs(float(a.lstrip('±')) - want) <= 0.0006
        elif i == 'g_cpkgdt':
            t = float(re.search(r'公差 ([\d.]+)）', q).group(1)); m, sd = [float(x) for x in re.search(r'平均 ([\d.]+)、標準偏差 ([\d.]+)', q).groups()]
            ok = abs(float(a) - (t - m) / (3 * sd)) <= 0.006
        elif i == 'g_dshift':
            Db = float(re.search(r'穴 φ(\d+) ', q).group(1)); db = float(re.search(r'実寸法が φ([\d.]+)', q).group(1))
            m = re.search(r'直角度 φ([\d.]+) Ⓜ', q); bd = Db - float(m.group(1)) if m else Db
            ok = abs(float(a) - (db - bd)) <= 0.006
        elif i == 'g_guard':
            t = float(re.search(r'平面度 ([\d.]+) の', q).group(1)); m, U = [float(x) for x in re.search(r'測定値 ([\d.]+)、測定の拡張不確かさ U＝([\d.]+)', q).groups()]
            want = '供給者は適合を示せる／受入側は不適合を示せない' if m <= t - U else ('供給者は適合を示せない／受入側も不適合を示せない' if m <= t + U else '供給者は適合を示せない／受入側は不適合を示せる')
            ok = a == want
        elif i == 'g_jpos':
            a0 = float(re.search(r'穴 φ10 \+([\d.]+)/0', q).group(1)); t = float(re.search(r'位置度 φ([\d.]+)', q).group(1)); M = 'Ⓜ' in q
            d = float(re.search(r'実寸法は φ([\d.]+)', q).group(1)); dx, dy = [num(x) for x in re.search(r'Δx＝([+−][\d.]+)、Δy＝([+−][\d.]+)', q).groups()]
            al = t + (d - 10 if M else 0); ok = (a == '合格') == (2 * math.hypot(dx, dy) <= al + 1e-9) and 10 <= d <= 10 + a0 + 1e-9
        elif i in ('g_jpar', 'g_jrun'):
            t = float(re.search(r'(?:平行度|円周振れ) ([\d.]+)', q).group(1)); vals = [num(x) for x in re.findall(r'[+−][\d.]+', q.split('\n')[1])]
            ok = (a == '合格') == (max(vals) - min(vals) <= t + 1e-9)
        elif i == 'g_jprof':
            t = float(re.search(r'面の輪郭度 ([\d.]+)', q).group(1)); vals = [num(x) for x in re.findall(r'[+−][\d.]+', q.split('\n')[1])]
            ok = (a == '合格') == (max(abs(x) for x in vals) <= t / 2 + 1e-9)
        else:
            ok = False
    except Exception as e:
        ok = False; print('解析できない', i, e, q[:80])
    if not ok:
        ng += 1
        if ng < 15: print('NG', i, q[:120], '→', a)
print(f'{len(S)} 件を照合、不一致 {ng} 件')
if ng: raise SystemExit(1)
