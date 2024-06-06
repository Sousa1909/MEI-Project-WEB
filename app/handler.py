import sqlite3
import re
from app import app
from flask_socketio import SocketIO, emit

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Function that saves to sqlite
def save_to_db(sender_id, generated_number, timestamp):
    conn = sqlite3.connect('app/db/data.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO data (sender_id, generated_number, timestamp) 
        VALUES (?, ?, ?)
    ''', (sender_id, generated_number, timestamp))
    conn.commit()
    conn.close()

# Function to process the received data
def process_received_data(data, timestamp):
    sender_id = data.get('sender_id')
    generated_number = data.get('generated_number')
    print(f"Received data from {sender_id}: Generated Number = {generated_number} at {timestamp}")

    # Save data to the database
    save_to_db(sender_id, generated_number, timestamp)

    socketio.emit(
        'update_data',
        {
            'sender_id': sender_id,
            'generated_number': generated_number,
        }
    )

    # Return any response if needed
    return 'Data received successfully', 200

# Function that sorts sender_ids
def alphanumeric_sort(sender_ids):
    def sort_key(value):
        parts = re.split(r'(\d+)', value)
        return [int(part) if part.isdigit() else part for part in parts]
    return sorted(sender_ids, key=sort_key)