import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import re

class FeatureEngineer:
    def __init__(self):
        self.numerical_features = []
        self.categorical_features = []
        self.preprocessor = None
        self.configured = False
        
    def _is_likely_id(self, col_name, dtype):
        """Heuristic to detect ID columns."""
        col_lower = col_name.lower()
        if dtype == 'object' and ('id' in col_lower or 'uuid' in col_lower or 'hash' in col_lower):
            return True
        if 'id' == col_lower or col_lower.endswith('_id'):
            return True
        return False
        
    def configure(self, df):
        """
        Inspect actual dataframe columns at runtime and dynamically identify features.
        """
        print("\nConfiguring feature engineering based on actual schema...")
        
        for col in df.columns:
            dtype = df[col].dtype
            
            # Skip obvious IDs or labels
            if self._is_likely_id(col, dtype):
                print(f" - Excluded apparent ID column: {col}")
                continue
                
            if 'label' in col.lower() or 'target' in col.lower():
                 print(f" - Excluded apparent target/label column: {col}")
                 continue
                 
            # Detect numerical behavioral features
            if pd.api.types.is_numeric_dtype(dtype):
                self.numerical_features.append(col)
                print(f" - Identified numerical feature: {col}")
            # Detect categorical/genre features
            elif pd.api.types.is_string_dtype(dtype) or pd.api.types.is_object_dtype(dtype):
                # Basic cardinality check to avoid treating unique strings as categories
                if df[col].nunique() < min(50, len(df) / 2):
                    self.categorical_features.append(col)
                    print(f" - Identified categorical feature: {col}")
                else:
                    print(f" - Excluded high-cardinality string column: {col}")

        if not self.numerical_features and not self.categorical_features:
            raise ValueError(
                "Validation Error: No usable behavioral (numeric) or categorical features found. "
                "Ensure the dataset contains variance and numeric/string columns that are not just IDs."
            )
            
        # Build standard sklearn preprocessor
        transformers = []
        if self.numerical_features:
            num_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('num', num_transformer, self.numerical_features))
            
        if self.categorical_features:
            cat_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('cat', cat_transformer, self.categorical_features))
            
        self.preprocessor = ColumnTransformer(transformers=transformers)
        self.configured = True
        
    def fit_transform(self, df):
        """Fit and transform using the preprocessor."""
        if not self.configured:
            raise RuntimeError("FeatureEngineer must be configured before use.")
            
        print("\nApplying feature engineering pipeline (imputation + scaling + encoding)...")
        return self.preprocessor.fit_transform(df)
    
    def transform(self, df):
        """Transform new data."""
        if not self.configured:
            raise RuntimeError("FeatureEngineer must be configured before use.")
            
        # Ensure we don't fail if input DataFrame is missing columns that we drop/ignore anyway.
        expected_cols = self.numerical_features + self.categorical_features
        # Fill missing expected columns with NaN so imputer can handle them
        for col in expected_cols:
            if col not in df.columns:
                df[col] = pd.NA
                
        return self.preprocessor.transform(df)
