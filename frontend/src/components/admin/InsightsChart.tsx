"use client";

import { useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Decimation,
    type ChartOptions,
    type ChartData,
    type Chart,
} from "chart.js";
import type {
    AnalyticsGranularity,
    AnalyticsPoint,
} from "@/lib/analyticsApi";

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Filler,
    Tooltip,
    Legend,
    Decimation,
);

interface InsightsChartProps {
    label: string;
    points: AnalyticsPoint[];
    granularity: AnalyticsGranularity;
}

const formatLabel = (dateStr: string, granularity: AnalyticsGranularity) => {
    // Daily keys are YYYY-MM-DD; monthly keys are YYYY-MM. Parse in UTC to
    // avoid the date silently shifting by one in negative timezones.
    if (granularity === "month") {
        const [y, m] = dateStr.split("-").map(Number);
        const d = new Date(Date.UTC(y, m - 1, 1));
        return d.toLocaleString("en-US", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        });
    }
    const [y, m, day] = dateStr.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1, day));
    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
};

// cusblue + cusviolet from tailwind config; hard-coded so the canvas (which
// doesn't see CSS vars) can still build the gradient.
const COLOR_BLUE = "#1d2b4f";
const COLOR_VIOLET = "#6c5ce7";

const buildGradient = (ctx: CanvasRenderingContext2D, area: { top: number; bottom: number }) => {
    const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, "rgba(108, 92, 231, 0.45)");
    gradient.addColorStop(1, "rgba(29, 43, 79, 0.02)");
    return gradient;
};

export default function InsightsChart({
    label,
    points,
    granularity,
}: InsightsChartProps) {
    const chartRef = useRef<Chart<"line">>(null);

    const data = useMemo<ChartData<"line">>(() => {
        const labels = points.map((p) => formatLabel(p.date, granularity));
        const values = points.map((p) => p.count);

        return {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    borderColor: COLOR_BLUE,
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: (ctx) => {
                        const chart = ctx.chart;
                        const { ctx: canvasCtx, chartArea } = chart;
                        if (!chartArea) return "rgba(108, 92, 231, 0.2)";
                        return buildGradient(canvasCtx, chartArea);
                    },
                    pointRadius: points.length > 60 ? 0 : 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: COLOR_VIOLET,
                    tension: 0.3,
                },
            ],
        };
    }, [label, points, granularity]);

    const options = useMemo<ChartOptions<"line">>(() => {
        const heavy = points.length > 500;
        return {
            responsive: true,
            maintainAspectRatio: false,
            // Spec: disable animations once we exceed 500 points.
            animation: heavy ? false : { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(29, 43, 79, 0.95)",
                    padding: 12,
                    cornerRadius: 12,
                },
                decimation: {
                    enabled: heavy,
                    algorithm: "lttb",
                    samples: 200,
                },
            },
            scales: {
                x: {
                    type: "category",
                    grid: { display: false },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10,
                        color: "rgba(29, 43, 79, 0.6)",
                    },
                },
                y: {
                    type: "linear",
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: "rgba(29, 43, 79, 0.6)",
                    },
                    grid: { color: "rgba(29, 43, 79, 0.08)" },
                },
            },
        };
    }, [points.length]);

    return (
        <div className="h-72 sm:h-96">
            <Line ref={chartRef} data={data} options={options} />
        </div>
    );
}
