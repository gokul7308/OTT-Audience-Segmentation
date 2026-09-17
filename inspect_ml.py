import pandas as pd

print("=== USERS ===")
users_cols = ['UserID', 'Gender', 'Age', 'Occupation', 'Zip-code']
users = pd.read_csv('data/raw/users.dat', sep='::', engine='python', names=users_cols, encoding='latin-1')
print(f"File: users.dat")
print(f"Records: {len(users)}")
print(f"Columns: {users.columns.tolist()}")
print(f"Data types:\n{users.dtypes}")
print(f"Missing values:\n{users.isnull().sum()}")
print(f"Duplicates: {users.duplicated().sum()}")
print(users.head(3))

print("\n=== MOVIES ===")
movies_cols = ['MovieID', 'Title', 'Genres']
movies = pd.read_csv('data/raw/movies.dat', sep='::', engine='python', names=movies_cols, encoding='latin-1')
print(f"File: movies.dat")
print(f"Records: {len(movies)}")
print(f"Columns: {movies.columns.tolist()}")
print(f"Data types:\n{movies.dtypes}")
print(f"Missing values:\n{movies.isnull().sum()}")
print(f"Duplicates: {movies.duplicated().sum()}")
print(movies.head(3))

print("\n=== RATINGS ===")
ratings_cols = ['UserID', 'MovieID', 'Rating', 'Timestamp']
ratings = pd.read_csv('data/raw/ratings.dat', sep='::', engine='python', names=ratings_cols, encoding='latin-1')
print(f"File: ratings.dat")
print(f"Records: {len(ratings)}")
print(f"Columns: {ratings.columns.tolist()}")
print(f"Data types:\n{ratings.dtypes}")
print(f"Missing values:\n{ratings.isnull().sum()}")
print(f"Duplicates: {ratings.duplicated().sum()}")
print(ratings.head(3))
