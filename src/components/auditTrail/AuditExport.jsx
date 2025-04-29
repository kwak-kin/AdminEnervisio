import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { db, createTimestamp } from "../../services/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Added sortOrder as a prop to match the main view's sorting
const AuditExport = ({ filters, sortOrder = "desc" }) => {
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [logoImage, setLogoImage] = useState(null);
  // Add state for export scope: 'filtered' or 'all'
  const [exportScope, setExportScope] = useState("filtered");

  // Load logo image for PDF export
  useEffect(() => {
    if (includeHeaders) {
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
    } else {
      setLogoImage(null); // Clear logo if headers are not included
    }
  }, [includeHeaders]);

  // Function to build the export query - now accepts sortOrder parameter
  const buildExportQuery = (applyFilters) => {
    const auditRef = collection(db, "audittrail");
    // Apply the same sort order as the main view
    let auditQuery = query(auditRef, orderBy("timestamp", sortOrder));

    // Apply filters only if requested
    if (applyFilters) {
      // Apply date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const startDate = new Date(filters.dateRange.start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        auditQuery = query(
          auditQuery,
          where("timestamp", ">=", createTimestamp(startDate)),
          where("timestamp", "<=", createTimestamp(endDate))
        );
      }

      // Apply action type filter
      if (filters.actionType) {
        auditQuery = query(
          auditQuery,
          where("action", "==", filters.actionType)
        );
      }

      // Apply user ID filter
      if (filters.userId) {
        auditQuery = query(auditQuery, where("uid", "==", filters.userId));
      }
    }

    return auditQuery;
  };

  // Function to perform the export
  const performExport = async () => {
    try {
      setLoading(true);

      // Determine if filters should be applied based on exportScope
      const applyFilters = exportScope === "filtered";

      // Fetch audit records
      const auditQuery = buildExportQuery(applyFilters);
      const querySnapshot = await getDocs(auditQuery);

      const records = [];

      // Process each document
      for (const doc of querySnapshot.docs) {
        const data = doc.data();

        // Apply details content filter *after* fetching if filters are applied
        // This filter cannot be done directly in Firestore query easily
        if (applyFilters && filters.detailsContent && data.details) {
          const detailsString = JSON.stringify(data.details).toLowerCase();
          if (!detailsString.includes(filters.detailsContent.toLowerCase())) {
            continue;
          }
        }

        // Store record but don't include document ID in output
        records.push({
          action: data.action,
          timestamp: data.timestamp?.toDate() || new Date(),
          uid: data.uid,
          details: data.details ? JSON.stringify(data.details) : "",
        });
      }

      if (records.length === 0) {
        alert(
          `No records found matching the selected criteria (${
            applyFilters ? "filtered" : "all"
          }).`
        );
        return;
      }

      // Format data for export - removed ID field
      const exportData = records.map((record) => ({
        Action: record.action,
        Timestamp: record.timestamp.toLocaleString(),
        "User ID": record.uid,
        Details: record.details,
      }));

      // Generate filename with sort order included
      const dateStr = new Date().toISOString().split("T")[0];
      const scopeStr = applyFilters ? "filtered" : "all";
      const orderStr = sortOrder === "asc" ? "oldest_first" : "newest_first";
      const fileName = `audit_export_${scopeStr}_${orderStr}_${dateStr}`;

      // Export based on format
      switch (exportFormat) {
        case "xlsx":
          exportToExcel(exportData, fileName);
          break;
        case "csv":
          exportToCSV(exportData, fileName);
          break;
        case "pdf":
          exportToPDF(exportData, fileName);
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
  };

  // Excel export
  const exportToExcel = (data, fileName) => {
    const workbook = XLSX.utils.book_new();

    // Add metadata if headers are included
    if (includeHeaders) {
      workbook.Props = {
        Title: "Audit Trail Export",
        Subject: "Audit Records",
        Author: "Enervisio System",
        Company: "Electroline Corporation",
      };
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Trail");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Save file
    saveAs(blob, `${fileName}.xlsx`);
  };

  // CSV export
  const exportToCSV = (data, fileName) => {
    // For CSV, we can add a header row if includeHeaders is true
    if (includeHeaders) {
      // Add company info as a header row - updated to use Action as first column since ID is removed
      const headerRow = {
        Action: "Electroline Corporation - Enervisio",
        Timestamp: `Generated: ${new Date().toLocaleString()}`,
        "User ID": "",
        Details: "",
      };

      // Add sort order information
      const sortOrderRow = {
        Action: `Sort Order: ${
          sortOrder === "asc" ? "Oldest First" : "Newest First"
        }`,
        Timestamp: "",
        "User ID": "",
        Details: "",
      };

      data = [
        headerRow,
        sortOrderRow, // Add sort order info
        { Action: "", Timestamp: "", "User ID": "", Details: "" },
        ...data,
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });

    // Save file
    saveAs(blob, `${fileName}.csv`);
  };

  // PDF export - enhanced version with fixed page numbering
  const exportToPDF = (data, fileName) => {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Add logo and branding if includeHeaders is checked
    if (includeHeaders && logoImage) {
      // Add logo
      const logoSize = 20; // Smaller for landscape mode
      const logoX = (pageWidth - logoSize) / 2;

      try {
        doc.addImage(logoImage, "PNG", logoX, currentY, logoSize, logoSize);
        currentY += logoSize + 5;
      } catch (error) {
        console.warn("Could not add logo to PDF:", error);
      }

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(30, 56, 109); // #1e386d
      doc.text("Audit Trail Export", pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 10;

      // Add date and sort order
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Generated: ${format(new Date(), "MMMM d, yyyy")} - Sort Order: ${
          sortOrder === "asc" ? "Oldest First" : "Newest First"
        }`,
        pageWidth / 2,
        currentY,
        { align: "center" }
      );
      currentY += 8;

      // Add company info
      doc.setFontSize(12);
      doc.text("Electroline Corporation - Enervisio", pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 12;
    } else {
      // Simple header without branding
      doc.setFontSize(16);
      doc.text("Audit Trail Export", 14, currentY);
      doc.setFontSize(10);
      doc.text(
        `Sort Order: ${sortOrder === "asc" ? "Oldest First" : "Newest First"}`,
        pageWidth - 20,
        currentY,
        { align: "right" }
      );
      currentY += 10;
    }

    // Create table columns - removed ID column
    const tableColumn = ["Action", "Timestamp", "User ID", "Details"];
    const tableRows = data.map((item) => [
      item["Action"],
      item["Timestamp"],
      item["User ID"],
      item["Details"],
    ]);

    // Add table using autoTable with fixed page numbering
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: "grid",
      headStyles: { fillColor: [30, 56, 109], textColor: [255, 255, 255] },
      styles: { overflow: "linebreak", cellWidth: "wrap" },
      columnStyles: {
        3: { cellWidth: 80 }, // Wider column for details, now index 3 instead of 4
      },
      didDrawPage: function (data) {
        // Fixed page number positioning for both branded and non-branded exports
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        const totalPages = doc.internal.getNumberOfPages();

        // Add page number centered at bottom with consistent positioning
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    // Save file
    doc.save(`${fileName}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#1e386d]">
        Export Audit Trail Options
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Scope */}
        <div>
          <label className="form-label">Data to Export</label>
          <div className="mt-1 flex flex-col space-y-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="exportScope"
                value="filtered"
                checked={exportScope === "filtered"}
                onChange={() => setExportScope("filtered")}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300"
              />
              <span className="ml-2">
                Current Filtered Data{" "}
                <span className="text-xs text-gray-500">
                  (Uses filters set on the main page)
                </span>
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="exportScope"
                value="all"
                checked={exportScope === "all"}
                onChange={() => setExportScope("all")}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300"
              />
              <span className="ml-2">All Audit Data</span>
            </label>
          </div>
        </div>

        {/* Export Format */}
        <div>
          <label className="form-label">Export Format</label>
          <div className="mt-1 flex flex-col space-y-2">
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

        {/* Include Headers */}
        <div className="md:col-span-2">
          <label className="form-label">Options</label>
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={() => setIncludeHeaders(!includeHeaders)}
                className="focus:ring-[#1e386d] h-4 w-4 text-[#1e386d] border-gray-300 rounded"
              />
              <span className="ml-2">Include company branding and headers</span>
            </label>
          </div>
        </div>

        {/* REMOVED Export Filters Section */}
      </div>

      {/* Preview Note */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-blue-700">
              {exportScope === "filtered"
                ? `This will export audit records matching the filters currently applied on the main Audit Trail page. Records will be sorted ${
                    sortOrder === "asc" ? "oldest first" : "newest first"
                  }.`
                : `This will export ALL audit records, ignoring any filters. Records will be sorted ${
                    sortOrder === "asc" ? "oldest first" : "newest first"
                  }.`}
              Large exports may take a moment to process.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Removed Cancel button for simplicity, assuming closure is handled by parent */}
      <div className="flex justify-end space-x-3">
        {/* <button
          type="button"
          onClick={onClose} // Re-add if needed
          className="bg-[#e6ecf5] text-[#1e386d] px-4 py-2 rounded font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e6ecf5] focus:ring-offset-2"
          disabled={loading}
        >
          Cancel
        </button> */}
        <button
          type="button"
          onClick={performExport}
          className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Processing...
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
              Export Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuditExport;
