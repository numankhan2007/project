import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    try:
        # Connect to default 'postgres' database
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='Numan@2007',
            host='localhost',
            port='5432'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'UNIMART_LOCAL'")
        exists = cur.fetchone()
        
        if not exists:
            cur.execute('CREATE DATABASE "UNIMART_LOCAL"')
            print("Database 'UNIMART_LOCAL' created successfully!")
        else:
            print("Database 'UNIMART_LOCAL' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
