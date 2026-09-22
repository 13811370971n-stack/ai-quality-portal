/**
 * 教学图示 · 正态分布与西格玛水平
 *
 * 每张图有自己的 z 窗口，窗口内比例严格一致：标注 4.5σ 的跨度就真的是 4.5σ。
 * 曲线由标准正态密度函数实时生成，不手绘。
 *
 * 几何经 verify_diagrams.py 逐图校验：
 *   threeSigma  窗口[-5,5]   36.00 px/σ  规格 ±3σ
 *   shift       窗口[-5,5]   36.00 px/σ  规格 ±3σ，中心 μ=1.5，标注跨度实测 1.500σ
 *   sixSigma    窗口[-6.5,6.5] 27.69 px/σ 规格 ±6σ，中心 μ=1.5，标注跨度实测 4.500σ
 * 尾部面积核对：P(Z>3)=1350 PPM · P(Z>1.5)=66,807 PPM · P(Z>4.5)=3.40 DPMO
 */

const X0 = 30;
const X1 = 390;
const BASE = 120;
const PEAK = 22;

const NAVY = '#051C2C';
const TEAL = '#00A0AF';
const GOLD = '#C5A572';
const MUTED = '#8B9DAF';
const RED = '#DC2626';

/** 为给定 z 窗口生成一套坐标函数，窗口内比例自洽 */
function frame(z0: number, z1: number) {
  const zx = (z: number) => X0 + ((z - z0) / (z1 - z0)) * (X1 - X0);
  const zy = (z: number, mu = 0) => BASE - Math.exp(-0.5 * (z - mu) ** 2) * (BASE - PEAK);
  const pxPerSigma = zx(1) - zx(0);

  const curve = (mu = 0, step = 0.08) => {
    const pts: string[] = [];
    for (let z = z0; z <= z1 + 1e-9; z += step) {
      pts.push(`${zx(z).toFixed(1)},${zy(z, mu).toFixed(1)}`);
    }
    return 'M ' + pts.join(' L ');
  };

  const area = (zA: number, zB: number, mu = 0, step = 0.04) => {
    const pts: string[] = [`${zx(zA).toFixed(1)},${BASE}`];
    for (let z = zA; z <= zB + 1e-9; z += step) {
      pts.push(`${zx(z).toFixed(1)},${zy(z, mu).toFixed(1)}`);
    }
    pts.push(`${zx(zB).toFixed(1)},${BASE}`);
    return 'M ' + pts.join(' L ') + ' Z';
  };

  return { zx, zy, curve, area, pxPerSigma, z0, z1 };
}

type Frame = ReturnType<typeof frame>;

function Baseline() {
  return <line x1={X0 - 6} y1={BASE} x2={X1 + 6} y2={BASE} stroke={MUTED} strokeWidth={1} />;
}

