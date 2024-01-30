import React, { useState } from 'react';
import axios from 'axios'; // Make sure axios is installed
import { useNavigate } from 'react-router-dom';
import './page-style.css';
import './schema_notification.css';


function Modal({ isOpen, onConfirm, onClose, content }) {
    if (!isOpen) return null;
  
    return (
        <div className="modal-overlay" style={{ display: isOpen ? 'flex' : 'none' }}>
          <div className="modal-content">
            <pre>{content}</pre>
            <button onClick={onConfirm}>Confirm</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      );
    }
  

function Notification({ message, type, onDismiss }) {
  return (
    <div className={`notification ${type}`}>
      {message}
      <button onClick={onDismiss} className="notification-dismiss-btn">X</button>
    </div>
  );
}

function AddSchemaPage() {
  const [schemaName, setSchemaName] = useState(''); // To store the name of the schema

  const [schema, setSchema] = useState({ static: [''], dynamic: [''], volatile: [''] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'success', or 'failure'
  const [submissionMessage, setSubmissionMessage] = useState(''); // To store the message from the backend

  const navigate = useNavigate(); // For programmatically navigating

  const handleConfirm = async () => {
    setIsModalOpen(false);
    
    try {
      // Send the schema to the backend
      const response = await axios.post('http://localhost:5000/add-schema', {
        name: schemaName,
        attributes: schema
      });

      // Check the response from the backend
      if (response.status === 201 && response.data.message) {
        setSubmissionStatus('success');
        setSubmissionMessage(response.data.message); // Update the message
      } else {
      // The server responded with a status other than 201
      setSubmissionStatus('failure');
      setSubmissionMessage('Failed to add the schema. Please try again.');
    }
  } catch (error) {
    setSubmissionStatus('failure');
  if (error.response && error.response.data && error.response.data.error) {
    // Check if the error message is about the duplicate schema name
    if (error.response.data.error === "The schema name already exists. Choose a new name") {
      setSubmissionMessage("The schema name already exists. Please choose a new name.");
    } else {
      // Handle other types of errors
      setSubmissionMessage(error.response.data.error);
    }
  } else {
    // Handle errors without a specific message from the server
    setSubmissionMessage("An error occurred. Please try again.");
  }
  }
  setTimeout(() => {
    setSubmissionStatus(null);
  }, 4000); // Clear the notification after 4 seconds
  };


  const Notification = ({ message, type, onDismiss }) => {
    return (
      <div className={`notification ${type}`}>
        {message}
        {/* <button onClick={onDismiss} className="notification-dismiss-btn"></button> */}
      </div>
    );
  };

  // Add this function to dismiss the notification
  const dismissNotification = () => {
    setSubmissionStatus(null);
    setSubmissionMessage('');
  };

    // Render the notification message based on the submission status
    const renderNotification = () => {
      if (submissionStatus) {
        // Use the specific message set in the submissionMessage state
        const message = submissionStatus === 'success'
          ? 'Schema Added Successfully. Choose it when calculating FaR Hash'
          : submissionMessage; // Use the specific failure message from the backend
  
        return (
          <Notification 
            message={message} 
            type={submissionStatus} // 'success' or 'failure'
          />
        );
      }
      return null;
    };

  const handleCancel = () => {
    setIsModalOpen(false);
    // You might also want to clear the form or handle cancellation differently
  };

  const handleInputChange = (type, index, value) => {
    const updated = [...schema[type]];
    updated[index] = value;
    setSchema({ ...schema, [type]: updated });
  };

  const addInputField = (type) => {
    const updated = [...schema[type], ''];
    setSchema({ ...schema, [type]: updated });
  };

  const removeInputField = (type, index) => {
    const updated = schema[type].filter((_, idx) => idx !== index);
    setSchema({ ...schema, [type]: updated });
  };

  
  const submitSchema = () => {
    setIsModalOpen(true); // Open the modal
    const schemaJSON = JSON.stringify(schema, null, 2); // Pretty print JSON
    // alert(`Confirm Schema Submission:\n${schemaJSON}`);        
    console.log('Submitted Schema:', schema);
  };

  return (
    <div>
    <div className="schema-page">
      <h2>Add Schema</h2>
      <input 
        className="attribute-input"
        type="text" 
        value={schemaName} 
        onChange={(e) => setSchemaName(e.target.value)} 
        placeholder="Enter new schema name"
      />
      {Object.keys(schema).map((type) => (
        <div key={type} className="attribute-section">
          <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
          {schema[type].map((attr, index) => (
            <div key={index} className="attribute-input-group">
              <input 
                className="attribute-input"
                type="text" 
                value={attr} 
                onChange={(e) => handleInputChange(type, index, e.target.value)} 
              />
              <button className="add-remove-btn" onClick={() => addInputField(type)}>+</button>
              {index > 0 && (
                <button className="add-remove-btn" onClick={() => removeInputField(type, index)}>-</button>
              )}
            </div>
          ))}
        </div>
      ))}
      <button className="submit-btn" onClick={submitSchema}>Submit Schema</button>
      

      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCancel} 
        onConfirm={handleConfirm} // You'll need to add this to your Modal component
        content={JSON.stringify(schema, null, 2)} 
      />
      {renderNotification()}
    </div>
  );
}

export default AddSchemaPage;
