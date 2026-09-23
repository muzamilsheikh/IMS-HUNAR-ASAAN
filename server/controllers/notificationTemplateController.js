const { NotificationTemplate, Student, Course, Batch, Enrollment, Setting } = require('../models');
const { sendEmail } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

// ─── Helpers ───────────────────────────────────────────────────────────────

const toSlug = (title) =>
    title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const interpolate = (text = '', vars = {}) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{{${key}}}`);

const buildVarsFromStudent = (student, enrollment, settings) => {
    const phone = student.phone || '';
    const intlPhone = phone.startsWith('+')
        ? phone.replace(/\D/g, '')
        : phone.replace(/^0/, '92').replace(/\D/g, '');

    const courseName = enrollment?.Course?.name || student.Course?.name || 'N/A';
    const batchName  = enrollment?.Batch?.name  || student.Batch?.name  || 'N/A';
    const dueAmount  = enrollment
        ? Math.max(0, parseFloat(enrollment.totalFee || 0) - parseFloat(enrollment.discount || 0)).toLocaleString()
        : (student.totalFee || '0');
    const dueDate = student.next_due_date
        ? new Date(student.next_due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

    return {
        student_name:   student.name || '',
        student_email:  student.email || '',
        phone,
        intl_phone:     intlPhone,
        course_name:    courseName,
        batch_name:     batchName,
        due_amount:     dueAmount,
        due_date:       dueDate,
        institute_name: settings?.instituteName || 'Hunar Asaan Skills Center',
        contact:        settings?.contact || '',
        student_id:     student.customId || String(student.id),
    };
};

// ─── Seed system templates once on first boot ───────────────────────────────

const SYSTEM_TEMPLATES = [
    {
        id: uuidv4(),
        title: 'Fee Due Reminder',
        slug: 'fee-due-reminder',
        category: 'BOTH',
        subject: 'Friendly Reminder: Fee Due — {{institute_name}}',
        bodyHtml: null,
        bodyText: `Assalam-o-Alaikum {{student_name}},\n\nWe hope you are doing well! This is a gentle reminder that your fee installment is due.\n\n📚 Course: {{course_name}}\n🏫 Batch: {{batch_name}}\n💰 Amount Due: Rs. {{due_amount}}\n📅 Due Date: {{due_date}}\n\nPlease ensure timely payment to avoid any disruption to your studies. For payments or queries, contact us directly.\n\nWarm regards,\n{{institute_name}} Management Team`,
        isActive: true,
        isSystem: true,
        placeholders: JSON.stringify(['student_name', 'course_name', 'batch_name', 'due_amount', 'due_date', 'institute_name']),
    },
    {
        id: uuidv4(),
        title: 'Admission Confirmation',
        slug: 'admission-confirmation',
        category: 'EMAIL',
        subject: 'Admission Confirmed — {{institute_name}}',
        bodyHtml: null,
        bodyText: `Dear {{student_name}},\n\nCongratulations! Your admission at {{institute_name}} has been successfully confirmed.\n\n📚 Program / Course: {{course_name}}\n🏫 Batch: {{batch_name}}\n\nWe are excited to have you on board! If you have any questions, feel free to reach out to us.\n\nBest regards,\n{{institute_name}} Management Team`,
        isActive: true,
        isSystem: true,
        placeholders: JSON.stringify(['student_name', 'course_name', 'batch_name', 'institute_name']),
    },
    {
        id: uuidv4(),
        title: 'General Announcement',
        slug: 'general-announcement',
        category: 'WHATSAPP',
        subject: null,
        bodyHtml: null,
        bodyText: `Assalam-o-Alaikum {{student_name}} 👋\n\nWe have an important update from {{institute_name}}. Please stay tuned to your email and this WhatsApp for further information.\n\nFor queries, contact us at {{contact}}.\n\n{{institute_name}} Team`,
        isActive: true,
        isSystem: true,
        placeholders: JSON.stringify(['student_name', 'institute_name', 'contact']),
    },
];

const seedSystemTemplates = async () => {
    try {
        const count = await NotificationTemplate.count();
        if (count === 0) {
            await NotificationTemplate.bulkCreate(SYSTEM_TEMPLATES);
            console.log('🌱 Seeded 3 system notification templates');
        }
    } catch (err) {
        console.warn('⚠️  Failed to seed notification templates (non-fatal):', err.message);
    }
};

// ─── CRUD Controllers ───────────────────────────────────────────────────────

const getAll = async (req, res) => {
    try {
        await seedSystemTemplates();
        const { category, active } = req.query;
        const where = {};
        if (category) where.category = category;
        if (active !== undefined) where.isActive = active === 'true';

        const templates = await NotificationTemplate.findAll({
            where,
            order: [['isSystem', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(templates);
    } catch (err) {
        console.error('getAll notification templates error:', err);
        res.status(500).json({ error: err.message });
    }
};

const getOne = async (req, res) => {
    try {
        const tmpl = await NotificationTemplate.findByPk(req.params.id);
        if (!tmpl) return res.status(404).json({ error: 'Template not found' });
        res.json(tmpl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const create = async (req, res) => {
    try {
        const { title, category, subject, bodyHtml, bodyText, placeholders, isActive } = req.body;
        if (!title || !bodyText) {
            return res.status(400).json({ error: 'title and bodyText are required' });
        }
        let slug = toSlug(title);
        const existing = await NotificationTemplate.findOne({ where: { slug } });
        if (existing) slug = `${slug}-${Date.now()}`;

        const tmpl = await NotificationTemplate.create({
            id: uuidv4(),
            title,
            slug,
            category: category || 'BOTH',
            subject: subject || null,
            bodyHtml: bodyHtml || null,
            bodyText,
            isActive: isActive !== false,
            isSystem: false,
            placeholders: Array.isArray(placeholders) ? JSON.stringify(placeholders) : (placeholders || '[]'),
        });
        res.status(201).json(tmpl);
    } catch (err) {
        console.error('create notification template error:', err);
        res.status(500).json({ error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const tmpl = await NotificationTemplate.findByPk(req.params.id);
        if (!tmpl) return res.status(404).json({ error: 'Template not found' });

        const { title, category, subject, bodyHtml, bodyText, placeholders, isActive } = req.body;
        const updateData = {};
        if (title     !== undefined) { updateData.title = title; updateData.slug = toSlug(title); }
        if (category  !== undefined) updateData.category  = category;
        if (subject   !== undefined) updateData.subject   = subject;
        if (bodyHtml  !== undefined) updateData.bodyHtml  = bodyHtml;
        if (bodyText  !== undefined) updateData.bodyText  = bodyText;
        if (isActive  !== undefined) updateData.isActive  = isActive;
        if (placeholders !== undefined) {
            updateData.placeholders = Array.isArray(placeholders) ? JSON.stringify(placeholders) : placeholders;
        }
        await tmpl.update(updateData);
        res.json(tmpl);
    } catch (err) {
        console.error('update notification template error:', err);
        res.status(500).json({ error: err.message });
    }
};

const remove = async (req, res) => {
    try {
        const tmpl = await NotificationTemplate.findByPk(req.params.id);
        if (!tmpl) return res.status(404).json({ error: 'Template not found' });
        if (tmpl.isSystem) return res.status(403).json({ error: 'System templates cannot be deleted.' });
        await tmpl.destroy();
        res.json({ message: 'Template deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/notification-templates/send
const sendReminder = async (req, res) => {
    try {
        const { templateId, studentId, channel } = req.body;
        if (!templateId || !studentId || !channel) {
            return res.status(400).json({ error: 'templateId, studentId, and channel are required' });
        }

        const [tmpl, student, settings] = await Promise.all([
            NotificationTemplate.findByPk(templateId),
            Student.findByPk(studentId, {
                include: [
                    { model: Course },
                    { model: Batch },
                    {
                        model: Enrollment,
                        as: 'Enrollments',
                        limit: 1,
                        order: [['createdAt', 'DESC']],
                        include: [
                            { model: Course, as: 'Course' },
                            { model: Batch, as: 'Batch' }
                        ]
                    }
                ]
            }),
            Setting.findOne()
        ]);

        if (!tmpl)    return res.status(404).json({ error: 'Template not found' });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const enrollment = student.Enrollments?.[0] || null;
        const vars = buildVarsFromStudent(student, enrollment, settings);

        if (channel === 'EMAIL') {
            if (!student.email) return res.status(400).json({ error: 'Student has no email address on file.' });
            const subject  = interpolate(tmpl.subject || 'Notification from {{institute_name}}', vars);
            const bodyText = interpolate(tmpl.bodyText, vars);
            const htmlBody = tmpl.bodyHtml
                ? interpolate(tmpl.bodyHtml, vars)
                : `<div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1e293b;"><div style="background:#f8fafc;border-radius:16px;padding:30px;border:1px solid #e2e8f0;"><pre style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;font-family:inherit;">${bodyText}</pre></div><p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:20px;">${vars.institute_name}</p></div>`;
            await sendEmail(student.email, subject, htmlBody, [], null);
            return res.json({ success: true, channel: 'EMAIL', to: student.email, subject, message: `Email sent to ${student.email}` });
        }

        if (channel === 'WHATSAPP') {
            if (!student.phone) return res.status(400).json({ error: 'Student has no phone number on file.' });
            const msgText = interpolate(tmpl.bodyText, vars);
            const whatsappUrl = `https://wa.me/${vars.intl_phone}?text=${encodeURIComponent(msgText)}`;
            return res.json({ success: true, channel: 'WHATSAPP', whatsappUrl, phone: vars.intl_phone, message: 'WhatsApp link generated' });
        }

        return res.status(400).json({ error: `Unknown channel: ${channel}` });
    } catch (err) {
        console.error('sendReminder error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAll, getOne, create, update, remove, sendReminder };
