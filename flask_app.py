from flask import Flask, request, jsonify

import farHash_algo as fh

# Initialize with a default schema
schemas = {
    "default_schema": {
        "static": ["default_static1", "default_static2"],
        "dynamic": ["default_dynamic1", "default_dynamic2"],
        "volatile": ["default_volatile1", "default_volatile2"]
    },
    "industry_robot_v1.0":{        
        "static": ["Device ID", "MAC Address", "PUF key (for demo)", "Device Type/Model"],
        "dynamic": ["Device Location", "Data Transmission Rate"],
        "volatile": ["IP Address", "packet transmission/sec"]
    }
}

app = Flask(__name__)

# Assume all previous function definitions are here (hash_attribute, calculate_seed, etc.)
# ... (include all the function definitions from your previous code) ...

@app.route('/calculate-far-hash', methods=['POST'])
def calculate_far_hash():
    data = request.json
    print("data is :", data)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        static_attributes = data.get('static', [])
        dynamic_attributes = data.get('dynamic', [])
        volatile_attributes = data.get('volatile', [])

        # Calculate the seed
        seed = fh.calculate_seed(static_attributes, dynamic_attributes, volatile_attributes)
        
        # Generate the Far Hash
        far_hash = fh.generate_far_hash(static_attributes, dynamic_attributes, volatile_attributes, seed)

        # Update records (if needed)
        fh.update_far_hash_record(static_attributes, dynamic_attributes, volatile_attributes, seed, far_hash)
        
        # Return the Far Hash
        return jsonify({"far_hash": far_hash, "seed": seed}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/verify-far-hash', methods=['POST'])
def verify_far_hash():

    # Get data from request
    # Calculate the far hash and seed based on the attributes
    # Compare with the user-provided far hash and seed
    # Return the result of the comparison
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        static_attributes = data.get('static', [])
        dynamic_attributes = data.get('dynamic', [])
        volatile_attributes = data.get('volatile', [])   
        far_hash = data.get('far_hash',[])    
        seed = data.get('seed', [])        
 
        new_far_hash = fh.generate_far_hash(static_attributes, dynamic_attributes, volatile_attributes, seed)
        similarity_percent = fh.compare_string(far_hash, new_far_hash)
        return jsonify({"far_hash": new_far_hash, "similarity": similarity_percent}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/add-schema', methods=['POST'])
def add_schema():
    new_schema = request.json
    schema_name = new_schema.get('name')
    print(" Name of new schema is: ", schema_name)

    print("new schema is: ", new_schema)
    # Check if the name of the new schema already exists
    if schema_name in schemas:
        return jsonify({"error": "The schema name already exists. Choose a new name"}), 400

    # Add the new schema
    schemas[schema_name] = new_schema.get('attributes', {})
    return jsonify({"message": "New schema added successfully", "schemas": schemas}), 201

@app.route('/schemas', methods=['GET'])
def get_schemas():
    return jsonify(schemas), 200

if __name__ == '__main__':
    app.run(debug=True)
