const path = require('path');
const fs = require('fs').promises;
const { asyncHandler } = require('../middleware/errorHandler');
const PDFReportService = require('../services/pdfService');

const pdfService = new PDFReportService();

const generateEstimateReport = asyncHandler(async (req, res) => {
  const { estimate_id } = req.params;
  const { download = false, filename } = req.query;

  try {
    // Sanitize filename and ensure .pdf extension
    let outputFilename;
    if (filename) {
      // Remove invalid characters and ensure .pdf extension
      const sanitized = filename.replace(/[<>:"/\\|?*]/g, '_').trim();
      outputFilename = sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
    } else {
      outputFilename = `estimate_${estimate_id}_${Date.now()}.pdf`;
    }
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
          // Check if file exists before trying to delete it
          await fs.access(outputPath);
          await fs.unlink(outputPath);
          console.log(`Temp file deleted: ${outputPath}`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`Temp file already deleted or doesn't exist: ${outputPath}`);
          } else {
            console.error('Error deleting temp file:', error);
          }
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
    let outputFilename;
    if (filename) {
      const sanitized = filename.replace(/[<>:"/\\|?*]/g, '_').trim();
      outputFilename = sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
    } else {
      outputFilename = `variance_${site_id}_${Date.now()}.pdf`;
    }
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
          // Check if file exists before trying to delete it
          await fs.access(outputPath);
          await fs.unlink(outputPath);
          console.log(`Temp file deleted: ${outputPath}`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`Temp file already deleted or doesn't exist: ${outputPath}`);
          } else {
            console.error('Error deleting temp file:', error);
          }
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
    let outputFilename;
    if (filename) {
      const sanitized = filename.replace(/[<>:"/\\|?*]/g, '_').trim();
      outputFilename = sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
    } else {
      outputFilename = `site_${site_id}_${Date.now()}.pdf`;
    }
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
          // Check if file exists before trying to delete it
          await fs.access(outputPath);
          await fs.unlink(outputPath);
          console.log(`Temp file deleted: ${outputPath}`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`Temp file already deleted or doesn't exist: ${outputPath}`);
          } else {
            console.error('Error deleting temp file:', error);
          }
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
        // Check if file exists before trying to delete it
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`Temp file deleted: ${filePath}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`Temp file already deleted or doesn't exist: ${filePath}`);
        } else {
          console.error('Error deleting temp file:', error);
        }
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
    const { days = 7, before_date } = req.query; // Default to 7 days, allow custom date
    const tempDir = path.join(__dirname, '../../temp');
    const files = await fs.readdir(tempDir);
    const now = new Date();

    // Calculate cutoff date
    let cutoffDate;
    if (before_date) {
      cutoffDate = new Date(before_date);
      if (isNaN(cutoffDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format.'
        });
      }
    } else {
      cutoffDate = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
    }

    let deletedCount = 0;
    const deletedFiles = [];

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = await fs.stat(filePath);

          if (stats.birthtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            deletedFiles.push(file);
            console.log(`Cleaned up old temp file: ${filePath}`);
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error(`Error processing file ${filePath}:`, error);
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} files deleted older than ${before_date || `${days} days`}.`,
      data: {
        deletedFiles: deletedCount,
        deletedFileNames: deletedFiles,
        cutoffDate: cutoffDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during cleanup operation',
      error: error.message
    });
  }
});

const deleteReport = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    if (!filename.endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files can be deleted'
      });
    }

    const tempDir = path.join(__dirname, '../../temp');
    const filePath = path.join(tempDir, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    // Delete the file
    await fs.unlink(filePath);
    console.log(`Report deleted by user: ${filePath}`);

    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: {
        deletedFile: filename
      }
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
});

module.exports = {
  generateEstimateReport,
  generateVarianceReport,
  generateSiteReport,
  downloadReport,
  getReportsList,
  cleanupReports,
  deleteReport
};