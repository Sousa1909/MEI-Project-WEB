from flask import render_template, request
from app import app
from app.handler import process_received_data

# Global variables to store received data
sender_id = None
generated_number = None

@app.route('/receive_data', methods=['POST'])
def receive_data():
    data = request.json  # Parse JSON data from the request
    response, status_code = process_received_data(data)
    return response, status_code

@app.route('/')
def index():
    return render_template(
        'index.html',
        sender_id=sender_id,
        generated_number=generated_number
    )