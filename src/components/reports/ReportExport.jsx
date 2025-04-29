import React, { useState, useRef, useEffect } from "react"; // Add useEffect import here
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReportExport = ({ chartData, activeTab, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAllData, setIncludeAllData] = useState(false);
  const [logoImage, setLogoImage] = useState(null); // Add this state for the logo image

  // Update the useEffect that loads the logo image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = "/eLogo1.png"; // Path to logo in public folder

    img.onload = () => {
      // Create a canvas with fixed dimensions for a perfect circle
      const canvas = document.createElement("canvas");
      const size = 30 * 3.78; // Convert mm to pixels (roughly 3.78 pixels/mm at 96 DPI)
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Calculate the scale and position to center the image
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;

      // Draw the image using the clipping path
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height, // Source rectangle
        x,
        y,
        img.width * scale,
        img.height * scale // Destination rectangle
      );

      // Add a subtle border to enhance the rounded look
      ctx.strokeStyle = "#e6ecf5";
      ctx.lineWidth = 5;
      ctx.stroke();

      setLogoImage(canvas.toDataURL("image/png"));
    };

    img.onerror = (error) => {
      console.warn("Error loading logo image:", error);
    };
  }, []);

  // Function to generate report title
  const getReportTitle = () => {
    switch (activeTab) {
      case "rates":
        return "Electricity Rate Trends Report";
      case "users":
        return "User Activity Report";
      case "usage":
        return "Energy Usage Patterns Report";
      case "performance":
        return "System Performance Report";
      default:
        return "Energy Management Report";
    }
  };

  // Function to format data for export
  const formatDataForExport = () => {
    switch (activeTab) {
      case "rates":
        return chartData.rates.map((item) => ({
          Date: format(item.date, "MM/dd/yyyy"),
          "Rate (PHP)": item.rate.toFixed(2),
          Status: item.archived ? "Archived" : "Active",
        }));

      case "users":
        return chartData.userActivity.map((item) => ({
          Month: item.month,
          "Admin Actions": item.admin,
          "Regular User Actions": item.regular,
          "Total Actions": item.admin + item.regular,
        }));

      case "usage":
        return chartData.usagePatterns.map((item) => ({
          Month: item.month,
          "Morning (6AM-12PM)": item.morning,
          "Afternoon (12PM-6PM)": item.afternoon,
          "Evening (6PM-12AM)": item.evening,
          "Night (12AM-6AM)": item.night,
          Total: item.morning + item.afternoon + item.evening + item.night,
        }));

      case "performance":
        return [
          {
            Metric: "System Uptime",
            Value: `${chartData.performance.uptime}%`,
            Status:
              chartData.performance.uptime >= 99.5 ? "Good" : "Needs Attention",
          },
          {
            Metric: "Average Response Time",
            Value: `${chartData.performance.responseTime}ms`,
            Status:
              chartData.performance.responseTime <= 300
                ? "Good"
                : "Needs Attention",
          },
          {
            Metric: "Error Rate",
            Value: `${chartData.performance.errorRate}%`,
            Status:
              chartData.performance.errorRate <= 1 ? "Good" : "Needs Attention",
          },
          {
            Metric: "User Satisfaction",
            Value: `${chartData.performance.userSatisfaction}/5`,
            Status:
              chartData.performance.userSatisfaction >= 4
                ? "Good"
                : "Needs Attention",
          },
        ];

      default:
        return [];
    }
  };

  // Function to get all data for export (if includeAllData is true)
  const getAllDataForExport = () => {
    const allData = {};

    // Rates data
    allData.rates = chartData.rates.map((item) => ({
      Date: format(item.date, "MM/dd/yyyy"),
      "Rate (PHP)": item.rate.toFixed(2),
      Status: item.archived ? "Archived" : "Active",
    }));

    // User activity data
    allData.userActivity = chartData.userActivity.map((item) => ({
      Month: item.month,
      "Admin Actions": item.admin,
      "Regular User Actions": item.regular,
      "Total Actions": item.admin + item.regular,
    }));

    // Usage patterns data
    allData.usagePatterns = chartData.usagePatterns.map((item) => ({
      Month: item.month,
      "Morning (6AM-12PM)": item.morning,
      "Afternoon (12PM-6PM)": item.afternoon,
      "Evening (6PM-12AM)": item.evening,
      "Night (12AM-6AM)": item.night,
      Total: item.morning + item.afternoon + item.evening + item.night,
    }));

    // Performance data
    allData.performance = [
      {
        Metric: "System Uptime",
        Value: `${chartData.performance.uptime}%`,
        Status:
          chartData.performance.uptime >= 99.5 ? "Good" : "Needs Attention",
      },
      {
        Metric: "Average Response Time",
        Value: `${chartData.performance.responseTime}ms`,
        Status:
          chartData.performance.responseTime <= 300
            ? "Good"
            : "Needs Attention",
      },
      {
        Metric: "Error Rate",
        Value: `${chartData.performance.errorRate}%`,
        Status:
          chartData.performance.errorRate <= 1 ? "Good" : "Needs Attention",
      },
      {
        Metric: "User Satisfaction",
        Value: `${chartData.performance.userSatisfaction}/5`,
        Status:
          chartData.performance.userSatisfaction >= 4
            ? "Good"
            : "Needs Attention",
      },
    ];

    return allData;
  };

  // Generate filename
  const getFileName = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const reportType = includeAllData
      ? "full_report"
      : activeTab === "rates"
      ? "rate_report"
      : activeTab === "users"
      ? "user_activity_report"
      : activeTab === "usage"
      ? "usage_patterns_report"
      : "performance_report";

    return `enervisio_${reportType}_${dateStr}`;
  };

  // Excel export
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (includeAllData) {
      const allData = getAllDataForExport();

      // Add each dataset as a separate worksheet
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(allData.rates),
        "Rate Trends"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(allData.userActivity),
        "User Activity"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(allData.usagePatterns),
        "Usage Patterns"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(allData.performance),
        "Performance"
      );
    } else {
      const data = formatDataForExport();
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(data),
        getReportTitle()
      );
    }

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Save file
    saveAs(blob, `${getFileName()}.xlsx`);
  };

  // CSV export
  const exportToCSV = () => {
    if (includeAllData) {
      const allData = getAllDataForExport();

      // Export each dataset as a separate CSV file
      Object.entries(allData).forEach(([key, data]) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
        const fileName = `${getFileName()}_${key}.csv`;
        saveAs(blob, fileName);
      });
    } else {
      const data = formatDataForExport();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `${getFileName()}.csv`);
    }
  };

  // Modified exportToPDF function to include charts when checkbox is checked
  const exportToPDF = () => {
    const doc = new jsPDF("portrait", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Add logo to header
    if (logoImage) {
      // Use the preloaded logo image as a perfect circle
      const logoSize = 30;
      const logoX = (pageWidth - logoSize) / 2;
      doc.addImage(logoImage, "PNG", logoX, currentY, logoSize, logoSize);
      currentY += logoSize + 10;
    } else {
      try {
        const logoSize = 30;
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage("/eLogo1.png", "PNG", logoX, currentY, logoSize, logoSize);
        currentY += logoSize + 10;
      } catch (error) {
        console.warn("Could not add logo to PDF:", error);
      }
    }

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(30, 56, 109); // #1e386d
    const title = includeAllData
      ? "Enervisio Energy Management Report"
      : getReportTitle();
    doc.text(title, pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // Add date
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Generated: ${format(new Date(), "MMMM d, yyyy")}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 15;

    // Add company info
    doc.setFontSize(14);
    doc.text("Electroline Corporation - Enervisio", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 15;

    // Add data tables
    doc.setFontSize(12);

    if (includeAllData) {
      const allData = getAllDataForExport();

      // Rate Trends section
      doc.text("Rate Trends", 14, currentY);
      currentY += 5;

      // Add chart for Rate Trends if includeCharts is true
      if (includeCharts && chartData.rateChart) {
        try {
          // Convert chart to image and add it to PDF
          const chartWidth = pageWidth - 28; // Leave margins
          const chartHeight = 60; // Adjust height as needed

          doc.addImage(
            chartData.rateChart,
            "PNG",
            14,
            currentY,
            chartWidth,
            chartHeight
          );
          currentY += chartHeight + 10;

          // Add new page if needed after chart
          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }
        } catch (error) {
          console.warn("Could not add rate chart to PDF:", error);
        }
      }

      // Rate Trends Table
      autoTable(doc, {
        head: [Object.keys(allData.rates[0])],
        body: allData.rates.map((item) => Object.values(item)),
        startY: currentY,
        theme: "grid",
        headStyles: { fillColor: [30, 56, 109], textColor: [255, 255, 255] },
        margin: { top: currentY },
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // Add new page if needed
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // User Activity section
      doc.text("User Activity", 14, currentY);
      currentY += 5;

      // Add chart for User Activity if includeCharts is true
      if (includeCharts && chartData.userActivityChart) {
        try {
          const chartWidth = pageWidth - 28;
          const chartHeight = 60;

          doc.addImage(
            chartData.userActivityChart,
            "PNG",
            14,
            currentY,
            chartWidth,
            chartHeight
          );
          currentY += chartHeight + 10;

          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }
        } catch (error) {
          console.warn("Could not add user activity chart to PDF:", error);
        }
      }

      // User Activity Table
      autoTable(doc, {
        head: [Object.keys(allData.userActivity[0])],
        body: allData.userActivity.map((item) => Object.values(item)),
        startY: currentY,
        theme: "grid",
        headStyles: { fillColor: [30, 56, 109], textColor: [255, 255, 255] },
        margin: { top: currentY },
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // Add new page if needed
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Usage Patterns section
      doc.text("Usage Patterns", 14, currentY);
      currentY += 5;

      // Add chart for Usage Patterns if includeCharts is true
      if (includeCharts && chartData.usageChart) {
        try {
          const chartWidth = pageWidth - 28;
          const chartHeight = 60;

          doc.addImage(
            chartData.usageChart,
            "PNG",
            14,
            currentY,
            chartWidth,
            chartHeight
          );
          currentY += chartHeight + 10;

          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }
        } catch (error) {
          console.warn("Could not add usage patterns chart to PDF:", error);
        }
      }

      // Usage Patterns Table
      autoTable(doc, {
        head: [Object.keys(allData.usagePatterns[0])],
        body: allData.usagePatterns.map((item) => Object.values(item)),
        startY: currentY,
        theme: "grid",
        headStyles: { fillColor: [30, 56, 109], textColor: [255, 255, 255] },
        margin: { top: currentY },
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // Add new page if needed
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Performance section
      doc.text("System Performance", 14, currentY);
      currentY += 5;

      // Add chart for Performance if includeCharts is true
      if (includeCharts && chartData.performanceChart) {
        try {
          const chartWidth = pageWidth - 28;
          const chartHeight = 60;

          doc.addImage(
            chartData.performanceChart,
            "PNG",
            14,
            currentY,
            chartWidth,
            chartHeight
          );
          currentY += chartHeight + 10;

          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }
        } catch (error) {
          console.warn("Could not add performance chart to PDF:", error);
        }
      }

      // Performance Table
      autoTable(doc, {
        head: [Object.keys(allData.performance[0])],
        body: allData.performance.map((item) => Object.values(item)),
        startY: currentY,
        theme: "grid",
        headStyles: { fillColor: [30, 56, 109], textColor: [255, 255, 255] },
        margin: { top: currentY },
      });
    } else {
      // Single section export based on active tab
      const data = formatDataForExport();

      // Add section title
      doc.text(getReportTitle(), 14, currentY);
      currentY += 5;

      // Add chart for current tab if includeCharts is true
      if (includeCharts) {
        let chartImage;

        // Get the appropriate chart based on active tab
        switch (activeTab) {
          case "rates":
            chartImage = chartData.rateChart;
            break;
          case "users":
            chartImage = chartData.userActivityChart;
            break;
          case "usage":
            chartImage = chartData.usageChart;
            break;
          case "performance":
            chartImage = chartData.performanceChart;
            break;
          default:
            chartImage = null;
        }

        if (chartImage) {
          try {
            const chartWidth = pageWidth - 28;
            const chartHeight = 60;

            doc.addImage(
              chartImage,
              "PNG",
              14,
              currentY,
              chartWidth,
              chartHeight
            );
            currentY += chartHeight + 10;

            if (currentY > 230) {
              doc.addPage();
              currentY = 20;
            }
          } catch (error) {
            console.warn(`Could not add ${activeTab} chart to PDF:`, error);
          }
        }
      }

      // Add data table
      autoTable(doc, {
        head: data.length > 0 ? [Object.keys(data[0])] : [],
        body: data.map((item) => Object.values(item)),
        startY: currentY,
        theme: "grid",
        headStyles: { fillColor: [30, 56, 109], textColor: [255, 255, 255] },
        margin: { top: currentY },
      });
    }

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Save the PDF
    doc.save(`${getFileName()}.pdf`);
  };

  // Handle export button click
  const handleExport = () => {
    setLoading(true);

    setTimeout(() => {
      try {
        switch (exportFormat) {
          case "xlsx":
            exportToExcel();
            break;
          case "csv":
            exportToCSV();
            break;
          case "pdf":
            exportToPDF();
            break;
          default:
            alert("Invalid export format selected.");
        }
      } catch (error) {
        console.error("Export error:", error);
        alert(`Export failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#1e386d]">Export Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Format */}
        <div>
          <label className="form-label">Export Format</label>
          <div className="mt-1 flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="pdf"
                checked={exportFormat === "pdf"}
                onChange={() => setExportFormat("pdf")}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300"
              />
              <span className="ml-2">PDF</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="xlsx"
                checked={exportFormat === "xlsx"}
                onChange={() => setExportFormat("xlsx")}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300"
              />
              <span className="ml-2">Excel (.xlsx)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === "csv"}
                onChange={() => setExportFormat("csv")}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300"
              />
              <span className="ml-2">CSV</span>
            </label>
          </div>
        </div>

        {/* Export Options */}
        <div>
          <label className="form-label">Options</label>
          <div className="mt-1 space-y-2">
            <label className="inline-flex items-center">
              {/* <input
                type="checkbox"
                checked={includeCharts}
                onChange={() => setIncludeCharts(!includeCharts)}
                disabled={exportFormat !== "pdf"}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
              <span
                className={`ml-2 ${
                  exportFormat !== "pdf" ? "text-gray-400" : ""
                }`}
              >
                Include charts (PDF only)
              </span> */}
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={includeAllData}
                onChange={() => setIncludeAllData(!includeAllData)}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
              <span className="ml-2">
                Include all report sections (not just current tab)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Export Preview</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Report Title:</span>{" "}
            {includeAllData
              ? "Enervisio Energy Management Report"
              : getReportTitle()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Format:</span>{" "}
            {exportFormat.toUpperCase()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Data Included:</span>{" "}
            {includeAllData ? "All report sections" : "Current section only"}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Generated:</span>{" "}
            {format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="bg-[#e6ecf5] text-[#1e386d] px-4 py-2 rounded font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e6ecf5] focus:ring-offset-2"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportExport;
