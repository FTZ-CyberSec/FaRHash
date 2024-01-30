import './page-style.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Make sure to install axios with `npm install axios`
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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


function CalcFarHash() {
  const [schemas, setSchemas] = useState({}); // State to hold all available schemas
  const [selectedSchema, setSelectedSchema] = useState(''); // State to hold the selected schema name
  const [seedValue, setSeedValue] = useState(''); // State to hold the seed value
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'success', or 'failure'
  const navigate = useNavigate(); // For programmatically navigating
  const [attributes, setAttributes] = useState({
    static: [''],
    dynamic: [''],
    volatile: ['']
  });
  const [farHashValue, setFarHashValue] = useState(''); // State to hold the Far Hash value

  useEffect(() => {
    // Fetch schemas when the component mounts
    const fetchSchemas = async () => {
      try {
        const response = await axios.get('http://localhost:5000/schemas');
        setSchemas(response.data);
      } catch (error) {
        console.error('Error fetching schemas:', error);
        // Handle error appropriately
      }
    };
    fetchSchemas();
  }, []);

  const updateFarHashAndSeed = async () => {
    const hasNonEmptyAttribute = Object.values(attributes).some(
      category => category.some(attr => attr.trim() !== '')
    );
    try {
      if (hasNonEmptyAttribute) {

        // Assume calculate-far-hash is a synchronous function for client-side hashing
        // If it's an API call, you'll need to await it
        const farHash = calculateFarHash(attributes.static, attributes.dynamic, attributes.volatile);
        const newSeed = calculateSeed(attributes.static, attributes.dynamic, attributes.volatile);

        setSeedValue(newSeed);
        setFarHashValue(farHash);
        // setSeed(newSeed);
      } else {
        // If all fields are empty, reset the seed and Far Hash values
        setSeedValue('');
        setFarHashValue('');
      }

    } catch (error) {
      console.error('Error while calculating Far Hash:', error);
      // Optionally handle the error, e.g. show an error message
    }
  };
  const debouncedUpdateFarHash = debounce(updateFarHashAndSeed, 500);
  useEffect(() => {
    if (attributes.static.length > 0 || attributes.dynamic.length > 0 || attributes.volatile.length > 0) {
      debouncedUpdateFarHash();
      updateFarHashAndSeed();
    }
  }, [attributes]); // Call debouncedUpdateFarHash whenever attributes change

  // Function to handle schema selection
  const handleSchemaSelection = (e) => {
    setSelectedSchema(e.target.value);
    const selected = schemas[e.target.value];
    if (selected) {
      setAttributes({
        static: selected.static || [''],
        dynamic: selected.dynamic || [''],
        volatile: selected.volatile || ['']
      });
    }
  };

  const handleConfirm = async () => {
    setIsModalOpen(false);

    try {
      const response = await axios.post('http://localhost:5000/calculate-far-hash', {
        static: attributes.static,
        dynamic: attributes.dynamic,
        volatile: attributes.volatile,
      });
      console.log("response is" + response);
      if (response.status === 200 && response.data.far_hash) {
        setSubmissionStatus('success');
        setFarHashValue(response.data.far_hash); // Update the Far Hash value state
        setSeedValue(response.data.seed); // Also store the seed value

        console.log('Far Hash:', response.data.far_hash);
        // Reset the form fields after a short delay to show the success message
        setTimeout(() => {
          setAttributes({ static: [''], dynamic: [''], volatile: [''] });
          setSubmissionStatus(null); // Remove the notification message
        }, 2000);
      }
      else {
        setSubmissionStatus('failure');
        // Do not refresh, allow the user to see the error and keep the inputs
      }
    } catch (error) {
      console.error('Error while calculating Far Hash:', error);
      setSubmissionStatus('failure');
      // Do not refresh, allow the user to see the error and keep the inputs
    }
    setTimeout(() => {
      setSubmissionStatus(null);
    }, 2000); // Clear the notification after 2 seconds
  };

  const Notification = ({ message, type, onDismiss }) => {
    return (
      <div className={`notification ${type}`}>
        {message}
        {/* <button onClick={onDismiss} className="notification-dismiss-btn">X</button> */}
      </div>
    );
  };

  // When rendering the Notification component:
  {
    submissionStatus && (
      <Notification
        message={submissionStatus === 'success' ? 'Calculation successful!' : 'Submission failed. Please try again.'}
        type={submissionStatus}
        onDismiss={() => setSubmissionStatus(null)}
      />
    )
  }

  const handleCancel = () => {
    setIsModalOpen(false);
    // You might also want to clear the form or handle cancellation differently
  };

  if (submissionStatus) {
    const message = submissionStatus === 'success'
      ? 'Submission successful!'
      : 'Submission failed. Please try again.';

    return (
      <Notification
        message={message}
        type={submissionStatus} // 'success' or 'failure'
      />
    );
  }

  const calculateSeed = debounce(async () => {
    try {
      const response = await axios.post('http://localhost:5000/calculate-far-hash', {
        static: attributes.static,
        dynamic: attributes.dynamic,
        volatile: attributes.volatile,
      });

      if (response.status === 200 && response.data.far_hash) {
        setSeedValue(response.data.seed);
      }
    } catch (error) {
      console.error('Error while calculating Far Hash:', error);
    }
  }, 500); // Waits for 500ms after the last change to calculate the Far Hash


  // Debounced function for calculating Far Hash
  const calculateFarHash = debounce(async () => {
    try {
      const response = await axios.post('http://localhost:5000/calculate-far-hash', {
        static: attributes.static,
        dynamic: attributes.dynamic,
        volatile: attributes.volatile,
      });

      if (response.status === 200 && response.data.far_hash) {
        setFarHashValue(response.data.far_hash);
      }
    } catch (error) {
      console.error('Error while calculating Far Hash:', error);
    }
  }, 500); // Waits for 500ms after the last change to calculate the Far Hash


  // Modify your handleInputChange to use the debounced calculation
  const handleInputChange = (type, index, value) => {
    const updated = [...attributes[type]];
    updated[index] = value;
    setAttributes({ ...attributes, [type]: updated });
    calculateFarHash(); // Trigger the debounced Far Hash calculation
  };

  const addInputField = (type) => {
    const updated = [...attributes[type], ''];
    setAttributes({ ...attributes, [type]: updated });
  };

  const removeInputField = (type, index) => {
    const updated = attributes[type].filter((_, idx) => idx !== index);
    setAttributes({ ...attributes, [type]: updated });
  };

  const sendAttributes = () => {
    setIsModalOpen(true); // Open the modal           
    console.log('Submitted Attributes:', attributes);
  };

  function downloadTextFile(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  const downloadFarHashAndSeed = () => {
    const content = `Seed: ${seedValue}\nFar Hash: ${farHashValue}`;
    downloadTextFile('farhash-and-seed.txt', content);
  };

  const downloadAttributes = () => {
    const content = JSON.stringify(attributes, null, 2);
    downloadTextFile('attributes.json', content);
  };
  

  function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };



  return (

    <div>
      {/* Display the entered attributes and the Far Hash value */}
      {(seedValue || farHashValue) && (
        <div className="results-container">
          <h3>Entered Attributes:</h3>
          <button className="download-btn" onClick={downloadAttributes}>Download Attributes</button>

          <div className="entered-attributes">
            {Object.keys(attributes).map(category => (
              <div key={category}>
                <h4>{category.charAt(0).toUpperCase() + category.slice(1)}:</h4>
                <ul>
                  {attributes[category].map((value, index) => (
                    <li key={index}>{value || '[empty]'}</li> // Display [empty] if the value is an empty string
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="far-hash-result">
            {/* <h3>Calculated Values:</h3> */}
            <p><strong>Seed:</strong> {seedValue}</p>
            <p><strong>Far Hash:</strong> {farHashValue}</p>
            <button className="download-btn" onClick={downloadFarHashAndSeed}>Download Far Hash & Seed</button>     
          </div>
        </div>
      )}
      <div className="farHash-page">
        <h2>Enter attributes</h2>

        <div>
          {/* <label>Select Schema: </label> */}
          <select className="custom-select" onChange={handleSchemaSelection} value={selectedSchema}>
            <option value="">Select a schema</option>
            {Object.keys(schemas).map(schemaName => (
              <option key={schemaName} value={schemaName}>{schemaName}</option>
            ))}
          </select>
        </div>

        {/* Dynamically render input fields based on the selected schema */}
        {Object.keys(attributes).map((type) => (
          <div key={type} className="attribute-section">
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            {attributes[type].map((attr, index) => (
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


        {/* <button className="send-btn" onClick={sendAttributes}>Calculate Far Hash</button> */}

        {submissionStatus && ( // This will now render in addition to the form, not instead of it
          <Notification
            message={submissionStatus === 'success' ? 'Calculation successful!' : 'Calculation failed. Please try again.'}
            type={submissionStatus}
          />
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        content={JSON.stringify(attributes, null, 2)}
      />
    </div>
  );
}

export default CalcFarHash;
