const path = require('path');
const fs = require('fs').promises;
const { asyncHandler } = require('../middleware/errorHandler');
const PDFReportService = require('../services/pdfService');

const pdfService = new PDFReportService();

const generateEstimateReport = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;
  const { download = false, filename } = req.query;

  try {
    const outputFilename = filename || `estimate_${estimate_id}_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../temp', outputFilename);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const pdfStream = await pdfService.generateEstimateReport(estimate_id, outputPath);

    if (download) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);

      const fileBuffer = await fs.readFile(outputPath);
      res.send(fileBuffer);

      setTimeout(async () => {
        try {
          await fs.unlink(outputPath);
        } catch (error) {
          console.error('Error deleting temp file:', error);
        }
      }, 5000);
    } else {
      res.json({
        success: true,
        message: 'PDF report generated successfully',
        data: {
          filename: outputFilename,
          path: outputPath,
          downloadUrl: `/api/reports/download/${outputFilename}`
        }
      });
    }
  } catch (error) {
    if (error.message === 'Estimate not found') {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }
    throw error;
  }
});

const generateVarianceReport = asyncHandler(async (req, res) => {
  const { site_id } = req.params;
  const { download = false, filename } = req.query;

  try {
    const outputFilename = filename || `variance_${site_id}_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../temp', outputFilename);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const pdfStream = await pdfService.generateVarianceReport(site_id, outputPath);

    if (download) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);

      const fileBuffer = await fs.readFile(outputPath);
      res.send(fileBuffer);

      setTimeout(async () => {
        try {
          await fs.unlink(outputPath);
        } catch (error) {
          console.error('Error deleting temp file:', error);
        }
      }, 5000);
    } else {
      res.json({
        success: true,
        message: 'Variance report generated successfully',
        data: {
          filename: outputFilename,
          path: outputPath,
          downloadUrl: `/api/reports/download/${outputFilename}`
        }
      });
    }
  } catch (error) {
    if (error.message === 'Site not found') {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    throw error;
  }
});

const generateSiteReport = asyncHandler(async (req, res) => {
  const { site_id } = req.params;
  const { download = false, filename } = req.query;

  try {
    const outputFilename = filename || `site_${site_id}_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../temp', outputFilename);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const pdfStream = await pdfService.generateSiteReport(site_id, outputPath);

    if (download) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);

      const fileBuffer = await fs.readFile(outputPath);
      res.send(fileBuffer);

      setTimeout(async () => {
        try {
          await fs.unlink(outputPath);
        } catch (error) {
          console.error('Error deleting temp file:', error);
        }
      }, 5000);
    } else {
      res.json({
        success: true,
        message: 'Site report generated successfully',
        data: {
          filename: outputFilename,
          path: outputPath,
          downloadUrl: `/api/reports/download/${outputFilename}`
        }
      });
    }
  } catch (error) {
    if (error.message === 'Site not found') {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    throw error;
  }
});

const downloadReport = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../temp', filename);

  try {
    await fs.access(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);

    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }
    }, 5000);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'File not found or expired'
    });
  }
});

const getReportsList = asyncHandler(async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '../../temp');

    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
    }

    const files = await fs.readdir(tempDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    const reportsList = await Promise.all(
      pdfFiles.map(async (file) => {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          downloadUrl: `/api/reports/download/${file}`
        };
      })
    );

    res.json({
      success: true,
      data: reportsList.sort((a, b) => new Date(b.created) - new Date(a.created))
    });
  } catch (error) {
    res.json({
      success: true,
      data: []
    });
  }
});

const cleanupReports = asyncHandler(async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '../../temp');
    const files = await fs.readdir(tempDir);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (stats.birthtime < oneHourAgo) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} files deleted.`,
      data: {
        deletedFiles: deletedCount
      }
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Cleanup completed with some errors',
      data: {
        deletedFiles: 0
      }
    });
  }
});

module.exports = {
  generateEstimateReport,
  generateVarianceReport,
  generateSiteReport,
  downloadReport,
  getReportsList,
  cleanupReports
};