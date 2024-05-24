import sqlite3

def init_db():
    conn = sqlite3.connect('app/db/data.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id TEXT NOT NULL,
            generated_number INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()