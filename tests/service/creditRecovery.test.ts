/**
 * 积分恢复计算逻辑测试
 * 这是纯函数测试，不依赖数据库，执行速度快
 */

import { calculateRecoverableCredits, PackageConfig } from '@/app/service/creditRecoveryService';

describe('calculateRecoverableCredits', () => {
  // 会员套餐配置
  const memberConfig: PackageConfig = {
    creditCap: 6000,
    recoveryRate: 500,
    dailyUsageLimit: 18000,
    manualResetPerDay: 1,
  };

  // 高级会员套餐配置
  const premiumConfig: PackageConfig = {
    creditCap: 10000,
    recoveryRate: 1000,
    dailyUsageLimit: 34000,
    manualResetPerDay: 1,
  };

  // 尊享会员套餐配置
  const vipConfig: PackageConfig = {
    creditCap: 15000,
    recoveryRate: 2500,
    dailyUsageLimit: 75000,
    manualResetPerDay: 1,
  };

  describe('基础恢复计算', () => {
    test('1小时后应恢复500积分（会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(500);
    });

    test('2小时后应恢复1000积分（会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T12:00:00Z');
      const currentCredits = 4000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(1000);
    });

    test('30分钟后应恢复250积分（会员，按比例）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T10:30:00Z');
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(250);
    });
  });

  describe('不同套餐的恢复速度', () => {
    test('1小时后应恢复1000积分（高级会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        premiumConfig,
        now
      );

      expect(result).toBe(1000);
    });

    test('1小时后应恢复2500积分（尊享会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 10000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        vipConfig,
        now
      );

      expect(result).toBe(2500);
    });
  });

  describe('积分上限控制', () => {
    test('不应超过积分上限（会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T15:00:00Z'); // 5小时，应恢复2500
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      // 5000 + 2500 = 7500，但上限是6000，所以只能恢复1000
      expect(result).toBe(1000);
    });

    test('已达上限时不恢复（会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 6000; // 已满

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(0);
    });

    test('超过上限时不恢复（异常情况）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 7000; // 超过上限

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(0);
    });

    test('不应超过积分上限（高级会员）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T20:00:00Z'); // 10小时，应恢复10000
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        premiumConfig,
        now
      );

      // 5000 + 10000 = 15000，但上限是10000，所以只能恢复5000
      expect(result).toBe(5000);
    });
  });

  describe('边界情况', () => {
    test('0秒后不恢复', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T10:00:00Z'); // 同一时间
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(0);
    });

    test('当前积分为0时正常恢复', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 0;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(500);
    });

    test('不足1小时但有部分恢复', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T10:45:00Z'); // 45分钟
      const currentCredits = 5000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      // 500 * 0.75 = 375
      expect(result).toBe(375);
    });

    test('超长时间后恢复（但不超上限）', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-02T10:00:00Z'); // 24小时
      const currentCredits = 0;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      // 24 * 500 = 12000，但上限是6000
      expect(result).toBe(6000);
    });
  });

  describe('完全恢复时间验证', () => {
    test('会员从0恢复到上限需要12小时', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T22:00:00Z'); // 12小时
      const currentCredits = 0;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(6000); // 正好达到上限
    });

    test('高级会员从0恢复到上限需要10小时', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T20:00:00Z'); // 10小时
      const currentCredits = 0;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        premiumConfig,
        now
      );

      expect(result).toBe(10000); // 正好达到上限
    });

    test('尊享会员从0恢复到上限需要6小时', () => {
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T16:00:00Z'); // 6小时
      const currentCredits = 0;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        vipConfig,
        now
      );

      expect(result).toBe(15000); // 正好达到上限
    });
  });

  describe('实际使用场景模拟', () => {
    test('用户使用5000积分后，1小时恢复500', () => {
      // 场景：会员用户有6000积分，使用了5000，剩余1000
      // 1小时后应恢复500，变成1500
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T11:00:00Z');
      const currentCredits = 1000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(500);
      expect(currentCredits + result).toBe(1500);
    });

    test('用户连续使用，多次小额恢复', () => {
      // 场景：用户剩余3000积分，30分钟后恢复250
      const lastRecovery = new Date('2025-10-01T10:00:00Z');
      const now = new Date('2025-10-01T10:30:00Z');
      const currentCredits = 3000;

      const result = calculateRecoverableCredits(
        lastRecovery,
        currentCredits,
        memberConfig,
        now
      );

      expect(result).toBe(250);
      expect(currentCredits + result).toBe(3250);
    });
  });
});
