import IsehaugKafeteriaLogo from '../images/IsehaugKafeteria.png';
import JohansPubLogo from '../images/JohansPub.png';

const exportSchedule = async (shiftTableRef, selectedWeek, selectedYear, comment, department) => {
  const { employees, shifts, customShifts, days, weekDates } = shiftTableRef.current.props;

  // Filter out empty columns
  const nonEmptyDays = days.filter((day) =>
    employees.some((employee) => shifts?.find((shift) => shift?.employeeId === employee.id)?.[day])
  );

  const scale = 2; // Increase scale for better quality
  const headerHeight = 80;
  const footerHeight = 150;
  const cellWidth = 120;
  const cellHeight = 40;

  const contentWidth = Math.max(800, cellWidth * (nonEmptyDays.length + 1));
  const contentHeight = cellHeight * (employees.length + 1); // +1 for the header row

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = contentWidth * scale;
  canvas.height = (headerHeight + contentHeight + footerHeight) * scale;
  ctx.scale(scale, scale);

  // Set background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw header
  const gradient = ctx.createLinearGradient(0, 0, contentWidth, 0);
  gradient.addColorStop(0, '#4a4a4a');
  gradient.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, contentWidth, headerHeight);

  // Draw logo in header
  const logo = new Image();
  logo.onload = () => {
    const logoSize = 60;
    const logoWidth = department === 'Isehaug Kafeteria' ? logoSize * 1.9 : logoSize; // Stretch Isehaug Kafeteria logo
    ctx.drawImage(logo, 20, 10, logoWidth, logoSize);
    
    // Draw header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${department} - Vaktliste`, logoWidth + 40, 45);
    ctx.font = '20px Arial';
    ctx.fillText(`Uke ${selectedWeek}, ${selectedYear}`, logoWidth + 40, 70);

    // Draw shift table
    if (shiftTableRef.current && shiftTableRef.current.drawToCanvas) {
      shiftTableRef.current.drawToCanvas(ctx, 0, headerHeight, contentWidth, contentHeight);
    }

    // Draw comment
    const commentY = headerHeight + contentHeight + 30;
    ctx.fillStyle = '#4a4a4a';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Kommentar:', 20, commentY);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    const commentLines = getLines(ctx, comment, contentWidth - 40);
    commentLines.forEach((line, index) => {
      ctx.fillText(line, 20, commentY + 25 + index * 20);
    });

    // Convert canvas to JPEG and trigger download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${department}_Vaktliste_Uke${selectedWeek}_${selectedYear}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  };
  const logoSrc = department === 'Isehaug Kafeteria' ? IsehaugKafeteriaLogo : JohansPubLogo;
  logo.src = logoSrc;
};

// Helper function to wrap text and respect line breaks
const getLines = (ctx, text, maxWidth) => {
  const lines = [];
  const paragraphs = text.split('\n');

  paragraphs.forEach(paragraph => {
    const words = paragraph.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  });

  return lines;
};

export default exportSchedule;