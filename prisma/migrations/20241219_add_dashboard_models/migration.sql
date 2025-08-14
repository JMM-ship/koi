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

    UNIQUE INDEX `uk_user_date`(`user_uuid`, `date`),
    INDEX `idx_consumption_trend_user_uuid`(`user_uuid`),
    INDEX `idx_consumption_trend_date`(`date`),
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

    UNIQUE INDEX `uk_user_location`(`user_uuid`, `country`, `region`, `city`),
    INDEX `idx_user_location_user_uuid`(`user_uuid`),
    INDEX `idx_user_location_country`(`country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;