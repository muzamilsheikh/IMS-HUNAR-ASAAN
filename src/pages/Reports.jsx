import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { 
    FileText, Download, Calendar, DollarSign, TrendingUp, Users, 
    ArrowUpRight, ArrowDownRight, Wallet, Filter, X, CheckCircle,
    Clock, BarChart3, PieChart, Activity
} from 'lucide-react';
import apiClient from '../utils/api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const Reports = () => {
   const { financialStats, batches } = useApp();
   const [reportType, setReportType] = useState('monthly'); // monthly, yearly, custom
   const [reportScope, setReportScope] = useState('financial'); // financial, students
   const [selectedBatchId, setSelectedBatchId] = useState('all');
   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    });
   const [generatingReport, setGeneratingReport] = useState(false);
   const [reportData, setReportData] = useState(null);

   const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

   const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

   const handleGenerateReport = async () => {
       setGeneratingReport(true);
        try {
            let startDate, endDate;

           if (reportType === 'monthly') {
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0);
            } else if (reportType === 'yearly') {
                startDate = new Date(selectedYear, 0, 1);
                endDate = new Date(selectedYear, 11, 31);
            } else {
                startDate = new Date(customDateRange.startDate);
                endDate = new Date(customDateRange.endDate);
            }

            // Fetch data from API
           const response = await apiClient.getReports(startDate.toISOString(), endDate.toISOString(), selectedBatchId);
            
           if (response.success) {
               const batchObj = selectedBatchId === 'all' 
                   ? null 
                   : batches?.find(b => b.id.toString() === selectedBatchId.toString());

               setReportData({
                    ...response.data,
                    period: {
                        startDate,
                        endDate,
                        type: reportType,
                        batchName: batchObj ? batchObj.name : 'All Batches'
                    }
                });
            }
        } catch (error) {
           console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
           setGeneratingReport(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!reportData) return;

        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = pdf.internal.pageSize.getWidth();   // 210mm
            const LINE = 7;   // standard line height mm
            let y = 15;       // current Y cursor

            const fmt = (v) => `Rs. ${new Intl.NumberFormat('en-PK').format(v || 0)}`;

            const periodLabel = reportData.period?.type === 'monthly'
                ? `${months[selectedMonth]} ${selectedYear}`
                : reportData.period?.type === 'yearly'
                    ? `Year ${selectedYear}`
                    : `${reportData.period?.startDate} to ${reportData.period?.endDate}`;

            const batchLabel = reportData.period?.batchName && reportData.period.batchName !== 'All Batches'
                ? ` | ${reportData.period.batchName}` : '';

            const checkPageSpace = (needed) => {
                if (y + needed > 270) {
                    pdf.addPage();
                    y = 15;
                    return true;
                }
                return false;
            };

            if (reportScope === 'students') {
                // ==========================================
                // MODE A: Students Report Only
                // ==========================================
                pdf.setFillColor(99, 102, 241);   // Indigo-500
                pdf.rect(0, 0, W, 28, 'F');

                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.text('Hunar Asaan CRM — Student Enrollment Report', 14, 12);

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Period: ${periodLabel}${batchLabel}`, 14, 20);
                pdf.text(`Generated: ${new Date().toLocaleString()}`, W - 14, 20, { align: 'right' });

                y = 38;

                if (reportData.students && reportData.students.length > 0) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(11);
                    pdf.setTextColor(30, 30, 30);
                    pdf.text(`Student Directory Details (${reportData.students.length} Records)`, 14, y);
                    y += 4;

                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.3);
                    pdf.line(14, y, W - 14, y);
                    y += 5;

                    const cols = [14, 56, 84, 134, 158, 180];
                    const headers = ['Student Name / ID', 'Contact', 'Course & Batch', 'Enrollment', 'Fee Status', 'Pending'];
                    
                    pdf.setFillColor(99, 102, 241);
                    pdf.rect(14, y - 4, W - 28, 8, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8);
                    
                    headers.forEach((h, i) => {
                        const align = i === 5 ? 'right' : 'left';
                        const x = i === 5 ? cols[i] + 16 : cols[i];
                        pdf.text(h, x, y + 1, { align });
                    });
                    y += 7;

                    reportData.students.forEach((s, idx) => {
                        if (y > 270) { pdf.addPage(); y = 15; }

                        if (idx % 2 === 0) {
                            pdf.setFillColor(248, 249, 255);
                            pdf.rect(14, y - 4, W - 28, 7, 'F');
                        }

                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(8);
                        pdf.setTextColor(30, 30, 30);
                        pdf.text(String(s.name || '').substring(0, 22), cols[0], y - 1);
                        
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(7);
                        pdf.setTextColor(120, 120, 120);
                        pdf.text(String(s.code || 'N/A'), cols[0], y + 2.2);

                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(7.5);
                        pdf.setTextColor(80, 80, 80);
                        pdf.text(String(s.phone || 'N/A'), cols[1], y + 0.5);

                        pdf.text(String(s.course || '').substring(0, 24), cols[2], y + 0.5);

                        pdf.text(String(s.enrollmentStatus || 'Enrolled'), cols[3], y + 0.5);

                        if (s.feeStatus === 'Paid') {
                            pdf.setTextColor(39, 174, 96);
                        } else if (s.feeStatus === 'Partial') {
                            pdf.setTextColor(217, 119, 6);
                        } else {
                            pdf.setTextColor(231, 76, 60);
                        }
                        pdf.text(String(s.feeStatus || 'Unpaid'), cols[4], y + 0.5);

                        pdf.setTextColor(30, 30, 30);
                        pdf.text(fmt(s.pending), cols[5] + 16, y + 0.5, { align: 'right' });

                        y += LINE;
                    });
                } else {
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(10);
                    pdf.setTextColor(120, 120, 120);
                    pdf.text('No student records found for the selected period.', 14, y);
                }
            } else {
                // ==========================================
                // MODE B: Complete Financial Audit Report
                // ==========================================
                pdf.setFillColor(79, 70, 229);   // Indigo-600
                pdf.rect(0, 0, W, 28, 'F');

                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.text('Hunar Asaan CRM — Complete Financial Audit Report', 14, 12);

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Period: ${periodLabel}${batchLabel}`, 14, 20);
                pdf.text(`Generated: ${new Date().toLocaleString()}`, W - 14, 20, { align: 'right' });

                y = 38;

                // 1. Executive Summary Cards
                const metrics = [
                    { label: 'Revenue', value: reportData.totalRevenue, r: 39, g: 174, b: 96 },
                    { label: 'Expenses', value: reportData.totalExpenses, r: 231, g: 76, b: 60 },
                    { label: 'Payouts', value: reportData.partnerPayouts || 0, r: 217, g: 119, b: 6 },
                    { label: 'Net Profit', value: reportData.netProfit, r: (reportData.netProfit >= 0 ? 39 : 231), g: (reportData.netProfit >= 0 ? 174 : 76), b: (reportData.netProfit >= 0 ? 96 : 60) }
                ];

                const boxW = (W - 28) / 4;
                metrics.forEach((m, i) => {
                    const x = 14 + i * (boxW + 4);
                    pdf.setFillColor(248, 250, 252);
                    pdf.roundedRect(x, y, boxW, 20, 2, 2, 'F');
                    pdf.setDrawColor(m.r, m.g, m.b);
                    pdf.setLineWidth(0.4);
                    pdf.roundedRect(x, y, boxW, 20, 2, 2, 'S');

                    pdf.setTextColor(m.r, m.g, m.b);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(6.5);
                    pdf.text(m.label.toUpperCase(), x + boxW / 2, y + 6, { align: 'center' });

                    pdf.setFontSize(8.5);
                    pdf.text(fmt(m.value), x + boxW / 2, y + 14, { align: 'center' });
                });

                y += 28;

                // 2. Financial Summary Rows
                pdf.setTextColor(30, 30, 30);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.text('Executive Overview & Bottomline P&L', 14, y);
                y += 4;

                pdf.setDrawColor(200, 200, 200);
                pdf.setLineWidth(0.2);
                pdf.line(14, y, W - 14, y);
                y += 5;

                const summaryRows = [
                    { label: 'Total Revenue (Collected)', value: reportData.totalRevenue, color: [39, 174, 96] },
                    { label: 'Logged Operational Expenses', value: reportData.totalExpenses, color: [231, 76, 60] },
                    { label: 'Partner & Trainer Commission Share', value: reportData.partnerPayouts || 0, color: [217, 119, 6] },
                    { label: 'Net Realized Income', value: reportData.netProfit, color: reportData.netProfit >= 0 ? [39, 174, 96] : [231, 76, 60] },
                    { label: 'Pending Fees (Recovery Pipeline)', value: reportData.totalPending, color: [100, 116, 139] }
                ];

                summaryRows.forEach((row) => {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(60, 60, 60);
                    pdf.text(row.label, 16, y);

                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(...row.color);
                    pdf.text(fmt(row.value), W - 14, y, { align: 'right' });

                    y += LINE;
                });

                const grossVal = (reportData.totalRevenue || 0) + (reportData.totalPending || 0);
                pdf.setFillColor(238, 242, 255);
                pdf.roundedRect(14, y - 5, W - 28, 8, 1, 1, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(99, 102, 241);
                pdf.text('TOTAL GROSS BUSINESS PORTFOLIO VALUE', 16, y);
                pdf.text(fmt(grossVal), W - 14, y, { align: 'right' });
                y += 15;

                // 3. Batch Breakdown Section
                if (reportData.batchBreakdown && reportData.batchBreakdown.length > 0) {
                    checkPageSpace(45);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 30, 30);
                    pdf.text('Batch Financial Performance Breakdown', 14, y);
                    y += 4;
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(14, y, W - 14, y);
                    y += 5;

                    const cols = [14, 52, 92, 122, 152, 178];
                    const headers = ['Batch Name', 'Course Target', 'Collections', 'Expenses', 'Partner Share', 'Net Balance'];
                    
                    pdf.setFillColor(79, 70, 229);
                    pdf.rect(14, y - 4, W - 28, 7, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7.5);
                    headers.forEach((h, i) => {
                        const align = i >= 2 ? 'right' : 'left';
                        const x = i >= 2 ? cols[i] + 18 : cols[i];
                        pdf.text(h, x, y + 0.8, { align });
                    });
                    y += 6;

                    reportData.batchBreakdown.forEach((bb, idx) => {
                        checkPageSpace(10);
                        if (idx % 2 === 0) {
                            pdf.setFillColor(248, 250, 252);
                            pdf.rect(14, y - 4, W - 28, 6, 'F');
                        }
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(7.5);
                        pdf.setTextColor(30, 30, 30);
                        pdf.text(String(bb.batchName).substring(0, 18), cols[0], y);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(String(bb.courseName).substring(0, 22), cols[1], y);
                        pdf.text(fmt(bb.collections), cols[2] + 18, y, { align: 'right' });
                        pdf.setTextColor(231, 76, 60);
                        pdf.text(fmt(bb.expenses), cols[3] + 18, y, { align: 'right' });
                        pdf.setTextColor(217, 119, 6);
                        pdf.text(fmt(bb.partnerShare), cols[4] + 18, y, { align: 'right' });
                        pdf.setTextColor(bb.netIncome >= 0 ? 39 : 231, bb.netIncome >= 0 ? 174 : 76, bb.netIncome >= 0 ? 96 : 60);
                        pdf.text(fmt(bb.netIncome), cols[5] + 18, y, { align: 'right' });
                        y += 6;
                    });
                    y += 8;
                }

                // 4. Operational Expenses Section
                if (reportData.itemizedExpenses && reportData.itemizedExpenses.length > 0) {
                    checkPageSpace(45);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 30, 30);
                    pdf.text('Itemized Operational Expenses Log', 14, y);
                    y += 4;
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(14, y, W - 14, y);
                    y += 5;

                    const cols = [14, 38, 92, 134, 180];
                    const headers = ['Date', 'Description / Vendor', 'Category', 'Target Scope', 'Amount'];
                    
                    pdf.setFillColor(79, 70, 229);
                    pdf.rect(14, y - 4, W - 28, 7, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7.5);
                    headers.forEach((h, i) => {
                        const align = i === 4 ? 'right' : 'left';
                        const x = i === 4 ? cols[i] + 16 : cols[i];
                        pdf.text(h, x, y + 0.8, { align });
                    });
                    y += 6;

                    reportData.itemizedExpenses.forEach((exp, idx) => {
                        checkPageSpace(10);
                        if (idx % 2 === 0) {
                            pdf.setFillColor(248, 250, 252);
                            pdf.rect(14, y - 4, W - 28, 6, 'F');
                        }
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(7.5);
                        pdf.setTextColor(30, 30, 30);
                        pdf.text(String(exp.date), cols[0], y);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(String(exp.description).substring(0, 28), cols[1], y);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(String(exp.category), cols[2], y);
                        const target = exp.batchName ? `Batch: ${exp.batchName}` : (exp.courseName ? `Course: ${exp.courseName}` : 'General');
                        pdf.text(target, cols[3], y);
                        pdf.setTextColor(231, 76, 60);
                        pdf.text(fmt(exp.amount), cols[4] + 16, y, { align: 'right' });
                        y += 6;
                    });
                    y += 8;
                }

                // 5. Commission Payouts Section
                if (reportData.commissionLedger && reportData.commissionLedger.length > 0) {
                    checkPageSpace(45);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 30, 30);
                    pdf.text('Partner & Trainer Payout Ledger', 14, y);
                    y += 4;
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(14, y, W - 14, y);
                    y += 5;

                    const cols = [14, 52, 98, 180];
                    const headers = ['Partner / Trainer Name', 'Agreement Target Scope', 'Payout Structure', 'Calculated Share'];
                    
                    pdf.setFillColor(79, 70, 229);
                    pdf.rect(14, y - 4, W - 28, 7, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7.5);
                    headers.forEach((h, i) => {
                        const align = i === 3 ? 'right' : 'left';
                        const x = i === 3 ? cols[i] + 16 : cols[i];
                        pdf.text(h, x, y + 0.8, { align });
                    });
                    y += 6;

                    reportData.commissionLedger.forEach((cl, idx) => {
                        checkPageSpace(10);
                        if (idx % 2 === 0) {
                            pdf.setFillColor(248, 250, 252);
                            pdf.rect(14, y - 4, W - 28, 6, 'F');
                        }
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(7.5);
                        pdf.setTextColor(30, 30, 30);
                        pdf.text(String(cl.partnerName), cols[0], y);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(String(cl.targetName), cols[1], y);
                        pdf.text(String(cl.rateDisplay), cols[2], y);
                        pdf.setTextColor(217, 119, 6);
                        pdf.text(fmt(cl.calculatedAmount), cols[3] + 16, y, { align: 'right' });
                        y += 6;
                    });
                }
            }

            // Footer rendering on all pages
            const totalPages = pdf.internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                pdf.setPage(p);
                pdf.setFontSize(8);
                pdf.setTextColor(160, 160, 160);
                pdf.setFont('helvetica', 'italic');
                const footerText = reportScope === 'students' 
                    ? 'Hunar Asaan CRM — Confidential Student Registry Report' 
                    : 'Hunar Asaan CRM — Confidential Financial Audit Report';
                pdf.text(footerText, 14, 290);
                pdf.text(`Page ${p} of ${totalPages}`, W - 14, 290, { align: 'right' });
            }

            const fileScope = reportScope === 'students' ? 'Student_Registry' : 'Financial_Audit';
            const filePeriod = reportData.period?.type === 'monthly'
                ? `${months[selectedMonth]}_${selectedYear}`
                : reportData.period?.type === 'yearly'
                    ? `Year_${selectedYear}`
                    : `${reportData.period?.startDate}_to_${reportData.period?.endDate}`;

            pdf.save(`Hunar_Asaan_${fileScope}_${filePeriod}.pdf`);
            console.log('✅ PDF saved successfully');

        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            alert(`Failed to generate PDF: ${error.message}`);
        }
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        
        const wb = XLSX.utils.book_new();

        if (reportScope === 'students') {
            const studentsData = reportData.students ? reportData.students.map(s => ({
                "Student ID": s.code || '',
                "Full Name": s.name || '',
                "Contact Number": s.phone || '',
                "Assigned Course": s.course || '',
                "Enrollment Status": s.enrollmentStatus || 'Enrolled',
                "Fee Status": s.feeStatus || 'Unpaid',
                "Pending Amount (PKR)": s.pending || 0
            })) : [];
            
            const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
            XLSX.utils.book_append_sheet(wb, studentsSheet, "Student Registry");
        } else {
            // Overview Summary
            const summaryData = [
                ["Executive Overview Summary", ""],
                ["Description", "Amount (Rs.)"],
                ["Total Revenue (Collected Collections)", reportData.totalRevenue || 0],
                ["Logged Operational Expenses", reportData.totalExpenses || 0],
                ["Partner & Trainer Commission Payouts", reportData.partnerPayouts || 0],
                ["Net Realized Profit", reportData.netProfit || 0],
                ["Pending Fees (Recovery Pipeline)", reportData.totalPending || 0]
            ];
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summarySheet, "Overview Summary");

            // Batch Breakdown
            const batchData = reportData.batchBreakdown ? reportData.batchBreakdown.map(bb => ({
                "Batch Name": bb.batchName || '',
                "Course Name": bb.courseName || '',
                "Collections": bb.collections || 0,
                "Operational Expenses": bb.expenses || 0,
                "Partner/Trainer Share": bb.partnerShare || 0,
                "Net Realized Balance": bb.netIncome || 0
            })) : [];
            const batchSheet = XLSX.utils.json_to_sheet(batchData);
            XLSX.utils.book_append_sheet(wb, batchSheet, "Batch Breakdown");

            // Itemized Expenses
            const expensesData = reportData.itemizedExpenses ? reportData.itemizedExpenses.map(exp => ({
                "Date": exp.date || '',
                "Description": exp.description || '',
                "Category": exp.category || '',
                "Target Scope": exp.batchName ? `Batch: ${exp.batchName}` : (exp.courseName ? `Course: ${exp.courseName}` : 'General'),
                "Amount": exp.amount || 0
            })) : [];
            const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
            XLSX.utils.book_append_sheet(wb, expensesSheet, "Operational Expenses");

            // Commission Ledger
            const commissionData = reportData.commissionLedger ? reportData.commissionLedger.map(cl => ({
                "Partner / Trainer Name": cl.partnerName || '',
                "Agreement Target Scope": cl.targetName || '',
                "Payout Structure": cl.rateDisplay || '',
                "Calculated Share": cl.calculatedAmount || 0
            })) : [];
            const commissionSheet = XLSX.utils.json_to_sheet(commissionData);
            XLSX.utils.book_append_sheet(wb, commissionSheet, "Commission Ledger");

            // Student Details
            const studentsData = reportData.students ? reportData.students.map(s => ({
                "Student ID": s.code || '',
                "Student Name": s.name || '',
                "Course": s.course || '',
                "Total Fee": s.totalFee || 0,
                "Paid": s.paid || 0,
                "Pending": s.pending || 0
            })) : [];
            const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
            XLSX.utils.book_append_sheet(wb, studentsSheet, "Student Details");
        }

        const fileScope = reportScope === 'students' ? 'Student_Registry' : 'Financial_Audit';
        XLSX.writeFile(wb, `Hunar_Asaan_${fileScope}_${reportData.period.startDate}_to_${reportData.period.endDate}.xlsx`);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PK').format(value || 0);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Financial Reports</h2>
                    <p className="text-slate-400 mt-1 font-medium">Generate comprehensive accounts reports in PDF format.</p>
                </div>
            </div>

            {/* Report Configuration Card */}
            <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <Filter size={20} className="text-secondary" />
                    <h3 className="text-lg font-black text-slate-800">Report Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {/* Report Scope Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Report Scope</label>
                        <select 
                            value={reportScope} 
                            onChange={(e) => setReportScope(e.target.value)}
                            className="input-field"
                        >
                            <option value="financial">Complete Financial Audit</option>
                            <option value="students">Students Report Only</option>
                        </select>
                    </div>

                    {/* Report Type Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Report Type</label>
                        <select 
                            value={reportType} 
                            onChange={(e) => setReportType(e.target.value)}
                            className="input-field"
                        >
                            <option value="monthly">Monthly Report</option>
                            <option value="yearly">Yearly Report</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Batch Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Batch</label>
                        <select 
                            value={selectedBatchId} 
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="input-field"
                        >
                            <option value="all">All Batches</option>
                            {batches?.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Selection */}
                    {reportType === 'monthly' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Month</label>
                                <select 
                                    value={selectedMonth} 
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="input-field"
                                >
                                    {months.map((month, index) => (
                                        <option key={month} value={index}>{month}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Year</label>
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="input-field"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Year Selection */}
                    {reportType === 'yearly' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Year</label>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="input-field"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Custom Date Range */}
                    {reportType === 'custom' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Start Date</label>
                                <input 
                                    type="date" 
                                    value={customDateRange.startDate}
                                    onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                                    className="input-field"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">End Date</label>
                                <input 
                                    type="date" 
                                    value={customDateRange.endDate}
                                    onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                                    className="input-field"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="btn-secondary flex items-center gap-2 px-6"
                    >
                        {generatingReport ? (
                            <>
                                <Clock size={18} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <BarChart3 size={18} />
                                Generate Report
                            </>
                        )}
                    </button>

                    {reportData && (
                        <>
                            <button 
                                onClick={handleDownloadPDF}
                                className="btn-primary flex items-center gap-2 px-6"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                            <button 
                                onClick={handleExportExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black uppercase transition-all shadow-md"
                            >
                                <Download size={18} />
                                Export Excel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Report Preview */}
            {reportData && (
                <motion.div 
                    id="report-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 bg-slate-50 p-2 sm:p-4 rounded-xl"
                >
                    {/* Report Header */}
                    <div className="glass-card p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">
                                    {reportType === 'monthly' && `${months[selectedMonth]} ${selectedYear}`}
                                    {reportType === 'yearly' && `Year ${selectedYear}`}
                                    {reportType === 'custom' && 'Custom Period'}
                                    {reportData.period?.batchName && reportData.period.batchName !== 'All Batches' && ` - ${reportData.period.batchName}`}
                                </h3>
                                <p className="text-white/80 text-sm mt-1 font-medium">
                                    {reportData.period?.startDate?.toLocaleDateString()} - {reportData.period?.endDate?.toLocaleDateString()}
                                </p>
                            </div>
                            <FileText size={48} className="text-white/20" />
                        </div>
                    </div>

                    {/* Conditional Scope Previews */}
                    {reportScope === 'students' ? (
                        // ==========================================
                        // MODE A Preview: Students Report Only
                        // ==========================================
                        <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl space-y-6">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-secondary" />
                                <h3 className="text-lg font-black text-slate-800">Student Registry Directory ({reportData.students.length} Records)</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student ID / Name</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Number</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned Course</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Enrollment Status</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fee Status</th>
                                            <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Fee</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.students.map((student, index) => (
                                            <tr key={student.id || index} className="border-b border-slate-50 hover:bg-slate-50">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{student.name}</p>
                                                        <p className="text-[10px] text-slate-400">{student.code}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-600 font-bold">{student.phone}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600">{student.course}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                                                        student.enrollmentStatus === 'Active' || student.enrollmentStatus === 'Settled' || student.enrollmentStatus === 'Enrolled'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {student.enrollmentStatus}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                                                        student.feeStatus === 'Paid'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : student.feeStatus === 'Partial'
                                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                        {student.feeStatus}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-slate-800">Rs. {new Intl.NumberFormat('en-PK').format(student.pending || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        // ==========================================
                        // MODE B Preview: Complete Financial Audit
                        // ==========================================
                        <>
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard 
                                    title="Total Revenue" 
                                    value={`Rs. ${formatCurrency(reportData.totalRevenue)}`}
                                    icon={DollarSign}
                                    color="emerald"
                                />
                                <MetricCard 
                                    title="Total Expenses" 
                                    value={`Rs. ${formatCurrency(reportData.totalExpenses)}`}
                                    icon={Wallet}
                                    color="rose"
                                />
                                <MetricCard 
                                    title="Net Profit/Loss" 
                                    value={`Rs. ${formatCurrency(reportData.netProfit)}`}
                                    icon={TrendingUp}
                                    color={reportData.netProfit >= 0 ? 'emerald' : 'rose'}
                                />
                                <MetricCard 
                                    title="Gross Business Value" 
                                    value={`Rs. ${formatCurrency((reportData.totalRevenue || 0) + (reportData.totalPending || 0))}`}
                                    icon={Activity}
                                    color="indigo"
                                />
                            </div>

                            {/* Detailed Summary Table */}
                            <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <PieChart size={20} className="text-secondary" />
                                    <h3 className="text-lg font-black text-slate-800">Detailed Financial Summary</h3>
                                </div>

                                <div className="space-y-3">
                                    <SummaryRow label="Total Revenue (Collected)" value={reportData.totalRevenue} highlight />
                                    <SummaryRow label="Total Expenses" value={reportData.totalExpenses} negative />
                                    <SummaryRow label="Partner & Trainer Commission Payouts" value={reportData.partnerPayouts} negative />
                                    <SummaryRow label="Net Profit/Loss" value={reportData.netProfit} profit={reportData.netProfit >= 0} />
                                    <SummaryRow label="Pending Fees (Recovery Pipeline)" value={reportData.totalPending} warning />
                                    
                                    <div className="mt-6 pt-6 border-t-2 border-slate-200">
                                        <SummaryRow 
                                            label="TOTAL BUSINESS VALUE" 
                                            value={(reportData.totalRevenue || 0) + (reportData.totalPending || 0)}
                                            bold
                                            gradient
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Batch breakdown */}
                            {reportData.batchBreakdown && reportData.batchBreakdown.length > 0 && (
                                <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <FileText size={20} className="text-indigo-600" />
                                        <h3 className="text-lg font-black text-slate-800">Batch Financial Breakdown Ledger</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch Name</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned Course</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Collections</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Expenses</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Partner Share</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.batchBreakdown.map((bb, index) => (
                                                    <tr key={bb.batchId || index} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-bold text-slate-800">{bb.batchName}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{bb.courseName}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">Rs. {new Intl.NumberFormat('en-PK').format(bb.collections)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-rose-600">Rs. {new Intl.NumberFormat('en-PK').format(bb.expenses)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-amber-600">Rs. {new Intl.NumberFormat('en-PK').format(bb.partnerShare)}</td>
                                                        <td className="py-3 px-4 text-right font-black text-slate-800">Rs. {new Intl.NumberFormat('en-PK').format(bb.netIncome)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Itemized expenses log */}
                            {reportData.itemizedExpenses && reportData.itemizedExpenses.length > 0 && (
                                <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Wallet size={20} className="text-rose-500" />
                                        <h3 className="text-lg font-black text-slate-800">Itemized Operational Expenses Log</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Scope</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.itemizedExpenses.map((exp, index) => (
                                                    <tr key={exp.id || index} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="py-3 px-4 text-sm text-slate-600">{exp.date}</td>
                                                        <td className="py-3 px-4 font-bold text-slate-800">{exp.description}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{exp.category}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">
                                                            {exp.batchName ? `Batch: ${exp.batchName}` : (exp.courseName ? `Course: ${exp.courseName}` : 'General')}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-bold text-rose-600">Rs. {new Intl.NumberFormat('en-PK').format(exp.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Partner & Trainer commission Ledger */}
                            {reportData.commissionLedger && reportData.commissionLedger.length > 0 && (
                                <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Users size={20} className="text-amber-500" />
                                        <h3 className="text-lg font-black text-slate-800">Partner & Trainer Commission Ledger</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Partner Name</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Agreement Target Scope</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Payout Structure</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Calculated Share</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.commissionLedger.map((cl, index) => (
                                                    <tr key={cl.id || index} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-bold text-slate-800">{cl.partnerName}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{cl.targetName}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{cl.rateDisplay}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-amber-600">Rs. {new Intl.NumberFormat('en-PK').format(cl.calculatedAmount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Student Transactions details list */}
                            {reportData.students && reportData.students.length > 0 && (
                                <div className="glass-card p-6 bg-white border border-slate-100 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Users size={20} className="text-secondary" />
                                        <h3 className="text-lg font-black text-slate-800">Student Enrollment Ledger Details ({reportData.students.length})</h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student</th>
                                                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Course</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Fee</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Paid</th>
                                                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.students.map((student, index) => (
                                                    <tr key={student.id || index} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <p className="font-bold text-slate-800">{student.name}</p>
                                                                <p className="text-[10px] text-slate-400">{student.code}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{student.course}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-slate-800">Rs. {new Intl.NumberFormat('en-PK').format(student.totalFee || 0)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">Rs. {new Intl.NumberFormat('en-PK').format(student.paid || 0)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-rose-600">Rs. {new Intl.NumberFormat('en-PK').format(student.pending || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}

            {!reportData && !generatingReport && (
                <div className="text-center py-20">
                    <FileText size={64} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-lg">No Report Generated Yet</p>
                    <p className="text-slate-400 mt-2">Select a date range and click "Generate Report" to view financial data</p>
                </div>
            )}
        </div>
    );
};

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color }) => {
   const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    return (
        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border shadow-lg">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{title}</p>
            <p className="text-2xl font-black text-slate-800">{value}</p>
        </motion.div>
    );
};

// Summary Row Component
const SummaryRow = ({ label, value, highlight, negative, profit, warning, bold, gradient }) => {
    let valueClass = 'font-bold text-slate-800';
   if (highlight) valueClass = 'font-black text-secondary text-lg';
   if (negative) valueClass = 'font-bold text-rose-600';
   if (profit) valueClass = 'font-bold text-emerald-600';
   if (warning) valueClass = 'font-bold text-amber-600';
   if (bold) valueClass = 'font-black text-2xl';
   if (gradient) valueClass = 'font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent';

   const formattedValue = new Intl.NumberFormat('en-PK').format(value || 0);

    return (
        <div className={`flex justify-between items-center py-3 ${bold ? 'px-4 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200' : 'border-b border-slate-100'}`}>
            <span className={`${bold ? 'text-[10px] font-black text-indigo-600 uppercase tracking-widest' : 'text-slate-600'}`}>{label}</span>
            <span className={valueClass}>Rs. {formattedValue}</span>
        </div>
    );
};

export default Reports;
