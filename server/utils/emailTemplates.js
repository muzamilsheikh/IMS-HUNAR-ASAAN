/**
 * Email templates for automated CRM messaging with premium visual styling and dynamic hosted logo integration.
 */

const getWelcomeTemplate = (name, email, password, courseName, batchName) => `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 45px 20px; text-align: center; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
        <!-- Header banner with logo -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 35px 30px; text-align: center; color: #ffffff; border-bottom: 4px solid #0ea5e9;">
            <div style="margin-bottom: 15px;">
                <img src="__LOGO_URL_PLACEHOLDER__" alt="Hunar Asaan Logo" style="max-height: 75px; width: auto; display: inline-block; vertical-align: middle;" />
            </div>
            <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3em; color: #38bdf8; font-weight: 700;">Scholar Registration Protocol</p>
        </div>
        <!-- Body -->
        <div style="padding: 45px; text-align: left;">
            <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 0; text-transform: uppercase; tracking: -0.03em;">Welcome to Hunar Asaan Skills Center!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your profile has been successfully registered in the Hunar Asaan Student Management Portal. You now have secure, verified access to your courses, class schedule, live links, and fee portal.</p>
            
            <div style="background: #f1f5f9; padding: 25px; border-radius: 16px; margin: 25px 0; border-left: 5px solid #0ea5e9;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900;">Academic Enrollment</h3>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Selected Course:</strong> ${courseName || 'N/A'}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Assigned Batch:</strong> ${batchName || 'N/A'}</p>
                
                <h3 style="margin-top: 20px; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900;">Authentication Credentials</h3>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Login Portal:</strong> <a href="https://ims.hunarasaan.com" style="color: #0ea5e9; font-weight: bold; text-decoration: none;">ims.hunarasaan.com</a></p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>System Email:</strong> ${email}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 3px 6px; border-radius: 4px; font-weight: bold; color: #0f172a; font-size: 12px;">${password}</code></p>
            </div>
            
            <div style="text-align: center; margin: 35px 0 20px 0;">
                <a href="https://ims.hunarasaan.com" style="background: #0f172a; color: #ffffff; padding: 16px 32px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.2); display: inline-block;">Establish Portal Session</a>
            </div>
            
            <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; margin-top: 30px; text-align: center;">Note: Please change your password immediately after your first successful login to ensure your account security.</p>
        </div>
        <!-- Footer -->
        <div style="background: #0f172a; color: #64748b; padding: 25px; text-align: center; font-size: 11px; border-top: 1px solid #1e293b;">
            <p style="margin: 0; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Hunar Asaan Skills Academy</p>
            <p style="margin: 5px 0 0 0;">All transactions are encrypted and audited globally. If you did not request this account, notify sadia@hunarasaan.com.</p>
        </div>
    </div>
</div>
`;

const getStaffLoginAlertTemplate = (name, email, role, time, ip) => `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 45px 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
        <div style="background: #ef4444; padding: 25px 40px; color: #ffffff; text-align: center;">
            <div style="margin-bottom: 12px;">
                <img src="__LOGO_URL_PLACEHOLDER__" alt="Hunar Asaan Logo" style="max-height: 60px; width: auto; display: inline-block; vertical-align: middle;" />
            </div>
            <div style="font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-style: italic;">🚨 SECURITY ACCESS ALERT</div>
        </div>
        <div style="padding: 40px;">
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello Admin / Manager,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">A staff account has successfully established an active session on the Hunar Asaan CRM portal. Details are logged below:</p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Staff Member:</strong> ${name}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>System Role:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #ef4444;">${role === 'accounts_manager' ? 'Accounts Manager' : role}</span></p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Access Time:</strong> ${new Date(time).toLocaleString()}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>IP Identifier:</strong> <code style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px; font-weight: bold; color: #0f172a;">${ip || 'N/A'}</code></p>
            </div>
            
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">If this login was unexpected, please review the active sessions and consider resetting the user's password immediately.</p>
        </div>
        <div style="background: #0f172a; color: #64748b; padding: 25px; text-align: center; font-size: 11px;">
            <p style="margin: 0; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Hunar Asaan Audit System</p>
            <p style="margin: 5px 0 0 0;">This email is auto-generated as part of security compliance.</p>
        </div>
    </div>
</div>
`;

