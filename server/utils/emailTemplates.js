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
<div style="font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; background-color: #f4f3f0; padding: 40px 10px; color: #1a1512; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1.5px solid #ede8df; padding: 30px 24px; box-shadow: 0 10px 30px rgba(26,21,18,0.06); text-align: left; box-sizing: border-box; position: relative;">
        
        <!-- Copy Badge -->
        <div style="text-align: right; margin-bottom: 15px;">
            <span style="font-size: 8px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; color: #8a6a2f; border: 1px solid #8a6a2f; border-radius: 24px; padding: 3px 10px; display: inline-block;">STUDENT COPY</span>
        </div>

        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #8a6a2f; padding-bottom: 12px; margin-bottom: 15px;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: #111827; border: 1px solid #8a6a2f; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="color: #8a6a2f; font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 15px; line-height: 42px; display: block; text-align: center; width: 100%;">HA</span>
            </div>
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #0f0d0b; margin: 0; line-height: 1.2;">Hunar Asaan Skill Center</h2>
            <p style="font-size: 8.5px; color: #7a6e65; margin: 4px 0 2px 0;">Plot 14, Tech Avenue, Gulberg III, Lahore, Pakistan</p>
            <p style="font-size: 8.5px; color: #7a6e65; margin: 0;">+92 300 0000000 | info@hunarasaan.edu | hunarasaan.edu</p>
            <h3 style="font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #0f0d0b; margin: 12px 0 0 0;">PAYMENT RECEIPT</h3>
        </div>

        <!-- Meta Grid -->
        <div style="width: 100%; margin-bottom: 12px; font-size: 10px; border-collapse: collapse;">
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="width: 50%; padding-bottom: 8px; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Receipt No:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512;">${receiptNo}</span>
                    </td>
                    <td style="width: 50%; padding-bottom: 8px; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Date Paid:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512;">${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                </tr>
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Payment Method:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512; text-transform: uppercase;">${paymentMethod}</span>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Batch:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512;">${batchName || 'Unassigned'}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Student Section -->
        <div style="padding: 10px 0; border-top: 1px solid #ede8df; border-bottom: 1px solid #ede8df; margin-bottom: 12px;">
            <div style="margin-bottom: 6px;">
                <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Student Name:</span>
                <span style="font-weight: 700; font-size: 11px; color: #1a1512;">${name}</span>
            </div>
            <div>
                <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Program / Course:</span>
                <span style="font-weight: 700; font-size: 10.5px; color: #1a1512;">${courseName || 'Skills Training'}</span>
            </div>
        </div>

        <!-- Fee Table -->
        <div style="margin-bottom: 15px; font-size: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #8a6a2f; text-align: left; padding-bottom: 4px; width: 70%;">Fee Head Description</th>
                        <th style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #8a6a2f; text-align: right; padding-bottom: 4px; width: 30%;">Amount (PKR)</th>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1.5px solid #ede8df; padding: 0;"></td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px 0; text-align: left;">Paid Installment / Fee</td>
                        <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #1a1512;">Rs. ${parseFloat(amountPaid).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1px solid #ede8df; padding: 0;"></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; text-align: left;">Remaining Balance</td>
                        <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #ef4444;">Rs. ${parseFloat(remainingBalance).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1px solid #ede8df; padding: 0;"></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 700; text-transform: uppercase; color: #065f46; text-align: left;">Amount Paid</td>
                        <td style="padding: 8px 0; font-weight: 900; text-align: right; color: #065f46; font-size: 12px;">Rs. ${parseFloat(amountPaid).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 2px solid #8a6a2f; padding: 0;"></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Verification Notice -->
        <p style="font-size: 8px; color: #065f46; font-weight: bold; background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 10px; text-align: center; margin: 15px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Transaction Verified & Recorded Successfully
        </p>

        <!-- Terms Footer -->
        <p style="font-size: 7.5px; color: #7a6e65; line-height: 1.4; margin-top: 15px; text-align: center; font-style: italic; margin-bottom: 0;">
            Note: Fee once deposited is non-refundable. For verification or billing queries, contact sadia@hunarasaan.com.
        </p>
    </div>
</div>
`;

const getInstallmentDueTemplate = (name, courseName, batchName, amountDue, dueDate, bankDetails, instructions) => `
<div style="font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; background-color: #f4f3f0; padding: 40px 10px; color: #1a1512; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1.5px solid #ede8df; padding: 30px 24px; box-shadow: 0 10px 30px rgba(26,21,18,0.06); text-align: left; box-sizing: border-box; position: relative;">
        
        <!-- Copy Badge -->
        <div style="text-align: right; margin-bottom: 15px;">
            <span style="font-size: 8px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; color: #8a6a2f; border: 1px solid #8a6a2f; border-radius: 24px; padding: 3px 10px; display: inline-block;">STUDENT COPY</span>
        </div>

        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #8a6a2f; padding-bottom: 12px; margin-bottom: 15px;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: #111827; border: 1px solid #8a6a2f; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="color: #8a6a2f; font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 15px; line-height: 42px; display: block; text-align: center; width: 100%;">HA</span>
            </div>
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #0f0d0b; margin: 0; line-height: 1.2;">Hunar Asaan Skill Center</h2>
            <p style="font-size: 8.5px; color: #7a6e65; margin: 4px 0 2px 0;">Plot 14, Tech Avenue, Gulberg III, Lahore, Pakistan</p>
            <p style="font-size: 8.5px; color: #7a6e65; margin: 0;">+92 300 0000000 | info@hunarasaan.edu | hunarasaan.edu</p>
            <h3 style="font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #0f0d0b; margin: 12px 0 0 0;">FEE CHALLAN</h3>
        </div>

        <!-- Meta Grid -->
        <div style="width: 100%; margin-bottom: 12px; font-size: 10px; border-collapse: collapse;">
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="width: 50%; padding-bottom: 8px; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Challan No:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512;">CHA-${new Date().getFullYear()}-DUE</span>
                    </td>
                    <td style="width: 50%; padding-bottom: 8px; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Issue Date:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512;">${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                </tr>
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Due Date:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #ef4444;">${new Date(dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Batch:</span>
                        <span style="font-family: monospace; font-weight: 600; color: #1a1512;">${batchName || 'Unassigned'}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Student Section -->
        <div style="padding: 10px 0; border-top: 1px solid #ede8df; border-bottom: 1px solid #ede8df; margin-bottom: 12px;">
            <div style="margin-bottom: 6px;">
                <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Student Name:</span>
                <span style="font-weight: 700; font-size: 11px; color: #1a1512;">${name}</span>
            </div>
            <div>
                <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; color: #7a6e65; display: block;">Program / Course:</span>
                <span style="font-weight: 700; font-size: 10.5px; color: #1a1512;">${courseName || 'Skills Training'}</span>
            </div>
        </div>

        <!-- Fee Table -->
        <div style="margin-bottom: 15px; font-size: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #8a6a2f; text-align: left; padding-bottom: 4px; width: 70%;">Fee Head Description</th>
                        <th style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #8a6a2f; text-align: right; padding-bottom: 4px; width: 30%;">Amount (PKR)</th>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1.5px solid #ede8df; padding: 0;"></td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px 0; text-align: left;">Tuition Fee / Installment</td>
                        <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #1a1512;">Rs. ${parseFloat(amountDue).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1px solid #ede8df; padding: 0;"></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 700; text-transform: uppercase; color: #1a1512; text-align: left;">Total Dues</td>
                        <td style="padding: 8px 0; font-weight: 900; text-align: right; color: #ef4444; font-size: 12px;">Rs. ${parseFloat(amountDue).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 2px solid #8a6a2f; padding: 0;"></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Bank details -->
        ${bankDetails ? `
        <div style="margin-bottom: 15px;">
            <span style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #8a6a2f; display: block; margin-bottom: 6px;">BANK DEPOSIT ACCOUNT</span>
            <div style="background: #fcfbf7; border: 1px solid #ede8df; border-radius: 8px; padding: 12px; font-size: 9px; line-height: 1.6;">
                <p style="margin: 0; color: #475569;"><strong>Bank Name:</strong> ${bankDetails.bankName}</p>
                <p style="margin: 3px 0 0 0; color: #475569;"><strong>Account Title:</strong> ${bankDetails.accountTitle}</p>
                <p style="margin: 3px 0 0 0; color: #475569;"><strong>Account Number:</strong> ${bankDetails.accountNo}</p>
                <p style="margin: 3px 0 0 0; color: #475569;"><strong>IBAN Code:</strong> ${bankDetails.ibanCode || 'N/A'}</p>
            </div>
        </div>
        ` : ''}

        ${instructions ? `
        <div style="margin-bottom: 15px;">
            <span style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #8a6a2f; display: block; margin-bottom: 6px;">PAYMENT INSTRUCTIONS</span>
            <p style="font-size: 8.5px; line-height: 1.5; color: #7a6e65; background: #fcfbf7; border: 1px solid #ede8df; border-left: 3px solid #8a6a2f; border-radius: 4px; padding: 10px; margin: 0;">${instructions}</p>
        </div>
        ` : ''}

        <!-- Terms Footer -->
        <p style="font-size: 7.5px; color: #7a6e65; line-height: 1.4; margin-top: 15px; text-align: center; font-style: italic; margin-bottom: 0;">
            Terms: Fee once deposited is non-refundable. Please upload a paid copy of this challan on the student portal or WhatsApp us to verify payment.
        </p>
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
