import React, { Component } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import StrictModeDroppable from './StrictModeDroppable';

class ShiftTableComponent extends Component {
  drawToCanvas = (ctx, startX, startY, width, height) => {
    const { employees, shifts, customShifts, days, weekDates } = this.props;
    
    // Filter out empty columns
    const nonEmptyDays = days.filter((day, index) => 
      employees.some(employee => shifts?.find(shift => shift?.employeeId === employee.id)?.[day])
    );

    const cellWidth = width / (nonEmptyDays.length + 1);
    const headerHeight = 50;
    const cellHeight = (height - headerHeight) / employees.length;

    // Set fonts
    const headerFont = 'bold 14px Arial';
    const dateFont = '12px Arial';
    const contentFont = '13px Arial';

    // Draw header
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(startX, startY, width, headerHeight);
    
    // Draw day names and dates
    ctx.fillStyle = '#333333';
    ctx.font = headerFont;
    ctx.fillText('Ansatt', startX + 5, startY + 20);
    
    nonEmptyDays.forEach((day, index) => {
      const dayIndex = days.indexOf(day);
      const x = startX + cellWidth * (index + 1) + 5;
      ctx.font = headerFont;
      ctx.fillText(day, x, startY + 20);
      ctx.font = dateFont;
      ctx.fillText(weekDates[dayIndex], x, startY + 40);
    });

    // Draw rows
    ctx.font = contentFont;
    employees.forEach((employee, rowIndex) => {
      const y = startY + headerHeight + rowIndex * cellHeight;
      ctx.fillStyle = employee.roleColor || '#ffffff';
      ctx.fillRect(startX, y, width, cellHeight);
      ctx.fillStyle = '#333333';
      ctx.fillText(employee.name, startX + 5, y + cellHeight / 2 + 5);

      nonEmptyDays.forEach((day, colIndex) => {
        const x = startX + cellWidth * (colIndex + 1) + 5;
        const shiftId = shifts?.find(shift => shift?.employeeId === employee.id)?.[day];
        const shift = customShifts?.find(s => s.id === shiftId);
        if (shift) {
          ctx.fillStyle = '#333333';
          ctx.fillText(shift.shift, x, y + cellHeight / 2 + 5);
        }
      });
    });

    // Draw grid lines
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    for (let i = 0; i <= nonEmptyDays.length + 1; i++) {
      const x = startX + i * cellWidth;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + headerHeight + employees.length * cellHeight);
    }

    // Horizontal lines
    for (let i = 0; i <= employees.length; i++) {
      const y = startY + headerHeight + i * cellHeight;
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