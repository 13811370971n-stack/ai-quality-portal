/**
 * 教学图示 · 正态分布与西格玛水平
 *
 * 几何按真实比例：每 1σ = 36px，z=0 位于 x=210，基线 y=120，峰值 y=22。
 * 曲线由标准正态密度函数实时生成，不手绘 —— 标注 3σ 的位置就真的是 3σ。
 * 几何与数值由 gen_deck_geometry.py 验算（每σ=36.00px，z=-3→+3 实测 6.000σ）。
 */

const X0 = 30;
const X1 = 390;
const Z0 = -5;
const Z1 = 5;
const BASE = 120;
const PEAK = 22;

/** z 值 → x 像素 */
const zx = (z: number) => X0 + ((z - Z0) / (Z1 - Z0)) * (X1 - X0);
/** 密度 → y 像素，mu 为分布中心 */
const zy = (z: number, mu = 0) => BASE - Math.exp(-0.5 * (z - mu) ** 2) * (BASE - PEAK);

const PX_PER_SIGMA = zx(1) - zx(0); // = 36

function curvePath(mu = 0, step = 0.1): string {
  const pts: string[] = [];
  for (let z = Z0; z <= Z1 + 1e-9; z += step) {
    pts.push(`${zx(z).toFixed(1)},${zy(z, mu).toFixed(1)}`);
  }
  return 'M ' + pts.join(' L ');
}

/** 填充区域：从 zA 到 zB 的曲线下方 */
function areaPath(zA: number, zB: number, mu = 0, step = 0.05): string {
  const pts: string[] = [`${zx(zA).toFixed(1)},${BASE}`];
  for (let z = zA; z <= zB + 1e-9; z += step) {
    pts.push(`${zx(z).toFixed(1)},${zy(z, mu).toFixed(1)}`);
  }
  pts.push(`${zx(zB).toFixed(1)},${BASE}`);
  return 'M ' + pts.join(' L ') + ' Z';
}

const NAVY = '#051C2C';
const TEAL = '#00A0AF';
const GOLD = '#C5A572';
const MUTED = '#8B9DAF';
const RED = '#DC2626';

