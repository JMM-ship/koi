"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from 'echarts';
import useSWR from 'swr'
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

  // manual reset related info (SWR cache-first)
  const { data: creditsInfo, mutate: mutateCreditsInfo } = useSWR('/api/credits/info', async (url: string) => {
    const res = await fetch(url)
    return res.json()
  })
  const resetsRemainingToday: number | null = (typeof creditsInfo?.data?.usage?.resetsRemainingToday === 'number') ? creditsInfo.data.usage.resetsRemainingToday : null
  const nextAvailableAtUtc: string | null = (typeof creditsInfo?.data?.usage?.nextResetAtUtc === 'string') ? creditsInfo.data.usage.nextResetAtUtc : null
  const creditCap: number | null = (typeof creditsInfo?.data?.packageConfig?.creditCap === 'number') ? creditsInfo.data.packageConfig.creditCap : null
  const recoveryRate: number | null = (typeof creditsInfo?.data?.packageConfig?.recoveryRate === 'number') ? creditsInfo.data.packageConfig.recoveryRate : null
  const packageTokensRemaining: number | null = (typeof creditsInfo?.data?.balance?.packageTokensRemaining === 'number') ? creditsInfo.data.balance.packageTokensRemaining : null
  const lastRecoveryAtIso: string | null = (typeof creditsInfo?.data?.usage?.lastRecoveryAt === 'string') ? creditsInfo.data.usage.lastRecoveryAt : null
  const serverTimestampIso: string | null = (typeof creditsInfo?.timestamp === 'string') ? creditsInfo.timestamp : null
  const [tick, setTick] = useState(0)
  const [serverOffsetMs, setServerOffsetMs] = useState<number | null>(null)

  // Track client-server time drift using server timestamp from API
  useEffect(() => {
    if (serverTimestampIso) {
      const serverNow = new Date(serverTimestampIso).getTime()
      const clientNow = Date.now()
      setServerOffsetMs(clientNow - serverNow)
    }
  }, [serverTimestampIso])

  // Minute ticker (lightweight refresh as requested)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 60_000)
    return () => clearInterval(id)
  }, [])
  const [resetLoading, setResetLoading] = useState(false);

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

  // creditsInfo 加载由 SWR 负责（首帧可用缓存，后台刷新）

  const { totalCredits, usedCredits, remainingCredits, percentage } = creditData;

  // Helpers to compute next hourly recovery timing (job runs at hh:05)
  function nextMinute05AtOrAfter(base: Date): Date {
    const d = new Date(base)
    d.setSeconds(0, 0)
    if (d.getMinutes() < 5) {
      d.setMinutes(5)
    } else if (d.getMinutes() === 5 && base.getSeconds() === 0 && base.getMilliseconds() === 0) {
      // already exactly at :05, keep as-is
    } else {
      d.setHours(d.getHours() + 1)
      d.setMinutes(5)
    }
    return d
  }

  function formatRelativeMm(leftMs: number): string {
    if (leftMs <= 0) return '0m'
    const mins = Math.ceil(leftMs / 60_000)
    return `${mins}m`
  }

  const recoveryStatus = useMemo(() => {
    // Default: loading state hidden
    if (
      recoveryRate == null ||
      creditCap == null ||
      packageTokensRemaining == null
    ) {
      return { kind: 'loading' as const }
    }

    // No active/paused
    if (recoveryRate <= 0 || creditCap <= 0) {
      return { kind: 'paused' as const }
    }

    // At cap
    if (packageTokensRemaining >= creditCap) {
      return { kind: 'atCap' as const }
    }

    // Compute next hour recovery amount
    const nextAmount = Math.max(0, Math.min(recoveryRate, creditCap - packageTokensRemaining))

    // Time base: use server time if available; else client now
    const clientNow = new Date()
    const serverNow = serverOffsetMs != null ? new Date(clientNow.getTime() - serverOffsetMs) : clientNow

    const lastBase = lastRecoveryAtIso ? new Date(lastRecoveryAtIso) : serverNow
    const eligibleAt = new Date(lastBase.getTime() + 60 * 60 * 1000) // last + 1h

    // Next job run at hh:05, based on server clock notion (approx via local)
    const anchor = eligibleAt > serverNow ? eligibleAt : serverNow
    const nextRunAt = nextMinute05AtOrAfter(anchor)
    const leftMs = Math.max(0, nextRunAt.getTime() - serverNow.getTime())

    return {
      kind: 'next' as const,
      amount: nextAmount,
      etaMs: leftMs,
      nextAt: nextRunAt,
    }
  }, [recoveryRate, creditCap, packageTokensRemaining, lastRecoveryAtIso, serverOffsetMs, tick])

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

      {/* Hourly Recovery Hint */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {(() => {
          if ((recoveryStatus as any).kind === 'loading') {
            return <div style={{ fontSize: 12, color: '#8b8d97' }}>Loading recovery info...</div>
          }
          if ((recoveryStatus as any).kind === 'paused') {
            return <div style={{ fontSize: 12, color: '#8b8d97' }}>No recoverable package / paused</div>
          }
          if ((recoveryStatus as any).kind === 'atCap') {
            return <div style={{ fontSize: 12, color: '#8b8d97' }}>No recovery (at cap)</div>
          }
          const r = recoveryStatus as { kind: 'next'; amount: number; etaMs: number; nextAt: Date }
          const eta = formatRelativeMm(r.etaMs)
          return (
            <div style={{ fontSize: 12, color: '#8b8d97', textAlign: 'center' }}>
              Next +{r.amount.toLocaleString()} credits in {eta}
            </div>
          )
        })()}
      </div>

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
                // 尝试刷新 creditsInfo 以同步服务端状态
                await mutateCreditsInfo();
                return;
              }
              const d = body.data || {};
              await mutateCreditsInfo();
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
