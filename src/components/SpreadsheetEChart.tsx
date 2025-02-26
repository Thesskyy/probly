import React, { useEffect, useRef } from "react";

import ReactECharts from "echarts-for-react";

interface ChartProps {
  data: any[][];
  title?: string;
  type?: string;
  position?: { top: number; left: number; width: number; height: number };
  onClose?: () => void;
}

const SpreadsheetEChart: React.FC<ChartProps> = ({ 
  data, 
  title, 
  type = "bar", 
  position = { top: 100, left: 100, width: 500, height: 350 },
  onClose 
}) => {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && data && data.length > 0) {
      // Extract labels and data
      const labels = data.slice(1).map((row) => row[0] || "");
      
      // For bar charts, we need to handle the data differently
      const isBarChart = type === "bar" || type === "column";
      
      const series = data[0].slice(1).map((col, index) => {
        const seriesData = data
          .slice(1)
          .map((row) => {
            const value = row[index + 1];
            return value !== undefined && value !== "" ? parseFloat(value) : 0;
          });
          
        return {
          name: col || `Series ${index + 1}`,
          type: type,
          data: seriesData,
          // For bar charts, add some spacing between bars
          barGap: isBarChart ? '10%' : undefined,
          barCategoryGap: isBarChart ? '20%' : undefined,
          // Don't use smooth for bar charts
          smooth: !isBarChart,
        };
      });

      const option = {
        title: {
          text: title || "",
          show: !!title,
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: isBarChart ? 'shadow' : 'line'
          }
        },
        legend: {
          data: data[0]
            .slice(1)
            .map((col, index) => col || `Series ${index + 1}`),
          bottom: 0,
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '12%',
          right: '5%',
          bottom: '15%',
          top: title ? '18%' : '10%',
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: labels,
          axisLabel: {
            interval: 0,
            rotate: labels.length > 5 ? 30 : 0,
            fontSize: 12,
            width: 100,
            overflow: 'truncate',
            formatter: (value: string) => {
              // Truncate long labels
              return value.length > 15 ? value.substring(0, 12) + '...' : value;
            }
          },
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: {
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: series,
        animation: true
      };

      chartRef.current.getEchartsInstance().setOption(option, true);
      
      // Force resize after rendering
      setTimeout(() => {
        chartRef.current.getEchartsInstance().resize();
      }, 50);
    }
  }, [data, title, type]);

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-md border border-gray-200"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        zIndex: 100,
      }}
    >
      <div className="h-full w-full p-4 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 z-10 bg-gray-100 rounded-md hover:bg-gray-200 text-xs flex items-center"
            title="Hide chart (can be shown again from chart manager)"
          >
            <span className="mr-1">Hide</span> ✕
          </button>
        )}
        <ReactECharts 
          ref={chartRef} 
          option={{}} 
          style={{ height: 'calc(100% - 10px)', width: '100%' }} 
          opts={{ renderer: 'canvas' }}
          notMerge={true}
        />
      </div>
    </div>
  );
};

export default SpreadsheetEChart;
