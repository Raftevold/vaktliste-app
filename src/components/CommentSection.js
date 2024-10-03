import React from 'react';

const CommentSection = ({ selectedWeek, comment, handleCommentChange }) => {
  return (
    <div className="comment-section">
      <h3>Kommentar for uke {selectedWeek}</h3>
      <textarea
        className="comment-textarea"
        value={comment}
        onChange={handleCommentChange}
        placeholder="Skriv en kommentar for denne uken..."
        rows="4"
        style={{ width: '50%', minHeight: '100px', padding: '10px' }}
      />
    </div>
  );
};

export default CommentSection;