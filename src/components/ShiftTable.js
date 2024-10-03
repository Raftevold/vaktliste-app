import React, { Component } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import StrictModeDroppable from './StrictModeDroppable';

class ShiftTableComponent extends Component {
  drawToCanvas = (ctx, startX, startY, width, height, options = {}) => {
    const { employees, shifts, customShifts, days, weekDates } = this.props;
    const { employeeColumnWidth = width * 0.2, cellWidth, cellHeight } = options;
    
    // Filter out empty columns
    const nonEmptyDays = days.filter((day, index) => 
      employees.some(employee => shifts?.find(shift => shift?.employeeId === employee.id)?.[day])
    );

    const headerHeight = 60;
    const actualCellWidth = cellWidth || (width - employeeColumnWidth) / nonEmptyDays.length;
    const actualCellHeight = cellHeight || (height - headerHeight) / employees.length;

    // Set fonts with larger sizes
    const headerFont = 'bold 18px Arial';
    const dateFont = '19px Arial';
    const contentFont = '19px Arial';

    // Draw header
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(startX, startY, width, headerHeight);
    
    // Draw day names and dates
    ctx.fillStyle = '#333333';
    ctx.font = headerFont;
    ctx.textAlign = 'center';
    ctx.fillText('Ansatt', startX + employeeColumnWidth / 2, startY + 25);
    
    nonEmptyDays.forEach((day, index) => {
      const dayIndex = days.indexOf(day);
      const x = startX + employeeColumnWidth + actualCellWidth * index + actualCellWidth / 2;
      ctx.font = headerFont;
      ctx.fillText(day, x, startY + 25);
      ctx.font = dateFont;
      ctx.fillText(weekDates[dayIndex], x, startY + 50);
    });

    // Draw rows
    ctx.font = contentFont;
    employees.forEach((employee, rowIndex) => {
      const y = startY + headerHeight + rowIndex * actualCellHeight;
      ctx.fillStyle = employee.roleColor || '#ffffff';
      ctx.fillRect(startX, y, width, actualCellHeight);
      
      // Draw employee name
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText(employee.name, startX + 5, y + actualCellHeight / 2 + 6);

      // Draw shifts
      ctx.textAlign = 'center';
      nonEmptyDays.forEach((day, colIndex) => {
        const x = startX + employeeColumnWidth + actualCellWidth * colIndex + actualCellWidth / 2;
        const shiftId = shifts?.find(shift => shift?.employeeId === employee.id)?.[day];
        const shift = customShifts?.find(s => s.id === shiftId);
        if (shift) {
          ctx.fillStyle = '#333333';
          ctx.fillText(shift.shift, x, y + actualCellHeight / 2 + 6);
        }
      });
    });

    // Draw grid lines
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    ctx.moveTo(startX + employeeColumnWidth, startY);
    ctx.lineTo(startX + employeeColumnWidth, startY + headerHeight + employees.length * actualCellHeight);
    for (let i = 1; i <= nonEmptyDays.length; i++) {
      const x = startX + employeeColumnWidth + i * actualCellWidth;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + headerHeight + employees.length * actualCellHeight);
    }

    // Horizontal lines
    for (let i = 0; i <= employees.length; i++) {
      const y = startY + headerHeight + i * actualCellHeight;
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + width, y);
    }

    ctx.stroke();

    // Draw header separator
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY + headerHeight);
    ctx.lineTo(startX + width, startY + headerHeight);
    ctx.stroke();
  };

  render() {
    const { employees, shifts, customShifts, days, weekDates, updateShift, calculateTotalHours, onDragEnd } = this.props;

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="employees">
          {(provided) => (
            <table {...provided.droppableProps} ref={provided.innerRef}>
              <thead>
                <tr>
                  <th>Ansatt</th>
                  {days.map((day, index) => (
                    <th key={day}>
                      {day}
                      <br />
                      <span className="date">{weekDates[index]}</span>
                    </th>
                  ))}
                  <th>Timer</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((employee, index) => (
                  <Draggable key={employee.id} draggableId={employee.id} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: snapshot.isDragging
                            ? '#f0f0f0'
                            : employee.roleColor || '#ffffff'
                        }}
                      >
                        <td>{employee.name}</td>
                        {days.map(day => (
                          <td key={`${employee.id}-${day}`}>
                            <select
                              value={shifts?.find(shift => shift?.employeeId === employee.id)?.[day] || ''}
                              onChange={(e) => updateShift(employee.id, day, e.target.value)}
                            >
                              <option value=""></option>
                              {customShifts?.map(shift => (
                                <option key={shift.id} value={shift.id}>
                                  {shift.shift}
                                </option>
                              ))}
                            </select>
                          </td>
                        ))}
                        <td>{calculateTotalHours(employee).toFixed(1)}</td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    );
  }
}

const ShiftTable = React.forwardRef((props, ref) => {
  return <ShiftTableComponent {...props} ref={ref} />;
});

export default ShiftTable;