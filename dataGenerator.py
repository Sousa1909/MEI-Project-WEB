import requests
import random
import time

def generate_number():
    return random.randint(10, 30)

def generate_sender():
    return random.randint(1,3)

def send_data():
    sender_id = "sender_" + str(generate_sender())
    number = generate_number()
    payload = {
        'sender_id': sender_id,
        'generated_number': number
    }
    response = requests.post('http://127.0.0.1:5000/receive_data', json=payload)
    if response.status_code == 200:
        print(f"Data sent successfully: {payload}")
    else:
        print("Failed to send data")

if __name__ == '__main__':
    while True:
        send_data()
        time.sleep(30)  # Send data every 30 seconds
