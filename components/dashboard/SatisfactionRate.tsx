"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from 'echarts';
import { useDashboard, useCreditBalance, useUserInfo } from "@/contexts/DashboardContext";
import { useToast } from "@/hooks/useToast";

const SatisfactionRate = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [creditData, setCreditData] = useState({
    totalCredits: 0,
    usedCredits: 0,
    remainingCredits: 0,
    percentage: 0
  });

  // Get data from context
  const { data, isLoading } = useDashboard();
  const creditBalance = useCreditBalance();
  const userInfo = useUserInfo();
  const { refreshData } = useDashboard();
  const toast = useToast();

  // manual reset related info
  const [resetsRemainingToday, setResetsRemainingToday] = useState<number | null>(null);
  const [nextAvailableAtUtc, setNextAvailableAtUtc] = useState<string | null>(null);
  const [creditCap, setCreditCap] = useState<number | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchCreditsInfo = async () => {
    try {
      const res = await fetch('/api/credits/info', { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.success && body?.data) {
        const usage = body.data.usage || {};
        const cfg = body.data.packageConfig || {};
        setResetsRemainingToday(typeof usage.resetsRemainingToday === 'number' ? usage.resetsRemainingToday : 0);
        // info 接口返回 nextResetAtUtc；在未点击前，我们将其作为“下一次可用”的提示
        setNextAvailableAtUtc(usage.nextResetAtUtc || null);
        setCreditCap(typeof cfg.creditCap === 'number' ? cfg.creditCap : null);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (data && creditBalance && userInfo) {
      const processCreditBalance = () => {
        try {
          // 计算积分数据
          const balance = creditBalance;

          const total = (balance?.packageCredits || 0) + (balance?.independentCredits || 0);
          const used = balance?.totalUsed || 0;
          const remaining = Math.max(0, total - used);
          const percent = total > 0 ? (remaining / total) * 100 : 0;

          setCreditData({
            totalCredits: total,
            usedCredits: used,
            remainingCredits: remaining,
            percentage: percent
          });
        } catch (error) {
          console.error('Error processing credit balance:', error);
          // 使用默认值
        }
      };

      processCreditBalance();
    }
  }, [data, creditBalance, userInfo]);

  useEffect(() => {
    fetchCreditsInfo();
  }, []);

  const { totalCredits, usedCredits, remainingCredits, percentage } = creditData;

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);

    const option = {
      backgroundColor: 'transparent',
      series: [
        {
          name: 'Background',
          type: 'gauge',
          radius: '85%',
          center: ['50%', '55%'],
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 0,
          pointer: {
            show: false
          },
          progress: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[1, '#2a2d3a']]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          title: {
            show: false
          },
          detail: {
            show: false
          }
        },
        {
          name: 'Progress',
          type: 'gauge',
          radius: '85%',
          center: ['50%', '55%'],
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 0,
          pointer: {
            show: true,
            length: '0%',
            width: 8,
            icon: 'circle',
            offsetCenter: [0, '-75%'],
            itemStyle: {
              color: '#fff',
              borderColor: '#00b4d8',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: '#00b4d8'
            }
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: '#00b4d8'
                  },
                  {
                    offset: 1,
                    color: '#0090ff'
                  }
                ],
                global: false
              },
              shadowBlur: 20,
              shadowColor: '#00b4d8'
            }
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[0, 'transparent'], [1, 'transparent']]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: true,
            color: '#5a5c66',
            fontSize: 11,
            distance: -45,
            formatter: function (value: number) {
              if (value === 0) return '0%';
              if (value === 100) return '100%';
              return '';
            }
          },
          title: {
            show: false
          },
          detail: {
            show: false
          },
          data: [{
            value: percentage
          }]
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '55%',
          style: {
            text: `${remainingCredits.toLocaleString()}`,
            fontSize: 32,
            fontWeight: 600,
            fill: '#fff',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '70%',
          style: {
            text: `Remaining / ${totalCredits.toLocaleString()} Credits`,
            fontSize: 13,
            fill: '#8b8d97',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '35%',
          style: {
            text: '💎',
            fontSize: 24,
            textAlign: 'center'
          }
        }
      ]
    };

    myChart.setOption(option);

    // Add animation
    let currentValue = 0;
    const animationDuration = 1500;
    const steps = 60;
    const increment = percentage / steps;
    let frame = 0;

    const animate = () => {
      if (frame < steps) {
        currentValue = Math.min(currentValue + increment, percentage);
        myChart.setOption({
          series: [{}, {
            data: [{ value: currentValue }]
          }],
          graphic: [
            {
              style: {
                text: `${Math.round((currentValue / 100) * totalCredits).toLocaleString()}`
              }
            },
            {},
            {}
          ]
        });
        frame++;
        requestAnimationFrame(animate);
      }
    };

    setTimeout(() => {
      animate();
    }, 100);

    const handleResize = () => {
      myChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [creditData, isLoading]);

  if (isLoading) {
    return (
      <div className="satisfaction-card">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
          <span style={{ color: '#999' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="satisfaction-card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 className="card-title" style={{ margin: 0 }}>Credits Balance</h3>
      </div>

      <div
        ref={chartRef}
        className="satisfaction-chart-echarts"
        style={{ width: '100%', height: '220px' }}
      />

      {/* Manual Reset Button & Tips */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <button
          onClick={async () => {
            try {
              setResetLoading(true);
              const res = await fetch('/api/credits/manual-reset', { method: 'POST' });
              const body = await res.json();
              if (!res.ok || !body?.success) {
                const code = body?.error?.code || 'RESET_FAILED';
                toast.showError(`Manual reset failed: ${code}`);
                // 同步提示信息
                if (typeof body?.resetsRemainingToday === 'number') setResetsRemainingToday(body.resetsRemainingToday);
                if (typeof body?.nextAvailableAtUtc === 'string') setNextAvailableAtUtc(body.nextAvailableAtUtc);
                return;
              }
              const d = body.data || {};
              setResetsRemainingToday(typeof d.resetsRemainingToday === 'number' ? d.resetsRemainingToday : 0);
              setNextAvailableAtUtc(typeof d.nextAvailableAtUtc === 'string' ? d.nextAvailableAtUtc : null);
              if (typeof d.newBalance === 'number') {
                // 尝试立即刷新仪表；同时触发全局刷新
                await refreshData();
              }
              toast.showSuccess('Credits reset to cap successfully');
            } catch (e) {
              toast.showError('Manual reset failed');
            } finally {
              setResetLoading(false);
            }
          }}
          disabled={resetLoading || (resetsRemainingToday !== null && resetsRemainingToday <= 0)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: resetLoading || (resetsRemainingToday !== null && resetsRemainingToday <= 0) ? '#3a3d4a' : '#00b4d8',
            color: '#fff',
            cursor: resetLoading || (resetsRemainingToday !== null && resetsRemainingToday <= 0) ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
          title={
            resetsRemainingToday !== null && resetsRemainingToday <= 0
              ? 'No resets remaining today'
              : 'Reset package credits to cap'
          }
        >
          {resetLoading ? 'Resetting...' : 'Manual Reset to Cap'}
        </button>
        <div style={{ fontSize: 12, color: '#8b8d97' }}>
          {typeof resetsRemainingToday === 'number'
            ? `Resets remaining today: ${resetsRemainingToday}${creditCap ? ` • Cap: ${creditCap}` : ''}`
            : 'Loading reset info...'}
        </div>
        {nextAvailableAtUtc && (
          <div style={{ fontSize: 12, color: '#6c6f7b' }}>
            Next available: {new Date(nextAvailableAtUtc).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SatisfactionRate;
