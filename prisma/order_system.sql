-- AI积分订单系统数据库更新脚本
-- 创建时间: 2024-01-15

-- 1. 创建套餐表
CREATE TABLE IF NOT EXISTS `packages` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `name_en` VARCHAR(100) NULL,
  `version` VARCHAR(20) NOT NULL,
  `description` TEXT NULL,
  `price` INT NOT NULL,
  `original_price` INT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
  `daily_credits` INT NOT NULL,
  `valid_days` INT NOT NULL DEFAULT 30,
  `features` JSON NULL,
  `limitations` JSON NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `is_recommended` BOOLEAN NOT NULL DEFAULT false,
  `tag` VARCHAR(50) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_packages_sort_order` (`sort_order`),
  INDEX `idx_packages_is_active` (`is_active`),
  INDEX `idx_packages_version` (`version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 创建用户套餐表
CREATE TABLE IF NOT EXISTS `user_packages` (
  `id` CHAR(36) NOT NULL,
  `user_uuid` VARCHAR(255) NOT NULL,
  `package_id` CHAR(36) NOT NULL,
  `order_no` VARCHAR(255) NOT NULL,
  `start_date` DATETIME(3) NOT NULL,
  `end_date` DATETIME(3) NOT NULL,
  `daily_credits` INT NOT NULL,
  `package_snapshot` JSON NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `is_auto_renew` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_user_packages_user_uuid` (`user_uuid`),
  INDEX `idx_user_packages_package_id` (`package_id`),
  INDEX `idx_user_packages_order_no` (`order_no`),
  INDEX `idx_user_packages_end_date` (`end_date`),
  INDEX `idx_user_packages_is_active` (`is_active`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 创建积分余额表
CREATE TABLE IF NOT EXISTS `credit_balances` (
  `id` CHAR(36) NOT NULL,
  `user_uuid` VARCHAR(255) NOT NULL,
  `package_credits` INT NOT NULL DEFAULT 0,
  `package_reset_at` DATETIME(3) NULL,
  `independent_credits` INT NOT NULL DEFAULT 0,
  `total_used` INT NOT NULL DEFAULT 0,
  `total_purchased` INT NOT NULL DEFAULT 0,
  `version` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_credit_balances_user_uuid` (`user_uuid`),
  INDEX `idx_credit_balances_updated_at` (`updated_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 创建积分流水表
CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id` CHAR(36) NOT NULL,
  `trans_no` VARCHAR(255) NOT NULL,
  `user_uuid` VARCHAR(255) NOT NULL,
  `type` VARCHAR(20) NOT NULL COMMENT 'income, expense, reset',
  `credit_type` VARCHAR(20) NOT NULL COMMENT 'package, independent',
  `amount` INT NOT NULL,
  `before_balance` INT NOT NULL,
  `after_balance` INT NOT NULL,
  `order_no` VARCHAR(255) NULL,
  `description` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_credit_transactions_trans_no` (`trans_no`),
  INDEX `idx_credit_transactions_user_uuid` (`user_uuid`),
  INDEX `idx_credit_transactions_type` (`type`),
  INDEX `idx_credit_transactions_credit_type` (`credit_type`),
  INDEX `idx_credit_transactions_order_no` (`order_no`),
  INDEX `idx_credit_transactions_created_at` (`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 更新订单表（添加新字段）
ALTER TABLE `orders` 
ADD COLUMN IF NOT EXISTS `order_type` VARCHAR(20) NOT NULL DEFAULT 'credits' COMMENT 'package, credits' AFTER `paid_detail`,
ADD COLUMN IF NOT EXISTS `package_id` CHAR(36) NULL AFTER `order_type`,
ADD COLUMN IF NOT EXISTS `package_snapshot` JSON NULL AFTER `package_id`,
ADD COLUMN IF NOT EXISTS `credit_amount` INT NULL AFTER `package_snapshot`,
ADD COLUMN IF NOT EXISTS `start_date` DATETIME(3) NULL AFTER `credit_amount`,
ADD COLUMN IF NOT EXISTS `end_date` DATETIME(3) NULL AFTER `start_date`,
ADD COLUMN IF NOT EXISTS `discount_amount` INT NOT NULL DEFAULT 0 AFTER `end_date`,
ADD COLUMN IF NOT EXISTS `coupon_code` VARCHAR(50) NULL AFTER `discount_amount`,
ADD COLUMN IF NOT EXISTS `payment_method` VARCHAR(50) NULL AFTER `coupon_code`,
ADD COLUMN IF NOT EXISTS `refund_status` VARCHAR(50) NULL AFTER `payment_method`,
ADD COLUMN IF NOT EXISTS `refund_amount` INT NOT NULL DEFAULT 0 AFTER `refund_status`,
ADD COLUMN IF NOT EXISTS `refund_at` DATETIME(3) NULL AFTER `refund_amount`;

-- 添加订单表的新索引
ALTER TABLE `orders`
ADD INDEX IF NOT EXISTS `idx_orders_order_type` (`order_type`),
ADD INDEX IF NOT EXISTS `idx_orders_package_id` (`package_id`),
ADD INDEX IF NOT EXISTS `idx_orders_payment_method` (`payment_method`);

-- 6. 插入示例套餐数据
INSERT INTO `packages` (`id`, `name`, `name_en`, `version`, `description`, `price`, `original_price`, `currency`, `daily_credits`, `valid_days`, `features`, `tag`, `sort_order`, `is_active`, `is_recommended`) VALUES
(UUID(), '基础套餐', 'Basic Plan', '1.0.0', '适合个人用户使用', 39900, 59900, 'CNY', 10800, 30, 
 '["每日10,800积分", "全速响应", "基础技术支持"]', 'HOT', 1, true, true),
 
(UUID(), '专业套餐', 'Pro Plan', '1.0.0', '适合专业用户使用', 79900, 99900, 'CNY', 30000, 30,
 '["每日30,000积分", "优先响应", "高级技术支持", "API访问"]', 'POPULAR', 2, true, true),
 
(UUID(), '企业套餐', 'Enterprise Plan', '1.0.0', '适合企业团队使用', 199900, 299900, 'CNY', 100000, 30,
 '["每日100,000积分", "专属响应通道", "1对1技术支持", "API无限访问", "定制化服务"]', 'NEW', 3, true, false);

-- 7. 创建积分重置存储过程（可选）
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `reset_daily_credits`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_uuid VARCHAR(255);
    DECLARE v_daily_credits INT;
    DECLARE cur CURSOR FOR 
        SELECT user_uuid, daily_credits 
        FROM user_packages 
        WHERE is_active = true 
        AND end_date >= NOW();
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_user_uuid, v_daily_credits;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 更新用户积分余额
        UPDATE credit_balances 
        SET package_credits = v_daily_credits,
            package_reset_at = NOW(),
            updated_at = NOW()
        WHERE user_uuid = v_user_uuid;
        
        -- 插入重置流水
        INSERT INTO credit_transactions (
            id, trans_no, user_uuid, type, credit_type, 
            amount, before_balance, after_balance, 
            description, created_at
        )
        SELECT 
            UUID(),
            CONCAT('RESET', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), FLOOR(RAND() * 10000)),
            v_user_uuid,
            'reset',
            'package',
            v_daily_credits,
            IFNULL(package_credits + independent_credits, 0),
            v_daily_credits + IFNULL(independent_credits, 0),
            '每日积分重置',
            NOW()
        FROM credit_balances 
        WHERE user_uuid = v_user_uuid;
        
    END LOOP;
    
    CLOSE cur;
    
    -- 将过期套餐设为非活跃
    UPDATE user_packages 
    SET is_active = false 
    WHERE is_active = true 
    AND end_date < NOW();
    
    COMMIT;
END$$
DELIMITER ;

-- 8. 创建定时事件（每日凌晨执行积分重置）
CREATE EVENT IF NOT EXISTS `daily_credit_reset_event`
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY)
DO CALL reset_daily_credits();

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 9. 数据迁移（如果有旧的积分数据）
-- 将现有credits表的数据迁移到新表
INSERT INTO credit_balances (id, user_uuid, independent_credits, total_purchased, created_at)
SELECT 
    UUID(),
    user_uuid,
    SUM(CASE WHEN trans_type = 'income' THEN credits ELSE -credits END),
    SUM(CASE WHEN trans_type = 'income' THEN credits ELSE 0 END),
    NOW()
