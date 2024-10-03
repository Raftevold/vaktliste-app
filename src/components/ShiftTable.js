import React, { Component } from 'react';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import StrictModeDroppable from './StrictModeDroppable';
import { getSafe } from '../utils/dateUtils';

class ShiftTableComponent extends Component {
  drawToCanvas = (ctx, startX, startY, width, height, options = {}) => {
    const { employees, shifts, customShifts, days, weekDates } = this.props;
    const { employeeColumnWidth = width * 0.2, cellWidth, cellHeight } = options;
    
    // Ensure all required props are available
    if (!employees || !shifts || !customShifts || !days || !weekDates) {
      console.error('Missing required props in ShiftTable');
      return;
    }

    // Filter out empty columns
    const nonEmptyDays = days.filter((day) => 
      employees.some((employee) => 
        getSafe(() => shifts.find(shift => shift.employeeId === employee.id)?.[day], undefined) !== undefined
      )
    );

    const headerHeight = 60;
    const actualCellWidth = cellWidth || (width - employeeColumnWidth) / (nonEmptyDays.length || 1);
    const actualCellHeight = cellHeight || (height - headerHeight) / (employees.length || 1);

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
      const dayIndex = getSafe(() => days.indexOf(day), -1);
      if (dayIndex !== -1) {
        const x = startX + employeeColumnWidth + actualCellWidth * index + actualCellWidth / 2;
        ctx.font = headerFont;
        ctx.fillText(day, x, startY + 25);
        ctx.font = dateFont;
        ctx.fillText(getSafe(() => weekDates[dayIndex], ''), x, startY + 50);
      }
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
      ctx.fillText(employee.name || '', startX + 5, y + actualCellHeight / 2 + 6);

      // Draw shifts
      ctx.textAlign = 'center';
      nonEmptyDays.forEach((day, colIndex) => {
        const x = startX + employeeColumnWidth + actualCellWidth * colIndex + actualCellWidth / 2;
        const shiftId = getSafe(() => shifts.find(shift => shift.employeeId === employee.id)?.[day], undefined);
        const shift = getSafe(() => customShifts.find(s => s.id === shiftId), undefined);
        if (shift) {
          ctx.fillStyle = '#333333';
          ctx.fillText(shift.shift || '', x, y + actualCellHeight / 2 + 6);
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

    // Ensure all required props are available
    if (!employees || !shifts || !customShifts || !days || !weekDates) {
      console.error('Missing required props in ShiftTable');
      return null;
    }

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
                      <span className="date">{getSafe(() => weekDates[index], '')}</span>
                    </th>
                  ))}
                  <th>Timer</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <Draggable key={getSafe(() => employee.id, `employee-${index}`)} draggableId={getSafe(() => employee.id, `employee-${index}`)} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: snapshot.isDragging
                            ? '#f0f0f0'
                            : getSafe(() => employee.roleColor, '#ffffff')
                        }}
                      >
                        <td>{getSafe(() => employee.name, '')}</td>
                        {days.map(day => (
                          <td key={`${getSafe(() => employee.id, `employee-${index}`)}-${day}`}>
                            <select
                              value={getSafe(() => shifts.find(shift => shift.employeeId === employee.id)?.[day], '')}
                              onChange={(e) => updateShift(employee.id, day, e.target.value)}
                            >
                              <option value=""></option>
                              {customShifts.map(shift => (
                                <option key={getSafe(() => shift.id, `shift-${shift.shift}`)} value={getSafe(() => shift.id, '')}>
                                  {getSafe(() => shift.shift, '')}
                                </option>
                              ))}
                            </select>
                          </td>
                        ))}
                        <td>{getSafe(() => calculateTotalHours(employee).toFixed(1), '0.0')}</td>
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