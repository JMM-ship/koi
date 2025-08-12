-- 简单直接的修复方案 - 添加所有缺失的字段
-- 如果字段已存在会报错，可以忽略

ALTER TABLE orders 
ADD COLUMN order_type VARCHAR(20) NOT NULL DEFAULT 'credits' COMMENT 'package, credits',
ADD COLUMN package_id CHAR(36) NULL,
ADD COLUMN package_snapshot JSON NULL,
ADD COLUMN credit_amount INT NULL,
ADD COLUMN start_date DATETIME(3) NULL,
ADD COLUMN end_date DATETIME(3) NULL,
ADD COLUMN discount_amount INT NOT NULL DEFAULT 0,
ADD COLUMN coupon_code VARCHAR(50) NULL,
ADD COLUMN payment_method VARCHAR(50) NULL,
ADD COLUMN refund_status VARCHAR(50) NULL,
ADD COLUMN refund_amount INT NOT NULL DEFAULT 0,
ADD COLUMN refund_at DATETIME(3) NULL,
ADD INDEX idx_orders_order_type (order_type),
ADD INDEX idx_orders_package_id (package_id),
ADD INDEX idx_orders_payment_method (payment_method);

-- 验证结果
SHOW COLUMNS FROM orders;