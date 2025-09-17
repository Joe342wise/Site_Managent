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
             c.name as category_name,
             COALESCE(a.actual_unit_price, 0) as actual_unit_price,
             COALESCE(a.total_actual, 0) as total_actual,
             COALESCE(a.variance_amount, 0) as variance_amount,
             COALESCE(a.variance_percentage, 0) as variance_percentage
      FROM estimate_items ei
      LEFT JOIN categories c ON ei.category_id = c.category_id
      LEFT JOIN actuals a ON ei.item_id = a.item_id
      WHERE ei.estimate_id = ?
      ORDER BY c.sort_order, ei.item_id
    `, [estimateId]);

    this._addHeader(doc);
    this._addEstimateInfo(doc, estimate);
    this._addItemsTable(doc, items);
    this._addSummary(doc, items);
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
        COALESCE(a.total_actual, 0) as total_actual,
        COALESCE(a.variance_amount, 0) as variance_amount,
        COALESCE(a.variance_percentage, 0) as variance_percentage,
        CASE
          WHEN a.variance_amount IS NULL THEN 'No Actual'
          WHEN a.variance_amount > 0 THEN 'Over Budget'
          WHEN a.variance_amount < 0 THEN 'Under Budget'
          ELSE 'On Budget'
        END as variance_status
      FROM estimates e
      JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
      JOIN categories c ON ei.category_id = c.category_id
      LEFT JOIN actuals a ON ei.item_id = a.item_id
      WHERE e.site_id = ?
      ORDER BY ABS(a.variance_percentage) DESC, c.sort_order
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
             COUNT(ei.item_id) as item_count,
             SUM(ei.total_estimated) as calculated_total
      FROM estimates e
      LEFT JOIN estimate_items ei ON e.estimate_id = ei.estimate_id
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
    const itemHeight = 20;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('ESTIMATE ITEMS', 50, tableTop);

    const headerY = tableTop + 30;

    doc.rect(50, headerY, 500, itemHeight)
       .fillAndStroke('#f0f0f0', '#cccccc');

    doc.fontSize(10)
       .fillColor('#000000')
       .text('Description', 55, headerY + 5)
       .text('Category', 200, headerY + 5)
       .text('Qty', 280, headerY + 5)
       .text('Unit', 310, headerY + 5)
       .text('Est. Price', 350, headerY + 5)
       .text('Act. Price', 410, headerY + 5)
       .text('Total Est.', 470, headerY + 5)
       .text('Variance', 520, headerY + 5);

    let currentY = headerY + itemHeight;

    items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';

      doc.rect(50, currentY, 500, itemHeight)
         .fillAndStroke(bgColor, '#dddddd');

      const varianceColor = item.variance_amount > 0 ? '#ff0000' :
                           item.variance_amount < 0 ? '#008000' : '#000000';

      doc.fontSize(9)
         .fillColor('#000000')
         .text(this._truncateText(item.description, 25), 55, currentY + 5)
         .text(item.category_name, 200, currentY + 5)
         .text(item.quantity.toString(), 280, currentY + 5)
         .text(item.unit, 310, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(item.unit_price)}`, 350, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(item.actual_unit_price)}`, 410, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(item.total_estimated)}`, 470, currentY + 5);

      doc.fillColor(varianceColor)
         .text(`${this._formatNumber(item.variance_percentage, 1)}%`, 520, currentY + 5);

      currentY += itemHeight;
    });

    doc.y = currentY + 10;
  }

  _addSummary(doc, items) {
    const totalEstimated = items.reduce((sum, item) => sum + parseFloat(item.total_estimated), 0);
    const totalActual = items.reduce((sum, item) => sum + parseFloat(item.total_actual), 0);
    const totalVariance = items.reduce((sum, item) => sum + parseFloat(item.variance_amount), 0);
    const variancePercentage = totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    const summaryY = doc.y;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('SUMMARY', 50, summaryY);

    const detailsY = summaryY + 30;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Total Estimated: ${this.currency} ${this._formatNumber(totalEstimated)}`, 50, detailsY)
       .text(`Total Actual: ${this.currency} ${this._formatNumber(totalActual)}`, 50, detailsY + 20)
       .text(`Total Variance: ${this.currency} ${this._formatNumber(totalVariance)}`, 50, detailsY + 40)
       .text(`Variance Percentage: ${this._formatNumber(variancePercentage, 2)}%`, 50, detailsY + 60);

    doc.y = detailsY + 80;
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
       .text('Category', 150, headerY + 5)
       .text('Estimated', 220, headerY + 5)
       .text('Actual', 280, headerY + 5)
       .text('Variance', 340, headerY + 5)
       .text('Variance %', 400, headerY + 5)
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
         .text(this._truncateText(item.item_description, 20), 55, currentY + 5)
         .text(item.category_name, 150, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(item.total_estimated)}`, 220, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(item.total_actual)}`, 280, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(item.variance_amount)}`, 340, currentY + 5)
         .text(`${this._formatNumber(item.variance_percentage, 1)}%`, 400, currentY + 5);

      doc.fillColor(statusColor)
         .text(item.variance_status, 470, currentY + 5);

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

    const summaryY = doc.y;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('VARIANCE SUMMARY', 50, summaryY);

    const detailsY = summaryY + 30;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Total Items: ${varianceData.length}`, 50, detailsY)
       .text(`Over Budget Items: ${overBudgetCount}`, 50, detailsY + 20)
       .text(`Under Budget Items: ${underBudgetCount}`, 50, detailsY + 40)
       .text(`On Budget Items: ${onBudgetCount}`, 50, detailsY + 60)
       .text(`Total Estimated: ${this.currency} ${this._formatNumber(totalEstimated)}`, 300, detailsY)
       .text(`Total Actual: ${this.currency} ${this._formatNumber(totalActual)}`, 300, detailsY + 20)
       .text(`Total Variance: ${this.currency} ${this._formatNumber(totalVariance)}`, 300, detailsY + 40);

    doc.y = detailsY + 80;
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
       .text('ID', 55, headerY + 5)
       .text('Title', 100, headerY + 5)
       .text('Date Created', 250, headerY + 5)
       .text('Status', 350, headerY + 5)
       .text('Items', 420, headerY + 5)
       .text('Total Value', 470, headerY + 5);

    let currentY = headerY + itemHeight;

    estimates.forEach((estimate, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';

      doc.rect(50, currentY, 500, itemHeight)
         .fillAndStroke(bgColor, '#dddddd');

      doc.fontSize(9)
         .fillColor('#000000')
         .text(estimate.estimate_id.toString(), 55, currentY + 5)
         .text(this._truncateText(estimate.title, 25), 100, currentY + 5)
         .text(new Date(estimate.date_created).toLocaleDateString(), 250, currentY + 5)
         .text(estimate.status.toUpperCase(), 350, currentY + 5)
         .text(estimate.item_count.toString(), 420, currentY + 5)
         .text(`${this.currency} ${this._formatNumber(estimate.calculated_total || 0)}`, 470, currentY + 5);

      currentY += itemHeight;
    });

    doc.y = currentY + 10;
  }

  _addSiteSummary(doc, site, estimates) {
    const totalValue = estimates.reduce((sum, est) => sum + parseFloat(est.calculated_total || 0), 0);
    const activeEstimates = estimates.filter(est => est.status === 'active').length;
    const completedEstimates = estimates.filter(est => est.status === 'approved').length;

    const summaryY = doc.y;

    doc.fontSize(14)
       .fillColor('#333333')
       .text('SITE SUMMARY', 50, summaryY);

    const detailsY = summaryY + 30;

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Total Estimates: ${estimates.length}`, 50, detailsY)
       .text(`Active Estimates: ${activeEstimates}`, 50, detailsY + 20)
       .text(`Completed Estimates: ${completedEstimates}`, 50, detailsY + 40)
       .text(`Total Estimated Value: ${this.currency} ${this._formatNumber(totalValue)}`, 50, detailsY + 60);

    doc.y = detailsY + 80;
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