-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nickname` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `locale` VARCHAR(50) NULL,
    `signin_type` VARCHAR(50) NULL,
    `signin_ip` VARCHAR(255) NULL,
    `signin_provider` VARCHAR(50) NULL,
    `signin_openid` VARCHAR(255) NULL,
    `invite_code` VARCHAR(255) NOT NULL DEFAULT '',
    `updated_at` DATETIME(3) NOT NULL,
    `invited_by` VARCHAR(255) NOT NULL DEFAULT '',
    `is_affiliate` BOOLEAN NOT NULL DEFAULT false,
    `password` VARCHAR(255) NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'user',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `plan_type` VARCHAR(50) NOT NULL DEFAULT 'free',
    `plan_expired_at` DATETIME(3) NULL,
    `total_credits` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `users_uuid_key`(`uuid`),
    INDEX `idx_uuid`(`uuid`),
    INDEX `idx_email`(`email`),
    INDEX `idx_invite_code`(`invite_code`),
    UNIQUE INDEX `uk_email_provider`(`email`, `signin_provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_uuid` VARCHAR(255) NOT NULL DEFAULT '',
    `user_email` VARCHAR(255) NOT NULL DEFAULT '',
    `amount` INTEGER NOT NULL,
    `interval` VARCHAR(50) NULL,
    `expired_at` DATETIME(3) NULL,
    `status` VARCHAR(50) NOT NULL,
    `stripe_session_id` VARCHAR(255) NULL,
    `credits` INTEGER NOT NULL,
    `currency` VARCHAR(50) NULL,
    `sub_id` VARCHAR(255) NULL,
    `sub_interval_count` INTEGER NULL,
    `sub_cycle_anchor` INTEGER NULL,
    `sub_period_end` INTEGER NULL,
    `sub_period_start` INTEGER NULL,
    `sub_times` INTEGER NULL,
    `product_id` VARCHAR(255) NULL,
    `product_name` VARCHAR(255) NULL,
    `valid_months` INTEGER NULL,
    `order_detail` TEXT NULL,
    `paid_at` DATETIME(3) NULL,
    `paid_email` VARCHAR(255) NULL,
    `paid_detail` TEXT NULL,
    `order_type` VARCHAR(20) NOT NULL DEFAULT 'credits',
    `package_id` CHAR(36) NULL,
    `package_snapshot` JSON NULL,
    `credit_amount` INTEGER NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `discount_amount` INTEGER NOT NULL DEFAULT 0,
    `coupon_code` VARCHAR(50) NULL,
    `payment_method` VARCHAR(50) NULL,
    `refund_status` VARCHAR(50) NULL,
    `refund_amount` INTEGER NOT NULL DEFAULT 0,
    `refund_at` DATETIME(3) NULL,

    UNIQUE INDEX `orders_order_no_key`(`order_no`),
    INDEX `idx_order_no`(`order_no`),
    INDEX `idx_user_uuid`(`user_uuid`),
    INDEX `idx_status`(`status`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_orders_order_type`(`order_type`),
    INDEX `idx_orders_package_id`(`package_id`),
    INDEX `idx_orders_payment_method`(`payment_method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apikeys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_key` VARCHAR(255) NOT NULL,
    `title` VARCHAR(100) NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(50) NULL,

    UNIQUE INDEX `apikeys_api_key_key`(`api_key`),
    INDEX `idx_api_key`(`api_key`),
    INDEX `idx_user_uuid`(`user_uuid`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trans_no` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_uuid` VARCHAR(255) NOT NULL,
    `trans_type` VARCHAR(50) NOT NULL,
    `credits` INTEGER NOT NULL,
    `order_no` VARCHAR(255) NULL,
    `expired_at` DATETIME(3) NULL,

    UNIQUE INDEX `credits_trans_no_key`(`trans_no`),
    INDEX `idx_trans_no`(`trans_no`),
    INDEX `idx_user_uuid`(`user_uuid`),
    INDEX `idx_trans_type`(`trans_type`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `title` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `content` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `status` VARCHAR(50) NULL,
    `cover_url` VARCHAR(255) NULL,
    `author_name` VARCHAR(255) NULL,
    `author_avatar_url` VARCHAR(255) NULL,
    `locale` VARCHAR(50) NULL,

    UNIQUE INDEX `posts_uuid_key`(`uuid`),
    INDEX `idx_uuid`(`uuid`),
    INDEX `idx_slug`(`slug`),
    INDEX `idx_status`(`status`),
    INDEX `idx_locale`(`locale`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(50) NOT NULL DEFAULT '',
    `invited_by` VARCHAR(255) NOT NULL,
    `paid_order_no` VARCHAR(255) NOT NULL DEFAULT '',
    `paid_amount` INTEGER NOT NULL DEFAULT 0,
    `reward_percent` INTEGER NOT NULL DEFAULT 0,
    `reward_amount` INTEGER NOT NULL DEFAULT 0,

    INDEX `idx_user_uuid`(`user_uuid`),
    INDEX `idx_invited_by`(`invited_by`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(50) NULL,
    `user_uuid` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `rating` INTEGER NULL,

    INDEX `idx_user_uuid`(`user_uuid`),
    INDEX `idx_status`(`status`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color` VARCHAR(20) NOT NULL DEFAULT 'blue',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_sort_order`(`sort_order`),
    UNIQUE INDEX `uk_user_name`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `file_url` TEXT NOT NULL,
    `thumbnail_url` TEXT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category_id` CHAR(36) NULL,
    `file_size` INTEGER NULL,
    `mime_type` VARCHAR(100) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_category_id`(`category_id`),
    INDEX `idx_created_at`(`created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_used` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_email_code`(`email`, `code`),
    INDEX `idx_expires_at`(`expires_at`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redemption_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `code_type` VARCHAR(50) NOT NULL,
    `code_value` VARCHAR(255) NOT NULL,
    `valid_days` INTEGER NOT NULL DEFAULT 30,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `batch_id` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `used_at` DATETIME(3) NULL,
    `used_by` VARCHAR(255) NULL,
    `expires_at` DATETIME(3) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `redemption_codes_code_key`(`code`),
    INDEX `idx_code`(`code`),
    INDEX `idx_status`(`status`),
    INDEX `idx_batch_id`(`batch_id`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `version` VARCHAR(20) NOT NULL,
    `description` TEXT NULL,
    `price` INTEGER NOT NULL,
    `original_price` INTEGER NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
    `daily_credits` INTEGER NOT NULL,
    `valid_days` INTEGER NOT NULL DEFAULT 30,
    `plan_type` VARCHAR(50) NOT NULL DEFAULT 'basic',
    `features` JSON NULL,
    `limitations` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_recommended` BOOLEAN NOT NULL DEFAULT false,
    `tag` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_packages_sort_order`(`sort_order`),
    INDEX `idx_packages_is_active`(`is_active`),
    INDEX `idx_packages_version`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_packages` (
    `id` CHAR(36) NOT NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `package_id` CHAR(36) NOT NULL,
    `order_no` VARCHAR(255) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `daily_credits` INTEGER NOT NULL,
    `package_snapshot` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_user_packages_user_uuid`(`user_uuid`),
    INDEX `idx_user_packages_package_id`(`package_id`),
    INDEX `idx_user_packages_order_no`(`order_no`),
    INDEX `idx_user_packages_end_date`(`end_date`),
    INDEX `idx_user_packages_is_active`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_balances` (
    `id` CHAR(36) NOT NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `package_credits` INTEGER NOT NULL DEFAULT 0,
    `package_reset_at` DATETIME(3) NULL,
    `independent_credits` INTEGER NOT NULL DEFAULT 0,
    `total_used` INTEGER NOT NULL DEFAULT 0,
    `total_purchased` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `credit_balances_user_uuid_key`(`user_uuid`),
    INDEX `idx_credit_balances_updated_at`(`updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_transactions` (
    `id` CHAR(36) NOT NULL,
    `trans_no` VARCHAR(255) NOT NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `credit_type` VARCHAR(20) NOT NULL,
    `amount` INTEGER NOT NULL,
    `before_balance` INTEGER NOT NULL,
    `after_balance` INTEGER NOT NULL,
    `order_no` VARCHAR(255) NULL,
    `description` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `credit_transactions_trans_no_key`(`trans_no`),
    INDEX `idx_credit_transactions_user_uuid`(`user_uuid`),
    INDEX `idx_credit_transactions_type`(`type`),
    INDEX `idx_credit_transactions_credit_type`(`credit_type`),
    INDEX `idx_credit_transactions_order_no`(`order_no`),
    INDEX `idx_credit_transactions_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consumption_trends` (
    `id` CHAR(36) NOT NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `points_used` INTEGER NOT NULL DEFAULT 0,
    `money_used` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tokens_used` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_consumption_trend_user_uuid`(`user_uuid`),
    INDEX `idx_consumption_trend_date`(`date`),
    UNIQUE INDEX `uk_user_date`(`user_uuid`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_usages` (
    `id` CHAR(36) NOT NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `model_name` VARCHAR(100) NOT NULL,
    `usage_type` VARCHAR(100) NOT NULL,
    `credits` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'completed',
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_model_usage_user_uuid`(`user_uuid`),
    INDEX `idx_model_usage_model_name`(`model_name`),
    INDEX `idx_model_usage_timestamp`(`timestamp`),
    INDEX `idx_model_usage_type`(`usage_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_locations` (
    `id` CHAR(36) NOT NULL,
    `user_uuid` VARCHAR(255) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `region` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `visit_count` INTEGER NOT NULL DEFAULT 1,
    `last_visit_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_user_location_user_uuid`(`user_uuid`),
    INDEX `idx_user_location_country`(`country`),
    UNIQUE INDEX `uk_user_location`(`user_uuid`, `country`, `region`, `city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
