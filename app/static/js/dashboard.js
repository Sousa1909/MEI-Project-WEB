document.addEventListener('DOMContentLoaded', (event) => {
    var socket = io();

    const cardsContainer = document.getElementById('cards-container');

    // Function to create a card
    function createCard(senderId, generatedNumber, timestamp) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-sm-6';
        colDiv.id = `card-${senderId}`;

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.innerText = `Sender ID: ${senderId}`;

        const cardText = document.createElement('p');
        cardText.className = 'card-text';
        cardText.innerText = `Generated Number: ${generatedNumber}\nTimestamp: ${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}`;

        const cardButton = document.createElement('a');
        cardButton.href = `/data_table?sender_id=${senderId}`;
        cardButton.className = 'btn btn-primary';
        cardButton.innerText = 'Filter Data';

        cardBodyDiv.appendChild(cardTitle);
        cardBodyDiv.appendChild(cardText);
        cardBodyDiv.appendChild(cardButton);
        cardDiv.appendChild(cardBodyDiv);
        colDiv.appendChild(cardDiv);

        cardsContainer.appendChild(colDiv);
    }

    // Function to sort and render cards
    function sortAndRenderCards(data) {
        data.sort((a, b) => a.sender_id.localeCompare(b.sender_id));
        data.forEach(item => {
            createCard(item.sender_id, item.generated_number, item.timestamp);
        });
    }

    // Fetch initial data and create cards
    fetch('/get_latest_data')
        .then(response => response.json())
        .then(data => {
            sortAndRenderCards(data);
        });

    // Handle real-time updates
    socket.on('update_data', function(data) {
        const { sender_id, generated_number, timestamp } = data;
        const card = document.getElementById(`card-${sender_id}`);

        if (card) {
            // Update existing card
            card.querySelector('.card-text').innerText = `Generated Number: ${generated_number}\nTimestamp: ${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}`;
        } else {
            // Create new card
            createCard(sender_id, generated_number, timestamp);
        }
    });
});