const getFeePaidTemplate = (name, receiptNo, amountPaid, remainingBalance, courseName, batchName, paymentMethod) => `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 45px 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #115e59 100%); padding: 35px 30px; text-align: center; color: #ffffff; border-bottom: 4px solid #10b981;">
            <div style="margin-bottom: 15px;">
                <img src="__LOGO_URL_PLACEHOLDER__" alt="Hunar Asaan Logo" style="max-height: 70px; width: auto; display: inline-block; vertical-align: middle;" />
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; tracking: -0.02em; text-transform: uppercase; color: #ffffff; font-style: italic;">FEE RECEIPT</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #34d399; font-weight: 700;">Verified Transaction</p>
        </div>
        <div style="padding: 40px;">
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Thank you! Your fee payment has been successfully recorded and processed. Below are your official receipt details. We have also attached your detailed PDF receipt to this email.</p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Receipt No:</span>
                    <strong style="font-size: 13px; color: #0f172a;">${receiptNo}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Course & Batch:</span>
                    <strong style="font-size: 13px; color: #0f172a; text-align: right;">${courseName || 'N/A'} (${batchName || 'N/A'})</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Payment Method:</span>
                    <strong style="font-size: 13px; color: #0f172a; text-transform: uppercase;">${paymentMethod}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; background: #ecfdf5; padding: 12px; border-radius: 8px; align-items: center;">
                    <span style="font-size: 12px; font-weight: bold; color: #047857; text-transform: uppercase;">Amount Paid:</span>
                    <strong style="font-size: 18px; color: #065f46;">Rs. ${parseFloat(amountPaid).toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 6px; align-items: center;">
                    <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Outstanding Balance:</span>
                    <strong style="font-size: 14px; color: #ef4444;">Rs. ${parseFloat(remainingBalance).toLocaleString()}</strong>
                </div>
            </div>
            
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">A soft copy of this transaction receipt has been verified and registered on your student portal. You can download your detailed ledger and future challans by logging into your portal.</p>
        </div>
        <div style="background: #0f172a; color: #64748b; padding: 25px; text-align: center; font-size: 11px;">
            <p style="margin: 0; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Hunar Asaan Skills Center</p>
            <p style="margin: 5px 0 0 0;">All transactions are subject to terms. For inquiries, contact sadia@hunarasaan.com.</p>
        </div>
    </div>
</div>
`;

