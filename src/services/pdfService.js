const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

class PDFReportService {
  constructor() {
    this.companyName = process.env.COMPANY_NAME || 'De\'Aion Contractors';
    this.companyPhone1 = process.env.COMPANY_PHONE1 || '0242838007';
    this.companyPhone2 = process.env.COMPANY_PHONE2 || '0208936345';
    this.currency = process.env.COMPANY_CURRENCY || 'GHS';
  }

  async generateEstimateReport(estimateId, outputPath) {
    const doc = new PDFDocument({ margin: 50 });

    if (outputPath) {
      doc.pipe(fs.createWriteStream(outputPath));
    }

    const [estimateData] = await pool.execute(`
      SELECT e.*,
             s.name as site_name,
             s.location as site_location,
             s.budget_limit,
             u.username as created_by_username
      FROM estimates e
      LEFT JOIN sites s ON e.site_id = s.site_id
      LEFT JOIN users u ON e.created_by = u.user_id
      WHERE e.estimate_id = ?
    `, [estimateId]);

    if (estimateData.length === 0) {
      throw new Error('Estimate not found');
    }

    const estimate = estimateData[0];

    const [items] = await pool.execute(`
      SELECT ei.*,
             c.name as category_name
      FROM estimate_items ei
      LEFT JOIN categories c ON ei.category_id = c.category_id
      WHERE ei.estimate_id = ?
      ORDER BY c.sort_order, ei.item_id
    `, [estimateId]);

    this._addHeader(doc);
    this._addEstimateInfo(doc, estimate);
    this._addItemsTable(doc, items);
    this._addSummary(doc, items, estimate);
    this._addFooter(doc);

    doc.end();
    return doc;
  }

  async generateVarianceReport(siteId, outputPath) {
    const doc = new PDFDocument({ margin: 50 });

    if (outputPath) {
      doc.pipe(fs.createWriteStream(outputPath));
    }

    const [siteData] = await pool.execute(`
      SELECT s.*, COUNT(DISTINCT e.estimate_id) as estimate_count
      FROM sites s
      LEFT JOIN estimates e ON s.site_id = e.site_id
      WHERE s.site_id = ?
      GROUP BY s.site_id
    `, [siteId]);

    if (siteData.length === 0) {
      throw new Error('Site not found');
    }

    const site = siteData[0];

    const [varianceData] = await pool.execute(`
      SELECT
        e.title as estimate_title,
        ei.description as item_description,
        c.name as category_name,
        ei.total_estimated,
        ei.quantity as estimated_quantity,
        ei.unit_price as estimated_unit_price,
        ei.unit,
        COALESCE(SUM(a.total_actual), 0) as total_actual,
        COALESCE(SUM(a.actual_quantity), 0) as total_actual_quantity,
        COUNT(a.actual_id) as purchase_count,
        CASE
          WHEN SUM(a.actual_quantity) > 0
          THEN SUM(a.total_actual) / SUM(a.actual_quantity)
          ELSE 0
        END as weighted_avg_actual_price,
        CASE
          WHEN COALESCE(SUM(a.total_actual), 0) = 0 THEN 0
          ELSE COALESCE(SUM(a.total_actual), 0) - ei.total_estimated
        END as variance_amount,
        CASE
          WHEN COALESCE(SUM(a.total_actual), 0) = 0 OR ei.total_estimated = 0 THEN 0
          ELSE ((COALESCE(SUM(a.total_actual), 0) - ei.total_estimated) / ei.total_estimated) * 100
        END as variance_percentage,
        CASE
          WHEN COALESCE(SUM(a.total_actual), 0) = 0 THEN 'No Purchases'
          WHEN ABS(((COALESCE(SUM(a.total_actual), 0) - ei.total_estimated) / NULLIF(ei.total_estimated, 0)) * 100) < 1 THEN 'On Budget'
          WHEN (COALESCE(SUM(a.total_actual), 0) - ei.total_estimated) > 0 THEN 'Over Budget'
          ELSE 'Under Budget'
        END as variance_status
      FROM estimates e
      JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
      JOIN categories c ON ei.category_id = c.category_id
      LEFT JOIN actuals a ON ei.item_id = a.item_id
      WHERE e.site_id = ?
      GROUP BY e.estimate_id, ei.item_id, e.title, ei.description, c.name, ei.total_estimated, ei.quantity, ei.unit_price, ei.unit, c.sort_order
      ORDER BY ABS(variance_percentage) DESC, c.sort_order
    `, [siteId]);

    this._addHeader(doc);
    this._addVarianceInfo(doc, site);
    this._addVarianceTable(doc, varianceData);
    this._addVarianceSummary(doc, varianceData);
    this._addFooter(doc);

    doc.end();
    return doc;
  }

