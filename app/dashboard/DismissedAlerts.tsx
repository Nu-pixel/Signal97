"use client";

import React, { useEffect, useState } from "react";

type DismissedItem = {
  key?: string;
  alert_key?: string;
  reason?: string;
  dismissed_at?: number;
  dismissed_at_iso?: string;
  alert?: Record<string, any>;
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  }

  return data;
}

function symbolOf(item: DismissedItem) {
  const a = item.alert || {};
  return String(a.symbol || a.ticker || "—").toUpperCase();
}

function dateOf(epoch?: number) {
  return epoch ? new Date(epoch * 1000).toLocaleString() : "—";
}

export default function DismissedAlerts() {
  const [items, setItems] = useState<DismissedItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dismissed-alerts", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      setErr(data.error || "Failed to load dismissed alerts");
      setItems([]);
      return;
    }

    setErr(null);
    setItems(Array.isArray(data.alerts) ? data.alerts : []);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  async function restore(item: DismissedItem) {
    const key = item.alert_key || item.key || "";

    try {
      setBusy(key);

      await postJson("/api/restore-alert", {
        alert_key: key,
        alert: item.alert,
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to restore alert");
    } finally {
      setBusy(null);
    }
  }

  async function remove(item: DismissedItem) {
    const key = item.alert_key || item.key || "";

    try {
      setBusy(key);

      await postJson("/api/remove-dismissed-alert", {
        alert_key: key,
        alert: item.alert,
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to remove alert");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dismissed Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Alerts you dismissed, plus alerts automatically moved here after 20 days.
        </p>
        {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
      </div>


      {!items.length && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            ✕
          </div>
      
          <h2 className="text-lg font-bold text-slate-900">
            No dismissed alerts yet
          </h2>
      
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Alerts you dismiss from the Signal97 Alerts page will appear here.
            You can restore them back to the alert inbox or remove them from the
            dismissed list.
          </p>
      
          <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            Dismissed alerts stay separate from active trades.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const key = item.alert_key || item.key || symbolOf(item);
          const a = item.alert || {};

          return (
            <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{symbolOf(item)}</div>
                  <div className="text-xs text-slate-600">
                    Reason: {item.reason === "expired_20_days" ? "Older than 20 days" : "Dismissed manually"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Dismissed: {dateOf(item.dismissed_at)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Forecast time: {a.forecast_time_12h_ct || a.forecast_time || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Direction: {a.direction_rule_direction || a.direction || "—"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => restore(item)}
                    disabled={busy === key}
                    className="px-3 py-1.5 rounded-md border text-xs hover:bg-white disabled:opacity-50"
                  >
                    Back to Signal97 Alerts
                  </button>

                  <button
                    onClick={() => remove(item)}
                    disabled={busy === key}
                    className="px-3 py-1.5 rounded-md border text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Remove from Dismissed
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
