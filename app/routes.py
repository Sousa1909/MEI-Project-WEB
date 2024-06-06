import sqlite3
from datetime import datetime
from flask import render_template, request, jsonify
from app import app
from app.handler import process_received_data, alphanumeric_sort

# Global variables to store received data
sender_id = None
generated_number = None

# Route for main page
@app.route('/', methods=['GET'])
def index():
    return render_template(
        'mainDashboard.html',
        sender_id=sender_id,
        generated_number=generated_number
    )

# Fetches data to populate the cards in the main page
@app.route('/get_latest_data')
def get_latest_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sender_id, generated_number, timestamp 
            FROM data 
            WHERE timestamp IN (SELECT MAX(timestamp) FROM data GROUP BY sender_id)
        """)
        rows = cursor.fetchall()
        conn.close()

        data = [{'sender_id': row[0], 'generated_number': row[1], 'timestamp': row[2]} for row in rows]
        return jsonify(data)
    except Exception as e:
        return str(e), 500



# Receives data form dataGenerator.py
@app.route('/receive_data', methods=['POST'])
def receive_data():
    data = request.json  # Parse JSON data from the request
    # Get the current timestamp
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    response, status_code = process_received_data(data, timestamp)
    return response, status_code

#************************************************************************

# Route for graphs page
@app.route('/graphs', methods=['GET'])
def graphs():
    return render_template(
        'graphs.html',
        sender_id=sender_id,
        generated_number=generated_number
    )

# Fetches data for each graph
@app.route('/get_data/<sender_id>',methods=['GET'])
def get_data(sender_id):
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 15)

        app.logger.info(f"Fetching data for sender ID: {sender_id} with limit: {limit}, start_date: {start_date}, end_date: {end_date}")

        if start_date and end_date:
            cursor.execute(
                "SELECT generated_number, timestamp FROM data WHERE sender_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp",
                (sender_id, start_date, end_date)
            )
        else:
            cursor.execute(
                "SELECT generated_number, timestamp FROM data WHERE sender_id = ? ORDER BY timestamp DESC LIMIT ?",
                (sender_id, limit)
            )

        rows = cursor.fetchall()
        conn.close()
        data = {
            'timestamp': [row['timestamp'] for row in rows],
            'generated_number': [row['generated_number'] for row in rows]
        }
        return jsonify(data)
    except Exception as e:
        app.logger.error(f"Error fetching data for sender ID {sender_id}: {e}")
        return str(e), 500


# Fetches unique Sender IDs from the database
@app.route('/get_sender_ids', methods=['GET'])
def get_sender_ids():
    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT sender_id FROM data")
        sender_ids = alphanumeric_sort([row[0] for row in cursor.fetchall()])
        conn.close()
        return jsonify(sender_ids)
    except Exception as e:
        app.logger.error(f"Error fetching sender IDs: {e}")
        return str(e), 500

#************************************************************************

# Route to render the initial table page
@app.route('/data_table', methods=['GET'])
def data_table():
    sender_id = request.args.get('sender_id', None)
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 20))

    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if sender_id:
            cursor.execute(
                "SELECT sender_id, generated_number, timestamp FROM data WHERE sender_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?", 
                (sender_id, limit, offset)
            )
        else:
            cursor.execute(
                "SELECT sender_id, generated_number, timestamp FROM data ORDER BY timestamp DESC LIMIT ? OFFSET ?", 
                (limit, offset)
            )

        rows = cursor.fetchall()
        conn.close()

        data = [{'sender_id': row[0], 'generated_number': row[1], 'timestamp': row[2]} for row in rows]
        return render_template('data_table.html', data=data)
    except Exception as e:
        return str(e), 500

# Route to fetch data in chunks
@app.route('/fetch_data', methods=['GET'])
def fetch_data():
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 20))

    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT sender_id, generated_number, timestamp FROM data ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = cursor.fetchall()
        conn.close()

        data = [{'sender_id': row['sender_id'], 'generated_number': row['generated_number'], 'timestamp': row['timestamp']} for row in rows]
        return jsonify(data)
    except Exception as e:
        return str(e), 500

@app.route('/filter_data', methods=['GET'])
def filter_data():
    sender_id = request.args.get('sender_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = 'SELECT sender_id, generated_number, timestamp FROM data WHERE 1=1'
    params = []

    if sender_id:
        query += " AND sender_id = ?"
        params.append(sender_id)

    if start_date:
        if start_date == end_date:
            # If start date and end date are the same, filter for that entire day
            query += " AND DATE(timestamp) = ?"
            params.append(start_date)
        else:
            # Otherwise, filter between start and end dates
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date)
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date)

    query += " ORDER BY timestamp DESC"

    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        data = conn.execute(query, params).fetchall()
        conn.close()

        results = [
            {
                "sender_id": row["sender_id"],
                "generated_number": row["generated_number"],
                "timestamp": row["timestamp"]
            } for row in data
        ]

        return jsonify(results)
    except Exception as e:
        return str(e), 500

def get_db_connection():
    conn = sqlite3.connect('app/db/data.db')
    return conn