  async generateSiteReport(siteId, outputPath) {
    const doc = new PDFDocument({ margin: 50 });

    if (outputPath) {
      doc.pipe(fs.createWriteStream(outputPath));
    }

    const [siteData] = await pool.execute(`
      SELECT s.*,
             u.username as created_by_username,
             COUNT(DISTINCT e.estimate_id) as estimate_count,
             SUM(e.total_estimated) as total_estimated_value
      FROM sites s
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN estimates e ON s.site_id = e.site_id
      WHERE s.site_id = ?
      GROUP BY s.site_id
    `, [siteId]);

    if (siteData.length === 0) {
      throw new Error('Site not found');
    }

    const site = siteData[0];

    const [estimates] = await pool.execute(`
      SELECT e.*,
             COUNT(DISTINCT ei.item_id) as item_count,
             SUM(ei.total_estimated) as calculated_total,
             COUNT(DISTINCT a.actual_id) as total_purchases,
             COALESCE(SUM(a.total_actual), 0) as total_actual_spent
      FROM estimates e
      LEFT JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
      LEFT JOIN actuals a ON ei.item_id = a.item_id
      WHERE e.site_id = ?
      GROUP BY e.estimate_id
      ORDER BY e.date_created DESC
    `, [siteId]);

    this._addHeader(doc);
    this._addSiteInfo(doc, site);
    this._addEstimatesTable(doc, estimates);
    this._addSiteSummary(doc, site, estimates);
    this._addFooter(doc);

    doc.end();
    return doc;
  }

  _addHeader(doc) {
    doc.fontSize(20)
       .fillColor('#333333')
       .text(this.companyName, 50, 50, { align: 'center' });

    doc.fontSize(12)
       .text(`Phone: ${this.companyPhone1} / ${this.companyPhone2}`, 50, 75, { align: 'center' });

    doc.moveTo(50, 100)
       .lineTo(550, 100)
       .stroke();

    doc.moveDown(2);
  }

