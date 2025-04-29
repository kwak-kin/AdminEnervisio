import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  db,
  getServerTimestamp,
  createTimestamp,
} from "../../services/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";

const BulkImportExport = ({ onImportComplete }) => {
  const { currentUser } = useAuth();
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle file selection for import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImportFile(file);

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and format the data
          const formattedData = jsonData.map((row, index) => {
            // Check for required fields
            if (!row["Rate (PHP)"] || !row["Effective Date"]) {
              throw new Error(`Row ${index + 1} is missing required fields.`);
            }

            // Parse date
            let effectiveDate;
            try {
              // Try to parse date in various formats
              if (typeof row["Effective Date"] === "string") {
                // Try to parse the date string
                const dateParts = row["Effective Date"].split(/[-\/]/);
                if (dateParts.length === 3) {
                  // Assume MM/DD/YYYY or YYYY-MM-DD format
                  const year =
                    dateParts[2]?.length === 4 ? dateParts[2] : dateParts[0];
                  const month =
                    dateParts[2]?.length === 4 ? dateParts[0] : dateParts[1];
                  const day =
                    dateParts[2]?.length === 4 ? dateParts[1] : dateParts[2];

                  effectiveDate = new Date(`${year}-${month}-${day}`);
                } else {
                  effectiveDate = new Date(row["Effective Date"]);
                }
              } else if (typeof row["Effective Date"] === "number") {
                // Excel date (days since 1/1/1900)
                effectiveDate = XLSX.SSF.parse_date_code(row["Effective Date"]);
                effectiveDate = new Date(
                  effectiveDate.y,
                  effectiveDate.m - 1,
                  effectiveDate.d
                );
              }

              // Check if date is valid
              if (isNaN(effectiveDate.getTime())) {
                throw new Error();
              }
            } catch (e) {
              throw new Error(`Row ${index + 1} has an invalid date format.`);
            }

            // Parse rate
            let rate;
            try {
              rate = parseFloat(row["Rate (PHP)"]);
              if (isNaN(rate) || rate <= 0) {
                throw new Error();
              }
            } catch (e) {
              throw new Error(`Row ${index + 1} has an invalid rate value.`);
            }

            return {
              rate,
              effectiveDate,
              archived: row["Archived"] === "Yes" || row["Archived"] === true,
              notes: row["Notes"] || "",
            };
          });

          setImportPreview(formattedData);
          setError("");
        } catch (error) {
          console.error("Error parsing file:", error);
          setError(
            error.message ||
              "Invalid file format. Please check the template and try again."
          );
          setImportPreview([]);
        }
      };

      reader.readAsArrayBuffer(file);
    } else {
      setImportPreview([]);
    }
  };

  // Audit trail logging for export/import
  const logAudit = async (action, details) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "audittrail"), {
        action,
        timestamp: getServerTimestamp(),
        uid: currentUser.uid,
        details,
      });
    } catch (e) {
      // Silent fail, do not block import/export
      console.error("Failed to log audit event", e);
    }
  };

  // Process the import
  const handleImport = async () => {
    if (importPreview.length === 0) {
      setError("No valid data to import.");
      return;
    }

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const ratesRef = collection(db, "meralcorate");
      let importedCount = 0;

      // Import each rate
      for (const rate of importPreview) {
        const baseRate = rate.rate;
        const rate2 = baseRate + 0.56;
        const rate3 = rate2 + 0.62;
        await addDoc(ratesRef, {
          kwh_rate: baseRate,
          kwh_rate2: rate2,
          kwh_rate3: rate3,
          effective_from: createTimestamp(rate.effectiveDate),
          updated_datetime: getServerTimestamp(),
          updated_by: currentUser.uid,
          archived: rate.archived || false,
          notes: rate.notes || "",
        });

        importedCount++;
      }

      setSuccess(`Successfully imported ${importedCount} rates.`);
      setImportFile(null);
      setImportPreview([]);

      // Notify parent component
      if (onImportComplete) {
        onImportComplete();
      }

      await logAudit("import_rates", {
        count: importedCount,
        fileName: importFile?.name || null,
      });
    } catch (error) {
      console.error("Error importing rates:", error);
      setError("Failed to import rates. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // Export all rates
  const handleExport = async () => {
    setExporting(true);
    setError("");

    try {
      // Fetch all rates
      const ratesRef = collection(db, "meralcorate");
      const ratesQuery = query(ratesRef, orderBy("effective_from", "desc"));
      const querySnapshot = await getDocs(ratesQuery);

      if (querySnapshot.empty) {
        setError("No rates to export.");
        setExporting(false);
        return;
      }

      // Format data for export
      const exportData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const baseRate = data.kwh_rate;
        const rate2 = data.kwh_rate2 ?? baseRate + 0.56;
        const rate3 = data.kwh_rate3 ?? rate2 + 0.62;
        return {
          "Rate (PHP)": baseRate,
          "Rate2 (PHP)": rate2,
          "Rate3 (PHP)": rate3,
          "Effective Date": data.effective_from?.toDate()
            ? format(data.effective_from.toDate(), "MM/dd/yyyy")
            : "N/A",
          "Updated Date": data.updated_datetime?.toDate()
            ? format(data.updated_datetime.toDate(), "MM/dd/yyyy")
            : "N/A",
          Archived: data.archived ? "Yes" : "No",
          Notes: data.notes || "",
        };
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Rate
        { wch: 15 }, // Effective Date
        { wch: 15 }, // Updated Date
        { wch: 10 }, // Archived
        { wch: 30 }, // Notes
      ];

      worksheet["!cols"] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Meralco Rates");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Save file
      const fileName = `meralco_rates_export_${format(
        new Date(),
        "yyyyMMdd"
      )}.xlsx`;
      saveAs(blob, fileName);
      setSuccess("Rates exported successfully.");
      await logAudit("export_rates", {
        count: exportData.length,
        fileName,
      });
    } catch (error) {
      console.error("Error exporting rates:", error);
      setError("Failed to export rates. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Generate template for import
  const handleGetTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        "Rate (PHP)": 10.5,
        "Rate2 (PHP)": 11.06,
        "Rate3 (PHP)": 11.68,
        "Effective Date": format(new Date(), "MM/dd/yyyy"),
        Archived: "No",
        Notes: "Sample rate 1",
      },
      {
        "Rate (PHP)": 11.25,
        "Rate2 (PHP)": 11.81,
        "Rate3 (PHP)": 12.43,
        "Effective Date": format(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          "MM/dd/yyyy"
        ),
        Archived: "Yes",
        Notes: "Sample rate 2 (archived)",
      },
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Add header descriptions in a separate sheet
    const instructionsData = [
      {
        Field: "Rate (PHP)",
        Description:
          "The base electricity rate in Philippine Pesos per kWh (required). Rate2 and Rate3 are auto-calculated.",
      },
      {
        Field: "Rate2 (PHP)",
        Description:
          "Auto-calculated: Rate (PHP) + 0.56. Used for 400-799 kWh consumption.",
      },
      {
        Field: "Rate3 (PHP)",
        Description:
          "Auto-calculated: Rate2 (PHP) + 0.62. Used for 800 kWh and up.",
      },
      {
        Field: "Effective Date",
        Description:
          "The date when the rate becomes effective in MM/DD/YYYY format (required)",
      },
      {
        Field: "Archived",
        Description: 'Whether the rate is archived ("Yes" or "No")',
      },
      { Field: "Notes", Description: "Any additional notes for this rate" },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // Rate
      { wch: 15 }, // Effective Date
      { wch: 10 }, // Archived
      { wch: 30 }, // Notes
    ];

    instructionsSheet["!cols"] = [
      { wch: 15 }, // Field
      { wch: 60 }, // Description
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Data");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Save file
    saveAs(blob, "meralco_rates_template.xlsx");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#1e386d] mb-4">
        Bulk Import/Export
      </h2>

      {/* Error and Success Messages */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Import Rates
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="importFile"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload Excel File
              </label>
              <input
                type="file"
                id="importFile"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-medium
                  file:bg-[#e6ecf5] file:text-[#1e386d]
                  hover:file:bg-gray-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload an Excel file with rate data.
                <button
                  type="button"
                  onClick={handleGetTemplate}
                  className="text-[#1e386d] hover:text-[#152951] underline ml-1"
                >
                  Download Template
                </button>
              </p>
            </div>

            {/* Import Preview */}
            {importPreview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Preview ({importPreview.length} rates)
                </h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Rate (PHP)
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Effective Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Archived
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importPreview.map((rate, index) => (
                        <tr key={index}>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                            ₱{rate.rate.toFixed(2)}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                            {format(rate.effectiveDate, "MM/dd/yyyy")}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                            {rate.archived ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || importPreview.length === 0}
                className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  "Import Rates"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Export Rates
          </h3>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Export all rate data to an Excel file for backup or analysis. The
              export will include all rates in the system, both active and
              archived.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="bg-[#1e386d] text-white px-4 py-2 rounded font-medium hover:bg-[#152951] focus:outline-none focus:ring-2 focus:ring-[#1e386d] focus:ring-offset-2 flex items-center"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  "Export All Rates"
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Export includes: Rate values, effective dates, archived status,
              and notes.
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-md font-medium text-gray-900 mb-2">
          Import/Export Instructions
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Importing Rates:</strong> Upload an Excel file containing
            rate data. The file must have the following columns:
          </p>

          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Rate (PHP)</strong> - The electricity rate in Philippine
              Pesos (required)
            </li>
            <li>
              <strong>Effective Date</strong> - The date when the rate becomes
              effective (required)
            </li>
            <li>
              <strong>Archived</strong> - Whether the rate is archived ("Yes" or
              "No", optional)
            </li>
            <li>
              <strong>Notes</strong> - Any additional notes for this rate
              (optional)
            </li>
          </ul>

          <p className="mt-2">
            <strong>Exporting Rates:</strong> This will download an Excel file
            containing all rates currently in the system. The export can be used
            for reporting or as a backup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkImportExport;