const getInstallmentDueTemplate = (name, courseName, batchName, amountDue, dueDate, bankDetails, instructions) => `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 45px 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; border-bottom: 4px solid #ef4444;">
            <div style="margin-bottom: 15px;">
                <img src="__LOGO_URL_PLACEHOLDER__" alt="Hunar Asaan Logo" style="max-height: 70px; width: auto; display: inline-block; vertical-align: middle;" />
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; tracking: -0.02em; text-transform: uppercase; color: #ffffff; font-style: italic;">FEE DUE CHALLAN</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #f87171; font-weight: 700;">Action Required</p>
        </div>
        <div style="padding: 40px;">
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">This is a friendly reminder that a fee installment is due for your enrollment. We have attached the official PDF challan to this email.</p>
            
            <div style="background: #fef2f2; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #fecaca;">
                <p style="margin: 8px 0; font-size: 13px; color: #1f2937;"><strong>Course:</strong> ${courseName || 'N/A'}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #1f2937;"><strong>Batch:</strong> ${batchName || 'N/A'}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #1f2937;"><strong>Amount Due:</strong> <strong style="color: #ef4444; font-size: 15px;">Rs. ${parseFloat(amountDue).toLocaleString()}</strong></p>
                <p style="margin: 8px 0; font-size: 13px; color: #1f2937;"><strong>Due Date:</strong> <strong style="color: #0f172a;">${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
            </div>

            <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Payment Bank Accounts</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 16px; font-size: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0; color: #334155;"><strong>Bank:</strong> ${bankDetails.bankName || 'Askari Bank Limited'}</p>
                <p style="margin: 5px 0; color: #334155;"><strong>Title:</strong> ${bankDetails.accountTitle || 'HUNAR ASAAN SKILLS ACADEMY'}</p>
                <p style="margin: 5px 0; color: #334155;"><strong>Account #:</strong> ${bankDetails.accountNo || '04000200002132'}</p>
                <p style="margin: 5px 0; color: #334155;"><strong>IBAN:</strong> ${bankDetails.ibanCode || 'N/A'}</p>
            </div>

            ${instructions ? `
            <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 20px; margin-bottom: 10px;">Payment Instructions</h3>
            <p style="font-size: 12px; line-height: 1.6; color: #64748b; background: #fffbeb; padding: 15px; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 0;">${instructions}</p>
            ` : ''}
            
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-top: 25px;">Please upload your paid slip screenshot on your portal or send it on WhatsApp to confirm registration.</p>
        </div>
        <div style="background: #0f172a; color: #64748b; padding: 25px; text-align: center; font-size: 11px;">
            <p style="margin: 0; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Hunar Asaan Accounts</p>
            <p style="margin: 5px 0 0 0;">If you have already paid this installment, please ignore this email.</p>
        </div>
    </div>
</div>
`;

const getStaffWelcomeTemplate = (name, email, password, role) => `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 45px 20px; text-align: center; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 35px 30px; text-align: center; color: #ffffff; border-bottom: 4px solid #0ea5e9;">
            <div style="margin-bottom: 15px;">
                <img src="__LOGO_URL_PLACEHOLDER__" alt="Hunar Asaan Logo" style="max-height: 75px; width: auto; display: inline-block; vertical-align: middle;" />
            </div>
            <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3em; color: #38bdf8; font-weight: 700;">Staff Access Provisioned</p>
        </div>
        <div style="padding: 45px; text-align: left;">
            <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 0; text-transform: uppercase; tracking: -0.03em;">Welcome to the Team!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your staff account has been successfully created and provisioned on the Hunar Asaan CRM Management Portal. Below are your credentials to establish access:</p>
            
            <div style="background: #f1f5f9; padding: 25px; border-radius: 16px; margin: 25px 0; border-left: 5px solid #0ea5e9;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900;">Portal Settings</h3>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Authorized Role:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #0ea5e9;">${role === 'accounts_manager' ? 'Accounts Manager' : role}</span></p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Login URL:</strong> <a href="https://ims.hunarasaan.com" style="color: #0ea5e9; font-weight: bold; text-decoration: none;">ims.hunarasaan.com</a></p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Email/Username:</strong> ${email}</p>
                <p style="margin: 8px 0; font-size: 13px; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 3px 6px; border-radius: 4px; font-weight: bold; color: #0f172a; font-size: 12px;">${password}</code></p>
            </div>
            
            <div style="text-align: center; margin: 35px 0 20px 0;">
                <a href="https://ims.hunarasaan.com" style="background: #0f172a; color: #ffffff; padding: 16px 32px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.2); display: inline-block;">Login to Portal</a>
            </div>
            
            <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; margin-top: 30px; text-align: center;">Please reset your password immediately upon establishing your first session to ensure secure credential storage.</p>
        </div>
        <div style="background: #0f172a; color: #64748b; padding: 25px; text-align: center; font-size: 11px; border-top: 1px solid #1e293b;">
            <p style="margin: 0; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Hunar Asaan Operations Registry</p>
            <p style="margin: 5px 0 0 0;">This email is auto-dispatched to provision secure terminal access. If you are not the intended recipient, notify support@hunarasaan.com.</p>
        </div>
    </div>
</div>
`;

module.exports = {
    getWelcomeTemplate,
    getStaffLoginAlertTemplate,
    getFeePaidTemplate,
    getInstallmentDueTemplate,
    getStaffWelcomeTemplate
};