  _addEstimateInfo(doc, estimate) {
    const currentY = doc.y;

    doc.fontSize(16)
       .fillColor('#333333')
       .text('ESTIMATE REPORT', 50, currentY, { align: 'center' });

    doc.moveDown(1);

    const infoY = doc.y;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Estimate ID: ${estimate.estimate_id}`, 50, infoY)
       .text(`Title: ${estimate.title}`, 50, infoY + 20)
       .text(`Site: ${estimate.site_name}`, 50, infoY + 40)
       .text(`Location: ${estimate.site_location || 'N/A'}`, 50, infoY + 60)
       .text(`Date Created: ${new Date(estimate.date_created).toLocaleDateString()}`, 350, infoY)
       .text(`Status: ${estimate.status.toUpperCase()}`, 350, infoY + 20)
       .text(`Created By: ${estimate.created_by_username || 'N/A'}`, 350, infoY + 40);

    doc.y = infoY + 80;
    doc.moveDown(1);
  }

  _addItemsTable(doc, items) {
    const tableTop = doc.y;
    const rowHeight = 25;
    const leftX = 50;
    const tableWidth = 500;

    // Column definition: width must sum to tableWidth
    const columns = [
      { key: 'description', label: 'Description', width: 125, align: 'left' },
      { key: 'category_name', label: 'Category', width: 85, align: 'left' },
      { key: 'quantity', label: 'Quantity', width: 55, align: 'right' },
      { key: 'unit', label: 'Unit', width: 45, align: 'center' },
      { key: 'unit_price', label: `Unit Price (${this.currency})`, width: 90, align: 'right' },
      { key: 'total_estimated', label: `Total Amount (${this.currency})`, width: 100, align: 'left' }
    ];

    doc.fontSize(14)
       .fillColor('#333333')
       .text('ESTIMATE ITEMS', leftX, tableTop);

    const headerY = tableTop + 30;
    doc.rect(leftX, headerY, tableWidth, rowHeight).fillAndStroke('#f0f0f0', '#cccccc');

    // Header row
    doc.fontSize(10).fillColor('#000000');
    let x = leftX + 5;
    columns.forEach(col => {
      doc.text(col.label, x, headerY + 8, { width: col.width - 10, align: col.align });
      x += col.width;
    });

    let currentY = headerY + rowHeight;
    const pageBottom = doc.page.height - 50; // margin bottom

    items.forEach((item, index) => {
      // Page break
      if (currentY + rowHeight > pageBottom) {
        doc.addPage();
        // redraw header on new page
        const newHeaderY = 50;
        doc.rect(leftX, newHeaderY, tableWidth, rowHeight).fillAndStroke('#f0f0f0', '#cccccc');
        doc.fontSize(10).fillColor('#000000');
        let hx = leftX + 5;
        columns.forEach(col => {
          doc.text(col.label, hx, newHeaderY + 6, { width: col.width - 10, align: col.align });
          hx += col.width;
        });
        currentY = newHeaderY + rowHeight;
      }

      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
      doc.rect(leftX, currentY, tableWidth, rowHeight).fillAndStroke(bgColor, '#dddddd');


      // Row cells
      doc.fontSize(9).fillColor('#000000');
      let cx = leftX + 5;
      columns.forEach(col => {
        let value = item[col.key];
        if (col.key === 'description') value = this._truncateText(String(value || ''), 40);
        if (col.key === 'quantity') value = (value ?? 0).toString();
        if (col.key === 'unit_price' || col.key === 'total_estimated') {
          value = this._formatNumber(value);
        }
        doc.text(String(value ?? ''), cx, currentY + 8, { width: col.width - 10, align: col.align });
        cx += col.width;
      });

      currentY += rowHeight;
    });

    doc.y = currentY + 10;
  }

  _addSummary(doc, items, estimate) {
    const totalEstimated = items.reduce((sum, item) => sum + parseFloat(item.total_estimated), 0);
    const totalItems = items.length;
    const budgetLimit = parseFloat(estimate.budget_limit) || 0;
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category_name] = (acc[item.category_name] || 0) + 1;
      return acc;
    }, {});

    const summaryY = doc.y;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('ESTIMATE SUMMARY', 50, summaryY);

    const detailsY = summaryY + 30;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Total Items: ${totalItems}`, 50, detailsY)
       .text(`Total Estimated Budget: ${this.currency} ${this._formatNumber(totalEstimated)}`, 50, detailsY + 20)
       .text(`Average Cost per Item: ${this.currency} ${this._formatNumber(totalEstimated / totalItems)}`, 50, detailsY + 40);