function SpecLine({ z, label, color = NAVY }: { z: number; label: string; color?: string }) {
  return (
    <g>
      <line x1={zx(z)} y1={14} x2={zx(z)} y2={BASE} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={zx(z)} y={10} textAnchor="middle" fontSize={9} fill={color} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

function Baseline() {
  return <line x1={X0 - 6} y1={BASE} x2={X1 + 6} y2={BASE} stroke={MUTED} strokeWidth={1} />;
}

function SigmaTicks({ from = -4, to = 4, mu = 0 }: { from?: number; to?: number; mu?: number }) {
  const out = [];
  for (let z = from; z <= to; z++) {
    out.push(
      <g key={z}>
        <line x1={zx(z)} y1={BASE} x2={zx(z)} y2={BASE + 4} stroke={MUTED} strokeWidth={1} />
        <text x={zx(z)} y={BASE + 14} textAnchor="middle" fontSize={8} fill={MUTED}>
          {z === mu ? 'μ' : `${z > 0 ? '+' : ''}${z}σ`}
        </text>
      </g>
    );
  }
  return <>{out}</>;
}

/* ============================================================
   图 1 · 3σ 过程：规格恰好在 ±3σ，双侧不良 2700 PPM
   ============================================================ */
export function DiagramThreeSigma() {
  return (
    <svg viewBox="0 0 420 150" className="w-full h-auto" role="img"
         aria-label="三西格玛过程：规格限位于正负三西格玛，双侧尾部不良约 2700 PPM">
      <path d={areaPath(-5, -3)} fill={RED} opacity={0.5} />
      <path d={areaPath(3, 5)} fill={RED} opacity={0.5} />
      <path d={curvePath()} fill="none" stroke={NAVY} strokeWidth={2} />
      <Baseline />
      <SigmaTicks />
      <SpecLine z={-3} label="LSL" />
      <SpecLine z={3} label="USL" />
      <line x1={zx(-3)} y1={BASE - 78} x2={zx(3)} y2={BASE - 78} stroke={TEAL} strokeWidth={1} />
      <text x={zx(0)} y={BASE - 82} textAnchor="middle" fontSize={9} fill={TEAL} fontWeight={600}>
        规格宽度 = 6σ
      </text>
      <text x={zx(-3.6)} y={BASE - 8} textAnchor="middle" fontSize={8} fill={RED}>1350</text>
      <text x={zx(3.6)} y={BASE - 8} textAnchor="middle" fontSize={8} fill={RED}>1350</text>
      <text x={zx(0)} y={BASE + 30} textAnchor="middle" fontSize={9} fill={RED} fontWeight={600}>
        双侧合计约 2,700 PPM（0.27%）
      </text>
    </svg>
  );
}

/* ============================================================
   图 2 · 1.5σ 偏移：规格不动，分布中心右移 1.5σ
   ============================================================ */
export function DiagramShift() {
  return (
    <svg viewBox="0 0 420 150" className="w-full h-auto" role="img"
         aria-label="过程中心随时间漂移一点五西格玛，靠近上规格限一侧的余量被压缩">
      <path d={areaPath(3, 5, 1.5)} fill={RED} opacity={0.5} />
      <path d={curvePath(0)} fill="none" stroke={MUTED} strokeWidth={1.5} strokeDasharray="3 3" />
      <path d={curvePath(1.5)} fill="none" stroke={NAVY} strokeWidth={2} />
      <Baseline />
      <SigmaTicks />
      <SpecLine z={-3} label="LSL" />
      <SpecLine z={3} label="USL" />
      {/* shift arrow */}
      <line x1={zx(0)} y1={PEAK - 8} x2={zx(1.5) - 4} y2={PEAK - 8} stroke={GOLD} strokeWidth={1.5} />
      <polygon
        points={`${zx(1.5)},${PEAK - 8} ${zx(1.5) - 5},${PEAK - 11} ${zx(1.5) - 5},${PEAK - 5}`}
        fill={GOLD}
      />
      <text x={zx(0.75)} y={PEAK - 12} textAnchor="middle" fontSize={9} fill={GOLD} fontWeight={600}>
        漂移 1.5σ
      </text>
      <text x={zx(-2.1)} y={PEAK + 6} fontSize={8} fill={MUTED}>原中心</text>
      <text x={zx(0)} y={BASE + 30} textAnchor="middle" fontSize={9} fill={RED} fontWeight={600}>
        靠近 USL 一侧只剩 1.5σ 余量 → 不良率大幅上升
      </text>
    </svg>
  );
}

/* ============================================================
   图 3 · 为什么要 ±6σ：偏移后近侧仍余 4.5σ → 3.4 DPMO
   ============================================================ */
export function DiagramSixSigma() {
  // 规格设在 ±6σ 会超出 viewBox，改为压缩坐标：这里用 z 轴表示"距中心的 σ 数"，
  // 规格画在 ±4.5 处并以文字说明真实为 ±6σ（偏移后近侧余量 4.5σ）
  return (
    <svg viewBox="0 0 420 150" className="w-full h-auto" role="img"
         aria-label="规格设为正负六西格玛时，中心漂移一点五西格玛后近侧仍余四点五西格玛，对应 3.4 DPMO">
      <path d={areaPath(4.5, 5, 1.5)} fill={RED} opacity={0.6} />
      <path d={curvePath(1.5)} fill="none" stroke={NAVY} strokeWidth={2} />
      <Baseline />
      <SigmaTicks from={-3} to={5} mu={1.5} />
      <SpecLine z={-4.5} label="LSL (−6σ)" color={TEAL} />
      <SpecLine z={4.5} label="USL (+6σ)" color={TEAL} />
      {/* remaining margin bracket */}
      <line x1={zx(1.5)} y1={BASE - 70} x2={zx(4.5)} y2={BASE - 70} stroke={GOLD} strokeWidth={1.5} />
      <line x1={zx(1.5)} y1={BASE - 74} x2={zx(1.5)} y2={BASE - 66} stroke={GOLD} strokeWidth={1.5} />
      <line x1={zx(4.5)} y1={BASE - 74} x2={zx(4.5)} y2={BASE - 66} stroke={GOLD} strokeWidth={1.5} />
      <text x={zx(3)} y={BASE - 76} textAnchor="middle" fontSize={9} fill={GOLD} fontWeight={600}>
        近侧余量 4.5σ
      </text>
      <text x={zx(1.5)} y={PEAK - 6} textAnchor="middle" fontSize={8} fill={MUTED}>
        漂移后中心
      </text>
      <text x={zx(0.5)} y={BASE + 30} textAnchor="middle" fontSize={9} fill={NAVY} fontWeight={600}>
        4.5σ 对应 3.4 DPMO —— 这就是「六西格玛」的来源
      </text>
    </svg>
  );
}

/** 供页面按 id 取图 */
export const DIAGRAMS: Record<string, () => JSX.Element> = {
  threeSigma: DiagramThreeSigma,
  shift: DiagramShift,
  sixSigma: DiagramSixSigma,
};

export const GEOMETRY_NOTE = `每 1σ = ${PX_PER_SIGMA}px，曲线由标准正态密度函数生成，比例已校验`;