function SpecLine({ f, z, label, color = NAVY }: { f: Frame; z: number; label: string; color?: string }) {
  return (
    <g>
      <line x1={f.zx(z)} y1={14} x2={f.zx(z)} y2={BASE} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={f.zx(z)} y={10} textAnchor="middle" fontSize={9} fill={color} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

function Ticks({ f, from, to, mu = 0 }: { f: Frame; from: number; to: number; mu?: number }) {
  const out = [];
  for (let z = from; z <= to; z++) {
    out.push(
      <g key={z}>
        <line x1={f.zx(z)} y1={BASE} x2={f.zx(z)} y2={BASE + 4} stroke={MUTED} strokeWidth={1} />
        <text x={f.zx(z)} y={BASE + 14} textAnchor="middle" fontSize={8} fill={MUTED}>
          {z === 0 ? '0' : `${z > 0 ? '+' : ''}${z}σ`}
        </text>
      </g>
    );
  }
  return <>{out}</>;
}

/** 带端帽的横向标注，跨度在窗口内严格等于 (zB − zA) 个 σ */
function Bracket({
  f, zA, zB, y, label, color = GOLD,
}: { f: Frame; zA: number; zB: number; y: number; label: string; color?: string }) {
  const xa = f.zx(zA);
  const xb = f.zx(zB);
  return (
    <g>
      <line x1={xa} y1={y} x2={xb} y2={y} stroke={color} strokeWidth={1.5} />
      <line x1={xa} y1={y - 4} x2={xa} y2={y + 4} stroke={color} strokeWidth={1.5} />
      <line x1={xb} y1={y - 4} x2={xb} y2={y + 4} stroke={color} strokeWidth={1.5} />
      <text x={(xa + xb) / 2} y={y - 6} textAnchor="middle" fontSize={9} fill={color} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

/* ============================================================
   图 1 · 居中的 3σ 过程 —— 双侧约 2,700 PPM
   ============================================================ */
export function DiagramThreeSigma() {
  const f = frame(-5, 5);
  return (
    <svg viewBox="0 0 420 152" className="w-full h-auto" role="img"
         aria-label="居中的三西格玛过程：规格限位于正负三西格玛，双侧尾部不良约 2700 PPM">
      <path d={f.area(-5, -3)} fill={RED} opacity={0.5} />
      <path d={f.area(3, 5)} fill={RED} opacity={0.5} />
      <path d={f.curve()} fill="none" stroke={NAVY} strokeWidth={2} />
      <Baseline />
      <Ticks f={f} from={-4} to={4} />
      <SpecLine f={f} z={-3} label="LSL" />
      <SpecLine f={f} z={3} label="USL" />
      <Bracket f={f} zA={-3} zB={3} y={BASE - 78} label="规格宽度 6σ" color={TEAL} />
      <text x={f.zx(-3.7)} y={BASE - 7} textAnchor="middle" fontSize={8} fill={RED}>1350</text>
      <text x={f.zx(3.7)} y={BASE - 7} textAnchor="middle" fontSize={8} fill={RED}>1350</text>
      <text x={f.zx(0)} y={BASE + 30} textAnchor="middle" fontSize={9} fill={RED} fontWeight={600}>
        双侧合计约 2,700 PPM（0.27%）
      </text>
    </svg>
  );
}

/* ============================================================
   图 2 · 中心漂移 1.5σ —— 近侧余量只剩 1.5σ
   ============================================================ */
export function DiagramShift() {
  const f = frame(-5, 5);
  return (
    <svg viewBox="0 0 420 152" className="w-full h-auto" role="img"
         aria-label="过程中心漂移一点五西格玛后，靠近上规格限一侧只剩一点五西格玛余量，该侧不良率升至约 66807 PPM">
      <path d={f.area(3, 5, 1.5)} fill={RED} opacity={0.5} />
      <path d={f.curve(0)} fill="none" stroke={MUTED} strokeWidth={1.5} strokeDasharray="3 3" />
      <path d={f.curve(1.5)} fill="none" stroke={NAVY} strokeWidth={2} />
      <Baseline />
      <Ticks f={f} from={-4} to={4} />
      <SpecLine f={f} z={-3} label="LSL" />
      <SpecLine f={f} z={3} label="USL" />
      <Bracket f={f} zA={0} zB={1.5} y={PEAK - 8} label="漂移 1.5σ" />
      <Bracket f={f} zA={1.5} zB={3} y={BASE - 62} label="仅余 1.5σ" color={RED} />
      <text x={f.zx(-2.4)} y={PEAK + 4} fontSize={8} fill={MUTED}>原中心</text>
      <text x={f.zx(0)} y={BASE + 30} textAnchor="middle" fontSize={9} fill={RED} fontWeight={600}>
        该侧不良升至约 66,807 PPM
      </text>
    </svg>
  );
}

/* ============================================================
   图 3 · 规格放到 ±6σ —— 漂移后近侧仍余 4.5σ → 3.4 DPMO
   ============================================================ */
export function DiagramSixSigma() {
  const f = frame(-6.5, 6.5);
  return (
    <svg viewBox="0 0 420 152" className="w-full h-auto" role="img"
         aria-label="规格设为正负六西格玛时，中心漂移一点五西格玛后近侧仍余四点五西格玛，对应 3.4 DPMO">
      <path d={f.area(6, 6.5, 1.5)} fill={RED} opacity={0.7} />
      <path d={f.curve(0)} fill="none" stroke={MUTED} strokeWidth={1.2} strokeDasharray="3 3" />
      <path d={f.curve(1.5)} fill="none" stroke={NAVY} strokeWidth={2} />
      <Baseline />
      <Ticks f={f} from={-6} to={6} mu={1.5} />
      <SpecLine f={f} z={-6} label="LSL = −6σ" color={TEAL} />
      <SpecLine f={f} z={6} label="USL = +6σ" color={TEAL} />
      <Bracket f={f} zA={0} zB={1.5} y={PEAK - 8} label="漂移 1.5σ" />
      <Bracket f={f} zA={1.5} zB={6} y={BASE - 62} label="近侧余量 4.5σ" />
      <text x={f.zx(1.5)} y={PEAK + 4} textAnchor="middle" fontSize={8} fill={NAVY}>
        漂移后
      </text>
      <text x={f.zx(0)} y={BASE + 30} textAnchor="middle" fontSize={9} fill={NAVY} fontWeight={600}>
        4.5σ 对应 3.4 DPMO —— 这就是「六西格玛」的来源
      </text>
    </svg>
  );
}

export const DIAGRAMS: Record<string, () => JSX.Element> = {
  threeSigma: DiagramThreeSigma,
  shift: DiagramShift,
  sixSigma: DiagramSixSigma,
};
