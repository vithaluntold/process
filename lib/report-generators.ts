import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";

interface ReportData {
  title: string;
  generatedAt: string;
  process?: any;
  totalEvents?: number;
  uniqueCases?: number;
  metrics?: any[];
  totalProcesses?: number;
  processes?: any[];
}

export async function generatePDFReport(data: ReportData): Promise<Buffer> {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(data.title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 20, 30);
  
  let yPosition = 45;
  
  if (data.process) {
    doc.setFontSize(14);
    doc.text("Process Overview", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Name: ${data.process.name}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total Events: ${data.totalEvents || 0}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Unique Cases: ${data.uniqueCases || 0}`, 20, yPosition);
    yPosition += 15;
    
    if (data.metrics && data.metrics.length > 0) {
      doc.setFontSize(14);
      doc.text("Performance Metrics", 20, yPosition);
      yPosition += 10;
      
      const tableData = data.metrics.slice(0, 10).map((m: any) => [
        m.metricName || "N/A",
        m.metricValue?.toFixed(2) || "0",
        m.unit || "",
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value", "Unit"]],
        body: tableData,
        theme: "grid",
      });
    }
  } else if (data.processes) {
    doc.setFontSize(14);
    doc.text("Process Summary", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Processes: ${data.totalProcesses || 0}`, 20, yPosition);
    yPosition += 15;
    
    const tableData = data.processes.slice(0, 10).map((p: any) => [
      p.name,
      p.status || "active",
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [["Process Name", "Status", "Created"]],
      body: tableData,
      theme: "grid",
    });
  }
  
  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}

export async function generateExcelReport(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EPI-Q";
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet("Report");
  
  worksheet.mergeCells("A1:D1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = data.title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  
  worksheet.getCell("A2").value = "Generated:";
  worksheet.getCell("B2").value = new Date(data.generatedAt).toLocaleString();
  
  let currentRow = 4;
  
  if (data.process) {
    worksheet.getCell(`A${currentRow}`).value = "Process Overview";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;
    
    worksheet.getCell(`A${currentRow}`).value = "Process Name";
    worksheet.getCell(`B${currentRow}`).value = data.process.name;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = "Total Events";
    worksheet.getCell(`B${currentRow}`).value = data.totalEvents || 0;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = "Unique Cases";
    worksheet.getCell(`B${currentRow}`).value = data.uniqueCases || 0;
    currentRow += 2;
    
    if (data.metrics && data.metrics.length > 0) {
      worksheet.getCell(`A${currentRow}`).value = "Performance Metrics";
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;
      
      worksheet.getCell(`A${currentRow}`).value = "Metric Name";
      worksheet.getCell(`B${currentRow}`).value = "Value";
      worksheet.getCell(`C${currentRow}`).value = "Unit";
      worksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
      
      data.metrics.slice(0, 20).forEach((metric: any) => {
        worksheet.getCell(`A${currentRow}`).value = metric.metricName || "N/A";
        worksheet.getCell(`B${currentRow}`).value = metric.metricValue || 0;
        worksheet.getCell(`C${currentRow}`).value = metric.unit || "";
        currentRow++;
      });
    }
  } else if (data.processes) {
    worksheet.getCell(`A${currentRow}`).value = "Process Summary";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;
    
    worksheet.getCell(`A${currentRow}`).value = "Process Name";
    worksheet.getCell(`B${currentRow}`).value = "Status";
    worksheet.getCell(`C${currentRow}`).value = "Created";
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;
    
    data.processes.slice(0, 50).forEach((process: any) => {
      worksheet.getCell(`A${currentRow}`).value = process.name;
      worksheet.getCell(`B${currentRow}`).value = process.status || "active";
      worksheet.getCell(`C${currentRow}`).value = new Date(process.createdAt).toLocaleDateString();
      currentRow++;
    });
  }
  
  worksheet.columns = [
    { width: 25 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
  ];
  
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generatePowerPointReport(data: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "0A5EA8" };
  titleSlide.addText(data.title, {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: "FFFFFF",
    align: "center",
  });
  titleSlide.addText(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, {
    x: 0.5,
    y: 4.0,
    w: 9,
    fontSize: 14,
    color: "FFFFFF",
    align: "center",
  });
  
  if (data.process) {
    const overviewSlide = pptx.addSlide();
    overviewSlide.addText("Process Overview", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.75,
      fontSize: 24,
      bold: true,
      color: "0A5EA8",
    });
    
    const overviewData = [
      ["Process Name", data.process.name],
      ["Total Events", String(data.totalEvents || 0)],
      ["Unique Cases", String(data.uniqueCases || 0)],
    ];
    
    overviewSlide.addTable(overviewData, {
      x: 1.0,
      y: 1.5,
      w: 8,
      fontSize: 14,
      border: { pt: 1, color: "CFCFCF" },
      fill: { color: "F7F7F7" },
    });
    
    if (data.metrics && data.metrics.length > 0) {
      const metricsSlide = pptx.addSlide();
      metricsSlide.addText("Performance Metrics", {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 24,
        bold: true,
        color: "0A5EA8",
      });
      
      const metricsData = [
        ["Metric Name", "Value", "Unit"],
        ...data.metrics.slice(0, 10).map((m: any) => [
          m.metricName || "N/A",
          String(m.metricValue?.toFixed(2) || "0"),
          m.unit || "",
        ]),
      ];
      
      metricsSlide.addTable(metricsData, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 12,
        border: { pt: 1, color: "CFCFCF" },
        fill: { color: "F7F7F7" },
      });
    }
  } else if (data.processes) {
    const summarySlide = pptx.addSlide();
    summarySlide.addText("Process Summary", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.75,
      fontSize: 24,
      bold: true,
      color: "0A5EA8",
    });
    
    summarySlide.addText(`Total Processes: ${data.totalProcesses || 0}`, {
      x: 1.0,
      y: 1.5,
      fontSize: 16,
    });
    
    const processData = [
      ["Process Name", "Status", "Created"],
      ...data.processes.slice(0, 10).map((p: any) => [
        p.name,
        p.status || "active",
        new Date(p.createdAt).toLocaleDateString(),
      ]),
    ];
    
    summarySlide.addTable(processData, {
      x: 0.5,
      y: 2.5,
      w: 9,
      fontSize: 12,
      border: { pt: 1, color: "CFCFCF" },
      fill: { color: "F7F7F7" },
    });
  }
  
  const buffer = await pptx.write({ outputType: "arraybuffer" });
  return Buffer.from(buffer as ArrayBuffer);
}
