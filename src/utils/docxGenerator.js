import { Document, Packer, Paragraph, TextRun, AlignmentType, Header, Footer, PageNumber } from 'docx';
import { saveAs } from 'file-saver';

export const generateWordTemplate = async (assignmentData, userEmail) => {
    // Basic heuristics to determine details
    const title = assignmentData.title || 'Untitled Assignment';
    const subject = assignmentData.subject || 'Course';

    // We create the entire docx document
    const doc = new Document({
        title: title,
        description: "Auto-generated assignment template",
        styles: {
            default: {
                document: {
                    run: { font: "Times New Roman", size: 24, color: "000000" },
                    paragraph: {
                        spacing: { line: 480, before: 0, after: 0 } // Double spacing for academic
                    }
                }
            }
        },
        sections: [{
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({ text: `${userEmail?.split('@')[0] || 'Student'} `, font: "Times New Roman" }),
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: "Times New Roman"
                                })
                            ]
                        })
                    ]
                })
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: userEmail?.split('@')[0] || 'Student Name' })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Professor's Name [Edit Here]" })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: subject })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400, after: 400 },
                    children: [
                        new TextRun({ text: title, bold: true, size: 24 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "[Begin your assignment introduction here. This template is formatted per standard academic guidelines (Times New Roman, 12pt, double-spaced).]" })
                    ]
                }),

                // Add placeholder for References
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 800, after: 400 },
                    pageBreakBefore: true,
                    children: [
                        new TextRun({ text: "References", bold: true, size: 24 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "[Insert references here in APA/MLA format]" })
                    ]
                })
            ],
        }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.docx`);
};