    // Budget analysis
    if (budgetLimit > 0) {
      const budgetUsage = (totalEstimated / budgetLimit) * 100;
      const budgetStatus = budgetUsage > 100 ? 'OVER BUDGET' :
                          budgetUsage === 100 ? 'EXACTLY ON BUDGET' :
                          budgetUsage >= 90 ? 'NEAR BUDGET LIMIT' : 'WITHIN BUDGET';
      const statusColor = budgetUsage > 100 ? '#ff0000' :
                         budgetUsage >= 90 ? '#ff8800' : '#008000';

      doc.fontSize(12)
         .fillColor('#000000')
         .text(`Site Budget Limit: ${this.currency} ${this._formatNumber(budgetLimit)}`, 50, detailsY + 70)
         .text(`Budget Usage: ${budgetUsage.toFixed(1)}%`, 50, detailsY + 90);

      doc.fillColor(statusColor)
         .text(`Status: ${budgetStatus}`, 50, detailsY + 110);

      if (budgetUsage > 100) {
        const overage = totalEstimated - budgetLimit;
        doc.fillColor('#ff0000')
           .text(`Amount Over Budget: ${this.currency} ${this._formatNumber(overage)}`, 50, detailsY + 130);
      } else if (budgetUsage < 100) {
        const remaining = budgetLimit - totalEstimated;
        doc.fillColor('#008000')
           .text(`Remaining Budget: ${this.currency} ${this._formatNumber(remaining)}`, 50, detailsY + 130);
      }
    }

    // Category breakdown
    let categoryY = budgetLimit > 0 ? detailsY + 160 : detailsY + 70;
    doc.fontSize(12)
       .fillColor('#333333')
       .text('CATEGORY BREAKDOWN:', 50, categoryY);

