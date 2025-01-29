import React, { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";

interface ChartProps {
  data: any[][];
  title?: string;
  type?: string;
}

const SpreadsheetEChart: React.FC<ChartProps> = ({ data, title, type }) => {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current) {
      const labels = data.slice(1).map((row) => row[0] || "");
      const series = data[0].slice(1).map((col, index) => ({
        name: col || `Series ${index + 1}`,
        type: type || "line",
        data: data
          .slice(1)
          .map((row) =>
            row[index + 1] ? parseFloat(row[index + 1]) : undefined,
          ),
        smooth: true,
      }));

      const option = {
        title: {
          text: title || "",
          show: !!title,
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: data[0]
            .slice(1)
            .map((col, index) => col || `Series ${index + 1}`),
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: labels,
        },
        yAxis: {
          type: "value",
        },
        series: series,
      };

      chartRef.current.getEchartsInstance().setOption(option);
    }
  }, [data, title]);

  return (
    <div className="h-full w-full">
      <ReactECharts ref={chartRef} option={{}} />
    </div>
  );
};

export default SpreadsheetEChart;
