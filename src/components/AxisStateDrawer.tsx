import { Loader2, X } from "lucide-react";
import { useAxisState } from "../hooks/useSessions";
import { ALL_AXES, AXIS_LABELS, BAND_LABELS } from "../lib/labels";
import type { AxisName } from "../lib/labels";
import type { AxisState } from "../api/client";

interface Props {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}

/** Map an axis value [-1,1] to a percentage for the gauge fill. */
function axisToPercent(value: number): number {
  return ((value + 1) / 2) * 100;
}

/** Color for an axis value: green for positive, red for negative, amber near 0. */
function axisColor(value: number): string {
  if (value > 0.15) return "text-emerald-600";
  if (value < -0.15) return "text-rose-500";
  return "text-amber-500";
}

/** Fill color for gauge bar segments. */
function axisBarColor(value: number): string {
  if (value > 0.35) return "bg-emerald-400";
  if (value < -0.35) return "bg-rose-400";
  return "bg-amber-300";
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

interface SparklineProps {
  history: AxisState["history"];
  axis: AxisName;
}

function Sparkline({ history, axis }: SparklineProps) {
  if (history.length < 2) {
    return (
      <div className="flex h-8 items-center text-2xs text-text-muted">
        {history.length === 1 ? "1 tick" : "—"}
      </div>
    );
  }

  const width = 72;
  const height = 24;
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const values = history.map((h) => h.axes[axis]);
  const min = Math.min(...values, -1);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = padding + (i / Math.max(values.length - 1, 1)) * innerW;
      const y = padding + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary-strong/70"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Axis gauge
// ---------------------------------------------------------------------------

interface AxisGaugeProps {
  axis: AxisName;
  value: number;
  baseline: number;
  band: "high" | "mid" | "low";
}

function AxisGauge({ axis, value, baseline, band }: AxisGaugeProps) {
  const valuePct = axisToPercent(value);
  const baselinePct = axisToPercent(baseline);

  return (
    <div className="space-y-1">
      {/* Label + band tag */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-main">
          {AXIS_LABELS[axis]}
        </span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-2xs font-medium ${
            band === "high"
              ? "bg-emerald-100 text-emerald-700"
              : band === "low"
                ? "bg-rose-100 text-rose-600"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {BAND_LABELS[band]}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative h-2.5 w-full rounded-full bg-surface-2">
        {/* Filled portion */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${axisBarColor(value)}`}
          style={{ width: `${valuePct}%` }}
        />
        {/* Baseline marker */}
        <div
          className="absolute top-0 h-2.5 w-0.5 -translate-x-1/2 rounded bg-text-muted/60"
          style={{ left: `${baselinePct}%` }}
          title={`Baseline: ${baseline.toFixed(2)}`}
        />
      </div>

      {/* Value readout + sparkline */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-medium tabular-nums ${axisColor(value)}`}>
          {value > 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
        <span className="text-2xs text-text-muted">
          Base: {baseline > 0 ? "+" : ""}
          {baseline.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer body
// ---------------------------------------------------------------------------

interface DrawerBodyProps {
  data: AxisState;
}

function DrawerBody({ data }: DrawerBodyProps) {
  const isBaseline = data.source === "baseline";
  const isEngineOff = !data.enabled;

  return (
    <div className="flex flex-col gap-5 p-4 pt-0">
      {/* Source indicator */}
      <div className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-muted">
        {isEngineOff ? (
          <span className="text-amber-600">
            Emotional engine is off — showing baseline values.
          </span>
        ) : isBaseline ? (
          <span>
            Baseline starting point for{" "}
            <span className="font-medium text-text-main">
              {data.scope}
            </span>
            . Values update after each reply.
          </span>
        ) : (
          <span>
            Tick{" "}
            <span className="font-medium tabular-nums text-text-main">
              #{data.tick}
            </span>
            {" · "}
            <span className="text-text-main">{data.scope}</span>
          </span>
        )}
      </div>

      {/* Axis gauges */}
      <div className="flex flex-col gap-4">
        {ALL_AXES.map((axis) => (
          <AxisGauge
            key={axis}
            axis={axis}
            value={data.axes[axis]}
            baseline={data.baselines[axis]}
            band={data.bands[axis]}
          />
        ))}
      </div>

      {/* Trajectory section */}
      <div>
        <h4 className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
          Trajectory
        </h4>
        <div className="flex flex-col gap-2">
          {ALL_AXES.map((axis) => (
            <div
              key={axis}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-1.5"
            >
              <span className="text-xs font-medium text-text-main min-w-10">
                {AXIS_LABELS[axis]}
              </span>
              <Sparkline history={data.history} axis={axis} />
            </div>
          ))}
        </div>
      </div>

      {/* last_trace info (compact) */}
      {data.last_trace && (
        <div className="rounded-lg bg-surface-2 px-3 py-2 text-2xs text-text-muted">
          {data.last_trace.event && (
            <div>
              Event:{" "}
              <span className="font-medium text-text-main">
                {data.last_trace.event.type.replace(/_/g, " ")}
              </span>{" "}
              ({data.last_trace.event.intensity.toFixed(2)})
            </div>
          )}
          {data.last_trace.couplings_fired.length > 0 && (
            <div>Couplings: {data.last_trace.couplings_fired.join(", ")}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AxisStateDrawer
// ---------------------------------------------------------------------------

export default function AxisStateDrawer({ sessionId, open, onClose }: Props) {
  const { data, isPending, error } = useAxisState(sessionId);

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <button
          type="button"
          aria-label="Close axis drawer"
          className="fixed inset-0 z-30 bg-overlay/30 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 z-40 flex h-full flex-col border-l-2 border-border-soft bg-surface shadow-soft-pink backdrop-blur-sm transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        } w-72 md:w-80`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-border-soft px-4 py-3">
          <h3 className="text-sm font-extrabold tracking-tight text-primary-strong">
            Emotional Axis
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="icon-button icon-button--dark -mr-1"
            aria-label="Close axis drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-16 text-text-soft">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-xs text-danger-soft">
              Failed to load axis state.
            </div>
          ) : data ? (
            <DrawerBody data={data} />
          ) : (
            <div className="px-4 py-8 text-xs text-text-muted">
              No axis data available.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