FROM credits
GROUP BY user_uuid
ON DUPLICATE KEY UPDATE
    independent_credits = VALUES(independent_credits),
    total_purchased = VALUES(total_purchased);

-- 迁移积分流水
INSERT INTO credit_transactions (id, trans_no, user_uuid, type, credit_type, amount, before_balance, after_balance, order_no, description, created_at)
SELECT 
    UUID(),
    trans_no,
    user_uuid,
    CASE 
        WHEN trans_type = 'income' THEN 'income'
        WHEN trans_type = 'expense' THEN 'expense'
        ELSE trans_type
    END,
    'independent',
    ABS(credits),
    0, -- 无法获取历史余额
    0, -- 无法获取历史余额
    order_no,
    CONCAT('历史数据迁移 - ', trans_type),
    created_at
FROM credits;

-- 10. 创建视图（方便查询）
CREATE OR REPLACE VIEW `user_credit_summary` AS
SELECT 
    cb.user_uuid,
    u.email AS user_email,
    u.nickname,
    cb.package_credits,
    cb.independent_credits,
    cb.package_credits + cb.independent_credits AS total_available,
    cb.total_used,
    cb.total_purchased,
    up.package_id,
    up.daily_credits,
    up.start_date AS package_start,
    up.end_date AS package_end,
    DATEDIFF(up.end_date, NOW()) AS days_remaining,
    up.is_auto_renew
FROM credit_balances cb
LEFT JOIN users u ON cb.user_uuid = u.uuid
LEFT JOIN user_packages up ON cb.user_uuid = up.user_uuid AND up.is_active = true;

-- 完成提示
SELECT '✅ AI积分订单系统数据库更新完成！' AS message;