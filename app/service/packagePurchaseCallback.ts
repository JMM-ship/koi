/**
 * 套餐购买成功回调服务
 * 当用户购买套餐成功后，调用转发项目接口创建 API Key 并发送邮件通知
 */

import { getEmailTransporter } from '@/app/lib/email';
import { findUserById } from '@/app/models/user';
import { getPackageById } from '@/app/models/package';

interface PackagePurchaseCallbackParams {
  userId: string;
  packageId: string;
  orderNo: string;
}

interface CallbackResult {
  success: boolean;
  apiKey?: string;
  error?: string;
}

interface CreateApiKeyResponse {
  success: boolean;
  apiKey?: string;
  keyId?: string;
  error?: string;
}

/**
 * 调用转发项目接口创建 API Key
 */
async function createApiKeyViaForwardAPI(
  userId: string,
  username: string,
  email: string
): Promise<CreateApiKeyResponse> {
  try {
    // TODO: 后期替换为实际的转发项目接口地址
    const forwardApiUrl = process.env.FORWARD_API_URL || 'http://localhost:3000';
    const endpoint = `${forwardApiUrl}/api/admin/create-apikey`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要管理员认证，添加认证头
        // 'x-admin-token': process.env.FORWARD_API_ADMIN_TOKEN || '',
      },
      body: JSON.stringify({
        userId: userId,
        username: username,
        email: email,
        name: 'Auto-generated on package purchase',
        // 可以添加初始钱包余额
        initialBalance: {
          packageTokens: 0,
          independentTokens: 0,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `API returned status ${response.status}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      apiKey: data.apiKey || data.key,
      keyId: data.keyId || data.id
    };
  } catch (error) {
    console.error('Error calling forward API to create API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 发送套餐购买成功邮件（包含 API Key）
 */
async function sendApiKeyEmail(
  userEmail: string,
  userName: string,
  packageName: string,
  apiKey: string,
  orderNo: string,
  packageDetails: any
): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'KOI'}" <${process.env.SMTP_USER || 'noreply@koi.com'}>`,
      to: userEmail,
      subject: `🎉 套餐购买成功 - 您的 API Key 已生成`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 28px;">🎉 购买成功！</h1>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">感谢您选择 KOI 服务</p>
            </div>

            <!-- Greeting -->
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              尊敬的 <strong>${userName}</strong>，
            </p>

            <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
              您的套餐已成功激活！我们已为您在转发服务中创建了专属的 API Key，现在您可以开始使用我们的服务了。
            </p>

            <!-- Order Info Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; margin: 25px 0; color: white;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; color: white;">📦 订单信息</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: rgba(255,255,255,0.9);">订单号：</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: white;">${orderNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: rgba(255,255,255,0.9);">套餐名称：</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: white;">${packageName}</td>
                </tr>
                ${packageDetails.dailyPoints ? `
                <tr>
                  <td style="padding: 8px 0; color: rgba(255,255,255,0.9);">每日额度：</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: white;">${packageDetails.dailyPoints.toLocaleString()} tokens</td>
                </tr>
                ` : ''}
                ${packageDetails.validDays ? `
                <tr>
                  <td style="padding: 8px 0; color: rgba(255,255,255,0.9);">有效期：</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: white;">${packageDetails.validDays} 天</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- API Key Box -->
            <div style="background-color: #fff3cd; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">🔑 您的转发服务 API Key</h3>
              <p style="color: #856404; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
                此 API Key 用于访问我们的 AI 模型转发服务。请妥善保管，不要泄露给他人。
              </p>
              <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; margin: 15px 0; border: 2px dashed #ffc107; position: relative;">
                <code style="font-size: 15px; color: #d63384; word-break: break-all; font-family: 'Courier New', monospace; font-weight: 600;">${apiKey}</code>
              </div>
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 6px; margin-top: 15px;">
                <p style="color: #721c24; font-size: 13px; margin: 0; line-height: 1.5;">
                  ⚠️ <strong>安全提示：</strong>
                </p>
                <ul style="color: #721c24; font-size: 12px; margin: 8px 0 0 0; padding-left: 20px;">
                  <li>请立即保存此 API Key，它将不会再次以明文形式显示</li>
                  <li>不要在公开代码仓库中提交此密钥</li>
                  <li>建议使用环境变量存储</li>
                  <li>如发现泄露，请立即在控制面板中删除并重新生成</li>
                </ul>
              </div>
            </div>

            <!-- Quick Start Guide -->
            <div style="background-color: #e7f3ff; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #2196F3;">
              <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">🚀 快速开始</h3>
              <ol style="color: #0c5460; font-size: 14px; line-height: 1.9; margin: 10px 0; padding-left: 20px;">
                <li>将 API Key 配置到您的应用程序中</li>
                <li>设置请求头：<code style="background: white; padding: 2px 6px; border-radius: 3px; color: #d63384;">Authorization: Bearer YOUR_API_KEY</code></li>
                <li>参考 <a href="${process.env.PUBLIC_APP_URL || 'https://koi.codes'}/docs" style="color: #2196F3; text-decoration: none; font-weight: bold;">API 文档</a> 开始集成</li>
                <li>在控制面板中查看使用情况和余额</li>
              </ol>
            </div>

            <!-- Example Code -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">💻 示例代码：</h4>
              <pre style="background-color: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 13px; margin: 0;"><code>curl ${process.env.FORWARD_API_URL || 'http://localhost:3000'}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey.substring(0, 20)}..." \\
  -d '{
    "model": "claude-3-5-haiku",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'</code></pre>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.PUBLIC_APP_URL || 'https://koi.codes'}/dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                前往控制面板 →
              </a>
            </div>

            <!-- Divider -->
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 35px 0;">

            <!-- Footer -->
            <div style="text-align: center;">
              <p style="color: #999; font-size: 13px; margin: 5px 0;">
                如需帮助，请访问 <a href="${process.env.PUBLIC_APP_URL || 'https://koi.codes'}/support" style="color: #667eea; text-decoration: none;">帮助中心</a> 或回复此邮件联系我们
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                此邮件由系统自动发送，请勿直接回复
              </p>
              <p style="color: #ccc; font-size: 11px; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} KOI. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('API Key email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending API Key email:', error);
    return false;
  }
}

/**
 * 处理套餐购买成功回调
 *
 * 主要流程：
 * 1. 获取用户和套餐信息
 * 2. 调用转发项目接口创建 API Key
 * 3. 发送包含 API Key 的邮件给用户
 *
 * @param params - 回调参数
 * @returns 处理结果
 */
export async function handlePackagePurchaseCallback(
  params: PackagePurchaseCallbackParams
): Promise<CallbackResult> {
  try {
    const { userId, packageId, orderNo } = params;

    console.log(`[PackagePurchaseCallback] Processing for user ${userId}, package ${packageId}, order ${orderNo}`);

    // 1. 获取用户信息
    const user = await findUserById(userId);
    if (!user) {
      console.error(`[PackagePurchaseCallback] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    // 2. 获取套餐信息
    const packageInfo = await getPackageById(packageId);
    if (!packageInfo) {
      console.error(`[PackagePurchaseCallback] Package not found: ${packageId}`);
      return { success: false, error: 'Package not found' };
    }

    // 3. 调用转发项目接口创建 API Key
    const apiKeyResult = await createApiKeyViaForwardAPI(
      userId,
      user.nickname || user.email.split('@')[0],
      user.email
    );

    if (!apiKeyResult.success || !apiKeyResult.apiKey) {
      console.error(`[PackagePurchaseCallback] Failed to create API key:`, apiKeyResult.error);
      return {
        success: false,
        error: apiKeyResult.error || 'Failed to create API key via forward API'
      };
    }

    console.log(`[PackagePurchaseCallback] API Key created successfully for user ${userId}`);

    // 4. 发送邮件通知
    const emailSent = await sendApiKeyEmail(
      user.email,
      user.nickname || user.email.split('@')[0],
      packageInfo.name,
      apiKeyResult.apiKey,
      orderNo,
      {
        dailyPoints: packageInfo.dailyPoints,
        validDays: packageInfo.validDays,
        features: packageInfo.features
      }
    );

    if (!emailSent) {
      console.warn(`[PackagePurchaseCallback] Email sent failed, but API key was created`);
      // 即使邮件发送失败，也认为回调成功（因为 API key 已创建）
    } else {
      console.log(`[PackagePurchaseCallback] Email sent successfully to ${user.email}`);
    }

    return {
      success: true,
      apiKey: apiKeyResult.apiKey
    };
  } catch (error) {
    console.error('[PackagePurchaseCallback] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
