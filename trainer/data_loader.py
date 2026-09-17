import os
import glob
import pandas as pd

def find_dataset(data_dir="/data/raw"):
    """Discover dataset in the given directory."""
    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Validation Error: Data directory '{data_dir}' does not exist.")
    
    # Check for CSV files
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    if not csv_files:
        raise FileNotFoundError(
            "Validation Error: Dataset not found. Place the supplied hackathon dataset in /data/raw."
        )
    
    # Default to first CSV found
    return csv_files[0]

def load_data(file_path):
    """Load dataset, handle data quality, and report basic schema information."""
    print(f"Loading dataset from: {file_path}")
    
    # Validation: Is readable?
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Validation Error: Failed to read CSV file {file_path}. ({e})")
    
    # Validation: Is non-empty?
    if df.empty:
        raise ValueError("Validation Error: The provided dataset is entirely empty.")
        
    initial_rows = len(df)
    
    # Basic data quality: drop rows that are completely empty
    df = df.dropna(how='all')
    empty_rows = initial_rows - len(df)
    if empty_rows > 0:
        print(f" - Validation: Dropped {empty_rows} fully empty rows.")
        
    # Duplicate rows detection/removal
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        df = df.drop_duplicates()
        print(f" - Validation: Removed {dup_count} duplicate rows.")
        
    # Validation: Minimum usable row count
    if len(df) < 3:
        raise ValueError(f"Validation Error: Dataset has too few records ({len(df)}) for meaningful clustering (min 3 required).")
    
    # Validation: Detect columns with unusable values (all nulls)
    all_null_cols = df.columns[df.isnull().all()].tolist()
    if all_null_cols:
        print(f" - Validation: Dropping columns with 100% missing values: {all_null_cols}")
        df = df.drop(columns=all_null_cols)
        
    # Validation: Safely handle invalid numeric strings
    for col in df.columns:
        if df[col].dtype == 'object':
            # Attempt numeric coercion. If >50% values become valid numbers, keep it as numeric.
            coerced = pd.to_numeric(df[col], errors='coerce')
            if coerced.notna().sum() > (len(df) * 0.5):
                print(f" - Validation: Coerced string column '{col}' to numeric (invalid strings set to NaN).")
                df[col] = coerced
    
    # Report basic schema information
    print(f"Dataset validated. Total usable rows: {df.shape[0]}, Total columns: {df.shape[1]}")
    print("\nColumn Data Types:")
    for col, dtype in df.dtypes.items():
        print(f" - {col}: {dtype}")
        
    return df