    categoryY += 20;
    doc.fontSize(10).fillColor('#000000');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      doc.text(`${category}: ${count} items`, 50, categoryY);
      categoryY += 15;
    });

    doc.y = categoryY + 20;
  }

  _addVarianceInfo(doc, site) {
    const currentY = doc.y;

    doc.fontSize(16)
       .fillColor('#333333')
       .text('VARIANCE ANALYSIS REPORT', 50, currentY, { align: 'center' });

    doc.moveDown(1);

    const infoY = doc.y;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Site ID: ${site.site_id}`, 50, infoY)
       .text(`Site Name: ${site.name}`, 50, infoY + 20)
       .text(`Location: ${site.location || 'N/A'}`, 50, infoY + 40)
       .text(`Status: ${site.status.toUpperCase()}`, 350, infoY)
       .text(`Estimates: ${site.estimate_count}`, 350, infoY + 20)
       .text(`Report Date: ${new Date().toLocaleDateString()}`, 350, infoY + 40);

    doc.y = infoY + 60;
    doc.moveDown(1);
  }

  _addVarianceTable(doc, varianceData) {
    const tableTop = doc.y;
    const itemHeight = 20;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('VARIANCE DETAILS', 50, tableTop);

    const headerY = tableTop + 30;

    doc.rect(50, headerY, 500, itemHeight)
       .fillAndStroke('#f0f0f0', '#cccccc');

    doc.fontSize(10)
       .fillColor('#000000')
       .text('Item', 55, headerY + 5)
       .text('Category', 140, headerY + 5)
       .text('Batches', 190, headerY + 5)
       .text('Estimated', 230, headerY + 5)
       .text('Actual', 290, headerY + 5)
       .text('Variance', 350, headerY + 5)
       .text('Variance %', 410, headerY + 5)
       .text('Status', 470, headerY + 5);

    let currentY = headerY + itemHeight;

    varianceData.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';

      doc.rect(50, currentY, 500, itemHeight)
         .fillAndStroke(bgColor, '#dddddd');

      const statusColor = item.variance_status === 'Over Budget' ? '#ff0000' :
                         item.variance_status === 'Under Budget' ? '#008000' : '#000000';

      doc.fontSize(9)
         .fillColor('#000000')
         .text(this._truncateText(item.item_description, 18), 55, currentY + 5)
         .text(this._truncateText(item.category_name, 10), 140, currentY + 5)
         .text(item.purchase_count || '0', 190, currentY + 5)
         .text(`${this.currency}${this._formatNumber(item.total_estimated)}`, 230, currentY + 5)
         .text(`${this.currency}${this._formatNumber(item.total_actual)}`, 290, currentY + 5)
         .text(`${this.currency}${this._formatNumber(item.variance_amount)}`, 350, currentY + 5)
         .text(`${this._formatNumber(item.variance_percentage, 1)}%`, 410, currentY + 5);

      doc.fillColor(statusColor)
         .text(this._truncateText(item.variance_status, 12), 470, currentY + 5);

      currentY += itemHeight;
    });

    doc.y = currentY + 10;
  }

  _addVarianceSummary(doc, varianceData) {
    const totalEstimated = varianceData.reduce((sum, item) => sum + parseFloat(item.total_estimated), 0);
    const totalActual = varianceData.reduce((sum, item) => sum + parseFloat(item.total_actual), 0);
    const totalVariance = varianceData.reduce((sum, item) => sum + parseFloat(item.variance_amount), 0);

    const overBudgetCount = varianceData.filter(item => item.variance_status === 'Over Budget').length;
    const underBudgetCount = varianceData.filter(item => item.variance_status === 'Under Budget').length;
    const onBudgetCount = varianceData.filter(item => item.variance_status === 'On Budget').length;
    const noPurchasesCount = varianceData.filter(item => item.variance_status === 'No Purchases').length;
    const totalPurchases = varianceData.reduce((sum, item) => sum + parseInt(item.purchase_count || 0), 0);

    const summaryY = doc.y;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('VARIANCE SUMMARY', 50, summaryY);

    const detailsY = summaryY + 30;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Total Items: ${varianceData.length}`, 50, detailsY)
       .text(`Total Purchase Batches: ${totalPurchases}`, 50, detailsY + 20)
       .text(`Items with No Purchases: ${noPurchasesCount}`, 50, detailsY + 40)
       .text(`Over Budget Items: ${overBudgetCount}`, 50, detailsY + 60)
       .text(`Under Budget Items: ${underBudgetCount}`, 50, detailsY + 80)
       .text(`On Budget Items: ${onBudgetCount}`, 50, detailsY + 100)
       .text(`Total Estimated: ${this.currency} ${this._formatNumber(totalEstimated)}`, 300, detailsY)
       .text(`Total Actual: ${this.currency} ${this._formatNumber(totalActual)}`, 300, detailsY + 20)
       .text(`Total Variance: ${this.currency} ${this._formatNumber(totalVariance)}`, 300, detailsY + 40);

    doc.y = detailsY + 120;
  }

  _addSiteInfo(doc, site) {
    const currentY = doc.y;

    doc.fontSize(16)
       .fillColor('#333333')
       .text('SITE REPORT', 50, currentY, { align: 'center' });

    doc.moveDown(1);

    const infoY = doc.y;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Site ID: ${site.site_id}`, 50, infoY)
       .text(`Name: ${site.name}`, 50, infoY + 20)
       .text(`Location: ${site.location || 'N/A'}`, 50, infoY + 40)
       .text(`Start Date: ${site.start_date ? new Date(site.start_date).toLocaleDateString() : 'N/A'}`, 50, infoY + 60)
       .text(`Status: ${site.status.toUpperCase()}`, 350, infoY)
       .text(`Estimates: ${site.estimate_count}`, 350, infoY + 20)
       .text(`Total Value: ${this.currency} ${this._formatNumber(site.total_estimated_value || 0)}`, 350, infoY + 40)
       .text(`Budget Limit: ${site.budget_limit ? this.currency + ' ' + this._formatNumber(site.budget_limit) : 'N/A'}`, 350, infoY + 60);

    doc.y = infoY + 80;
    doc.moveDown(1);
  }

  _addEstimatesTable(doc, estimates) {
    const tableTop = doc.y;
    const itemHeight = 20;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('ESTIMATES', 50, tableTop);

    const headerY = tableTop + 30;

    doc.rect(50, headerY, 500, itemHeight)
       .fillAndStroke('#f0f0f0', '#cccccc');

    doc.fontSize(10)
       .fillColor('#000000')
       .text('Title', 55, headerY + 5)
       .text('Date Created', 170, headerY + 5)
       .text('Status', 260, headerY + 5)
       .text('Items', 310, headerY + 5)
       .text('Purchases', 350, headerY + 5)
       .text('Estimated', 400, headerY + 5)
       .text('Actual', 470, headerY + 5);

    let currentY = headerY + itemHeight;

    estimates.forEach((estimate, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';

      doc.rect(50, currentY, 500, itemHeight)
         .fillAndStroke(bgColor, '#dddddd');

      doc.fontSize(9)
         .fillColor('#000000')
         .text(this._truncateText(estimate.title, 22), 55, currentY + 5)
         .text(new Date(estimate.date_created).toLocaleDateString(), 170, currentY + 5)
         .text(estimate.status.toUpperCase(), 260, currentY + 5)
         .text(estimate.item_count.toString(), 310, currentY + 5)
         .text(estimate.total_purchases.toString(), 350, currentY + 5)
         .text(`${this.currency}${this._formatNumber(estimate.calculated_total || 0)}`, 400, currentY + 5)
         .text(`${this.currency}${this._formatNumber(estimate.total_actual_spent || 0)}`, 470, currentY + 5);

      currentY += itemHeight;
    });

    doc.y = currentY + 10;
  }

  _addSiteSummary(doc, site, estimates) {
    const totalEstimated = estimates.reduce((sum, est) => sum + parseFloat(est.calculated_total || 0), 0);
    const totalActual = estimates.reduce((sum, est) => sum + parseFloat(est.total_actual_spent || 0), 0);
    const totalPurchases = estimates.reduce((sum, est) => sum + parseInt(est.total_purchases || 0), 0);
    const totalVariance = totalActual - totalEstimated;
    const variancePercentage = totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    const activeEstimates = estimates.filter(est => est.status === 'active').length;
    const completedEstimates = estimates.filter(est => est.status === 'approved').length;
    const draftEstimates = estimates.filter(est => est.status === 'draft').length;

    const budgetUtilization = site.budget_limit > 0 ? (totalEstimated / site.budget_limit) * 100 : 0;

    const summaryY = doc.y;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('SITE SUMMARY', 50, summaryY);

    const detailsY = summaryY + 30;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Total Estimates: ${estimates.length}`, 50, detailsY)
       .text(`Draft: ${draftEstimates} | Active: ${activeEstimates} | Approved: ${completedEstimates}`, 50, detailsY + 20)
       .text(`Total Purchase Batches: ${totalPurchases}`, 50, detailsY + 40)
       .text(`Total Estimated: ${this.currency} ${this._formatNumber(totalEstimated)}`, 50, detailsY + 60)
       .text(`Total Actual Spent: ${this.currency} ${this._formatNumber(totalActual)}`, 50, detailsY + 80)
       .text(`Total Variance: ${this.currency} ${this._formatNumber(Math.abs(totalVariance))} (${totalVariance >= 0 ? '+' : ''}${variancePercentage.toFixed(1)}%)`, 50, detailsY + 100);

    if (site.budget_limit > 0) {
      const budgetStatus = budgetUtilization > 100 ? 'OVER BUDGET' :
                          budgetUtilization >= 90 ? 'NEAR LIMIT' : 'WITHIN BUDGET';

      doc.text(`Budget Limit: ${this.currency} ${this._formatNumber(site.budget_limit)}`, 300, detailsY)
         .text(`Budget Utilization: ${budgetUtilization.toFixed(1)}%`, 300, detailsY + 20)
         .text(`Status: ${budgetStatus}`, 300, detailsY + 40);
    }

    doc.y = detailsY + 140;
  }

  _addFooter(doc) {
    const footerY = doc.page.height - 100;

    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Generated on ${new Date().toLocaleString()}`, 50, footerY, { align: 'center' })
       .text(`${this.companyName} - Construction Management System`, 50, footerY + 15, { align: 'center' });
  }

  _formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '0.00';
    return parseFloat(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  _truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}

module.exports = PDFReportService;