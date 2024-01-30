import hashlib
from Levenshtein import distance

# Global dictionary to store attributes, seed, and their hashes
far_hash_records = {}

# Function definitions
def hash_attribute(attribute, hash_function='sha3_256'):
    hasher = hashlib.new(hash_function)
    hasher.update(str(attribute).encode())
    return hasher.hexdigest()

def hash_two_strings(string1, string2, hash_function='sha256'):
    combined_string = string1 + string2
    return hash_attribute(combined_string, hash_function)

# Assume all previous function definitions are here (hash_attribute, calculate_seed, etc.)
def hash_attribute(attribute, hash_function='sha3_256'):
    """Hash an attribute using the specified hash function."""
    hasher = hashlib.new(hash_function)
    hasher.update(str(attribute).encode())
    return hasher.hexdigest()

def calculate_seed(static_attrs, dynamic_attrs, volatile_attrs):
    """Calculate the composite seed from all attributes."""
    all_attrs = ''.join(static_attrs + dynamic_attrs + volatile_attrs)
    seed = hash_attribute(all_attrs)
    return seed

def sliding_window_operation(hash_value):
    """Perform a sliding window operation on the hash value."""
    window_size = 4
    deterministic_output = ''

    for i in range(0, len(hash_value), window_size):
        window = hash_value[i:i + window_size]
        sum_unicode = sum(ord(char) for char in window)
        position = sum_unicode % window_size

        selected_char = window[position]
        deterministic_output += selected_char

    return deterministic_output


def generate_far_hash(static_attrs, dynamic_attrs, volatile_attrs, seed):
    hashed_static = [hash_attribute(attr) for attr in static_attrs]
    hashed_dynamic = [hash_attribute(attr) for attr in dynamic_attrs]
    hashed_volatile = [hash_attribute(attr) for attr in volatile_attrs]

    seed_static_combined = hash_attribute(seed + ''.join(hashed_static))

    # Further hash each element of the lists using hash_two_strings
    further_hashed_static = [hash_two_strings(seed_static_combined, h_attr) for h_attr in hashed_static]
    further_hashed_dynamic = [hash_two_strings(seed_static_combined, h_attr) for h_attr in hashed_dynamic]
    further_hashed_volatile = [hash_two_strings(seed_static_combined, h_attr) for h_attr in hashed_volatile]

    fuzzified_hash = ''
    for attr, hash_val in zip(static_attrs + dynamic_attrs + volatile_attrs, further_hashed_static + further_hashed_dynamic + further_hashed_volatile):
        if attr in static_attrs or attr in dynamic_attrs:
            fuzzified_hash += sliding_window_operation(hash_val[:32])
            
        elif attr in volatile_attrs:
            fuzzified_hash += hash_val[:1]  # Take only 1 bit

    return fuzzified_hash

def compare_string(baseString, string2):
    lev_distance = distance(baseString, string2)
    similarity_percent = round((len(baseString) - lev_distance)*100/len(baseString))
    if(similarity_percent<0):
        similarity_percent=0
    print(f"The similarity percent is {similarity_percent}.")
    return similarity_percent


def update_far_hash_record(static_attrs, dynamic_attrs, volatile_attrs, seed, far_hash):
    """Update the global dictionary with new attribute sets under the corresponding seed."""
    attr_set = {'static': static_attrs, 'dynamic': dynamic_attrs, 'volatile': volatile_attrs, 'far_hash': far_hash}

    # Check if the seed exists in the records
    if seed in far_hash_records:
        # Check if the far_hash already exists for this seed
        for version, record in far_hash_records[seed].items():
            if record['far_hash'] == far_hash:
                # Far hash already exists, no need to add a new entry
                return
    
    # Add a new entry
    version = max(far_hash_records.get(seed, {0: None}).keys()) + 1
    far_hash_records.setdefault(seed, {})[version] = attr_set
    

# Dummy input attributes
# static_attrs = ["stac1", "static2"]
# dynamic_attrs = ["dyamic1", "dynamsic2"]
# volatile_attrs = ["voate1", "voaile2"]

# # Calculate seed and Far Hash
# # seed = calculate_seed(static_attrs, dynamic_attrs, volatile_attrs)
# far_hash, further_hashed_static, further_hashed_dynamic, further_hashed_volatile = generate_far_hash(static_attrs, dynamic_attrs, volatile_attrs, "333fba1c4f3274d9b56beece221aaf00e998221d28a1e60325394eb4d74833ef")

# print("\n", far_hash)