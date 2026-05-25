import PDFDocument from 'pdfkit';
import { IAssignment } from '../models/Assignment.js';

export function generatePDF(assignment: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      const paper = assignment.paper;
      if (!paper) {
        throw new Error('Assignment paper does not exist.');
      }

      // Page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2); // 595.28 - 80 = 515.28

      // Function to draw outer page frame
      const drawPageFrame = () => {
        doc.save();
        
        // Outer thin border
        doc.rect(margin - 10, margin - 10, contentWidth + 20, pageHeight - (margin * 2) + 20)
           .lineWidth(1)
           .strokeColor('#1E293B')
           .stroke();
           
        // Inner double border line
        doc.rect(margin - 6, margin - 6, contentWidth + 12, pageHeight - (margin * 2) + 12)
           .lineWidth(0.5)
           .strokeColor('#64748B')
           .stroke();
           
        doc.restore();
      };

      // --- PAGE 1: QUESTION PAPER ---
      drawPageFrame();

      // Header Banner Table
      doc.save();
      // Draw header shaded background for Title
      doc.fillColor('#F8FAFC')
         .rect(margin, margin, contentWidth, 36)
         .fill();
         
      // Draw header table borders
      doc.rect(margin, margin, contentWidth, 96)
         .lineWidth(1.5)
         .strokeColor('#0F172A')
         .stroke();
         
      // Draw horizontal line inside header table
      doc.moveTo(margin, margin + 36)
         .lineTo(margin + contentWidth, margin + 36)
         .lineWidth(1)
         .strokeColor('#0F172A')
         .stroke();
         
      // Draw middle dividing line inside header table
      doc.moveTo(margin + (contentWidth / 2), margin + 36)
         .lineTo(margin + (contentWidth / 2), margin + 96)
         .lineWidth(1)
         .strokeColor('#0F172A')
         .stroke();
         
      // Draw horizontal dividing line inside header grid
      doc.moveTo(margin, margin + 66)
         .lineTo(margin + contentWidth, margin + 66)
         .lineWidth(0.75)
         .strokeColor('#475569')
         .stroke();

      // Add school title text
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#0F172A')
         .text(paper.schoolName.toUpperCase(), margin, margin + 12, { align: 'center', width: contentWidth });

      // Add subject & Class on left side of header
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155');
      doc.text(`SUBJECT: ${paper.subject.toUpperCase()}`, margin + 15, margin + 46);
      doc.text(`CLASS / GRADE: ${paper.className.toUpperCase()}`, margin + 15, margin + 76);

      // Add time & marks on right side of header
      doc.text(`TIME ALLOWED: ${paper.timeAllowed.toUpperCase()}`, margin + (contentWidth / 2) + 15, margin + 46);
      doc.text(`MAXIMUM MARKS: ${paper.maxMarks}`, margin + (contentWidth / 2) + 15, margin + 76);
      doc.restore();

      doc.moveDown(5.2); // Position below the header box

      // Student info grid block
      doc.save();
      // Draw student grid box
      doc.rect(margin, doc.y, contentWidth, 40)
         .lineWidth(1)
         .strokeColor('#475569')
         .stroke();
         
      // Vertical dividers inside student info grid
      const colWidth = contentWidth / 4;
      doc.moveTo(margin + colWidth, doc.y)
         .lineTo(margin + colWidth, doc.y + 40)
         .moveTo(margin + (colWidth * 2), doc.y)
         .lineTo(margin + (colWidth * 2), doc.y + 40)
         .moveTo(margin + (colWidth * 3), doc.y)
         .lineTo(margin + (colWidth * 3), doc.y + 40)
         .lineWidth(0.75)
         .strokeColor('#64748B')
         .stroke();

      const gridY = doc.y;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A');
      doc.text('CANDIDATE NAME:', margin + 8, gridY + 6);
      doc.font('Helvetica').fontSize(10).fillColor('#64748B');
      doc.text('_________________________', margin + 8, gridY + 22);

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A');
      doc.text('ROLL NUMBER:', margin + colWidth + 8, gridY + 6);
      doc.font('Helvetica').fontSize(10).fillColor('#64748B');
      doc.text('_______________', margin + colWidth + 8, gridY + 22);

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A');
      doc.text('SECTION / ROOM:', margin + (colWidth * 2) + 8, gridY + 6);
      doc.font('Helvetica').fontSize(10).fillColor('#64748B');
      doc.text('___________', margin + (colWidth * 2) + 8, gridY + 22);

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A');
      doc.text('DATE:', margin + (colWidth * 3) + 8, gridY + 6);
      doc.font('Helvetica').fontSize(10).fillColor('#64748B');
      doc.text('_______________', margin + (colWidth * 3) + 8, gridY + 22);
      doc.restore();

      doc.moveDown(2.2);

      // Shaded Instructions Box
      doc.save();
      doc.fillColor('#F1F5F9')
         .rect(margin, doc.y, contentWidth, 34)
         .fill();
      doc.rect(margin, doc.y, contentWidth, 34)
         .lineWidth(0.5)
         .strokeColor('#94A3B8')
         .stroke();
         
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0F172A').text('GENERAL INSTRUCTIONS:', margin + 10, doc.y + 6);
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#334155').text(paper.instructions || 'All questions are compulsory. Answer all parts of a question together.', margin + 10, doc.y + 18);
      doc.restore();

      doc.moveDown(2.6);

      // Sections & Questions
      let questionCounter = 1;

      paper.sections.forEach((section: any, secIdx: number) => {
        // Section Header Row
        doc.save();
        const sectionHeaderY = doc.y;
        
        // Draw section title bar background
        doc.fillColor('#E2E8F0')
           .rect(margin, sectionHeaderY, contentWidth, 20)
           .fill();
           
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#0F172A')
           .text(section.title.toUpperCase(), margin, sectionHeaderY + 5, { align: 'center', width: contentWidth });
        doc.restore();
        
        doc.moveDown(0.4);
        
        // Section instruction
        doc.font('Helvetica-Oblique')
           .fontSize(8.5)
           .fillColor('#475569')
           .text(section.instruction, { align: 'center', width: contentWidth });
        
        doc.moveDown(1);

        // Questions List
        section.questions.forEach((q: any) => {
          // Check page break height
          if (doc.y > pageHeight - 90) {
            doc.addPage();
            drawPageFrame();
            doc.moveDown(1);
          }

          const qY = doc.y;
          
          // Question text (without difficulty label on student paper)
          doc.font('Helvetica')
             .fontSize(10)
             .fillColor('#000000')
             .text(`${questionCounter}.  ${q.text}`, margin + 10, qY, { width: contentWidth - 85, align: 'left', lineGap: 2 });
          
          // Marks on the right (bold align right)
          doc.font('Helvetica-Bold')
             .fontSize(9.5)
             .fillColor('#0F172A')
             .text(`(${q.marks} Mark${q.marks > 1 ? 's' : ''})`, margin + contentWidth - 70, qY, { width: 60, align: 'right' });
          
          doc.moveDown(1.5);
          questionCounter++;
        });

        doc.moveDown(1.2);
      });

      // End of Paper footer line
      if (doc.y > pageHeight - 80) {
        doc.addPage();
        drawPageFrame();
        doc.moveDown(1);
      }
      doc.save();
      doc.moveTo(margin + 100, doc.y)
         .lineTo(margin + contentWidth - 100, doc.y)
         .lineWidth(0.5)
         .strokeColor('#94A3B8')
         .stroke();
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold')
         .fontSize(9)
         .fillColor('#64748B')
         .text('*** END OF QUESTION PAPER ***', { align: 'center', width: contentWidth });
      doc.restore();

      // --- PAGE 2: TEACHER ANSWER KEY ---
      doc.addPage();
      drawPageFrame();

      doc.font('Helvetica-Bold')
         .fontSize(15)
         .fillColor('#0F172A')
         .text('EVALUATOR ANSWER KEY', { align: 'center' });
      doc.moveDown(0.2);
      
      doc.font('Helvetica-Oblique')
         .fontSize(9)
         .fillColor('#64748B')
         .text(`Assessment: ${paper.subject} | ${paper.className}`, { align: 'center' });
      doc.moveDown(0.6);

      // Dividing Line
      doc.moveTo(margin, doc.y)
         .lineTo(margin + contentWidth, doc.y)
         .lineWidth(1)
         .strokeColor('#CBD5E1')
         .stroke();
      doc.moveDown(1.2);

      // Answers List (With difficulty tags printed for evaluation!)
      const answers = assignment.answerKey || [];
      if (answers.length > 0) {
        answers.forEach((ans: string) => {
          // Check page break height
          if (doc.y > pageHeight - 80) {
            doc.addPage();
            drawPageFrame();
            doc.moveDown(1);
          }

          // Format answer list nicely
          doc.font('Helvetica')
             .fontSize(9.5)
             .fillColor('#1E293B')
             .text(ans, margin + 10, doc.y, { width: contentWidth - 20, lineGap: 3 });
          doc.moveDown(1);
        });
      } else {
        doc.font('Helvetica-Oblique')
           .fontSize(10)
           .fillColor('#64748B')
           .text('No detailed answer key generated for this assessment.', { align: 'left' });
      }

      // Add footer page numbers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#64748B')
           .text(
             `Page ${i + 1} of ${range.count}`,
             margin,
             pageHeight - 25,
             { align: 'center', width: contentWidth }
           );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
