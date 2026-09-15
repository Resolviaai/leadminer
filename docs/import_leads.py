import csv
import mysql.connector

# --- MySQL connection settings ---
db_config = {
    'host': '127.0.0.1',       # MySQL running in Docker, localhost from host
    'user': 'root',
    'password': 'rohit',
    'database': 'resolvia_db',
    'port': 3306
}

# --- CSV file path ---
csv_file = r"C:\DUMP\82 Million Part-2.csv"  # Windows path

# --- Batch size ---
batch_size = 10000  # insert 10k rows at a time

# Connect to MySQL
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Open CSV and read in batches
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=',', quotechar='"')
    headers = next(reader)  # skip header row
    
    batch = []
    for i, row in enumerate(reader, start=1):
        # Make sure row has exactly 17 columns
        row = row[:17] + ['']*(17 - len(row))
        batch.append(row)
        
        if i % batch_size == 0:
            cursor.executemany("""
                INSERT INTO leads (
                    first_name, middle_name, last_name, title, company_name, mailing_address,
                    primary_city, primary_state, zip_code, country, phone, web_address, email,
                    revenue, employee, industry, sub_industry
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, batch)
            conn.commit()
            print(f"{i} rows inserted")
            batch = []

    # Insert remaining rows
    if batch:
        cursor.executemany("""
            INSERT INTO leads (
                first_name, middle_name, last_name, title, company_name, mailing_address,
                primary_city, primary_state, zip_code, country, phone, web_address, email,
                revenue, employee, industry, sub_industry
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, batch)
        conn.commit()
        print(f"{i} rows inserted (final batch)")

cursor.close()
conn.close()
print("Import complete!")
