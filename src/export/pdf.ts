import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SimulationResults } from "../store/types";
import type { Archetype } from "../store/types";

export function exportBoardPackPdf(
  results: SimulationResults | null,
  archetype: Archetype | null
): void {
  const doc = new jsPDF({ format: "a4" });

  doc.setFont("helvetica");
  doc.setFontSize(18);
  doc.text("Legacy Inheritance: The IFS Pivot", 20, 22);
  doc.setFontSize(11);
  doc.text("Board Pack · Executive Summary", 20, 30);

  let y = 42;

  if (archetype) {
    doc.setFontSize(12);
    doc.text(`Archetype: ${archetype.displayName}`, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Revenue: $${(archetype.annualRevenue / 1e6).toFixed(0)}M  ·  EBITDA margin: ${(archetype.ebitdaMargin * 100).toFixed(0)}%`, 20, y);
    y += 10;
  }

  if (results) {
    doc.setFontSize(12);
    doc.text("Headline metrics", 20, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Gross P90", `$${(results.grossP90 / 1e6).toFixed(2)}M`],
        ["Net P90", `$${(results.netP90 / 1e6).toFixed(2)}M`],
        ["Mean loss", `$${(results.mean / 1e6).toFixed(2)}M`],
        ["Top driver", results.topDriver ?? "—"],
      ],
      margin: { left: 20 },
      theme: "plain",
    });
    const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
    y = (docWithTable.lastAutoTable?.finalY ?? y) + 14;
  }

  doc.setFontSize(10);
  doc.text("Scenario: IFS Ransomware Pivot. Model: FAIR-ish Poisson + triangular inputs. Insurance: deductible and limit applied.", 20, y);
  doc.text("This pack is for governance discussion only. Archetypes are generalized; not real company data.", 20, 280);

  doc.save("legacy-inheritance-board-pack.pdf");
}
