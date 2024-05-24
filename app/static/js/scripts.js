document.addEventListener('DOMContentLoaded', (event) => {
    var socket = io();

    socket.on('update_data', function(data) {
        document.getElementById('sender-id').innerText = `Sender ID: ${data.sender_id}`;
        document.getElementById('generated-number').innerText = `Generated Number: ${data.generated_number}`;
    });
});