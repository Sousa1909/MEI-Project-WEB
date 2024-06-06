document.addEventListener('DOMContentLoaded', (event) => {
    var socket = io();
    const charts = {};

    function createChart(senderId, data) {
        const graphContainer = document.getElementById('graphs-container');
        if (graphContainer) {
            const canvas = document.createElement('canvas');
            canvas.id = `chart-${senderId}`;
            graphContainer.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            charts[senderId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.timestamp.map(t => moment(t).toDate()),
                    datasets: [{
                        label: senderId,
                        data: data.generated_number,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'minute'
                            }
                        }
                    }
                }
            });
            console.log(`Chart created for sender ID ${senderId}:`, charts[senderId]);
        } else {
            console.error('Graph container not found');
        }
    }

    function updateChart(senderId, data) {
        const chart = charts[senderId];
        if (chart) {
            const sortedData = data.timestamp.map((timestamp, index) => ({
                timestamp: moment(timestamp).toDate(),
                value: data.generated_number[index]
            })).sort((a, b) => a.timestamp - b.timestamp);

            chart.data.labels = sortedData.map(d => d.timestamp);
            chart.data.datasets[0].data = sortedData.map(d => d.value);
            chart.update();
            console.log(`Chart updated for sender ID ${senderId}:`, chart);
        } else {
            console.error(`Chart not found for sender ID ${senderId}`);
        }
    }

    fetch('/get_sender_ids')
    .then(response => response.json())
    .then(senderIds => {
            senderIds.forEach(senderId => {
                fetch(`/get_data/${senderId}?limit=15`)
                .then(response => response.json())
                .then(data => {
                    console.log(`Data for sender ID ${senderId}:`, data);
                    if (data.timestamp && data.generated_number) {
                        createChart(senderId, data);
                    } else {
                        console.error(`Invalid data structure for sender ID ${senderId}:`, data);
                    }
                })
                .catch(error => {
                    console.error(`Error fetching data for sender ID ${senderId}:`, error);
                });
        });
    })
    .catch(error => {
        console.error('Error fetching sender IDs:', error);
    });

    socket.on('update_data', function(data) {
        const { sender_id, generated_number, timestamp } = data;
        const chart = charts[sender_id];

        if (chart) {
            const labels = chart.data.labels;
            const dataPoints = chart.data.datasets[0].data;

            labels.push(moment(timestamp).toDate());
            dataPoints.push(generated_number);

            if (labels.length > 15) {
                labels.shift();
                dataPoints.shift();
            }

            const sortedData = labels.map((label, index) => ({
                timestamp: label,
                value: dataPoints[index]
            })).sort((a, b) => a.timestamp - b.timestamp);

            chart.data.labels = sortedData.map(d => d.timestamp);
            chart.data.datasets[0].data = sortedData.map(d => d.value);

            chart.update();
            console.log(`Real-time update for sender ID ${sender_id}:`, chart);
        } else {
            console.error(`Chart not found for real-time update with sender ID ${sender_id}`);
        }
    });

    document.getElementById('filter-button').addEventListener('click', () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (startDate && endDate) {
            fetch('/get_sender_ids')
                .then(response => response.json())
                .then(senderIds => {
                    senderIds.forEach(senderId => {
                        fetch(`/get_data/${senderId}?start_date=${startDate}&end_date=${endDate}`)
                            .then(response => response.json())
                            .then(data => {
                                console.log(`Filtered data for sender ID ${senderId}:`, data);
                                if (data.timestamp && data.generated_number) {
                                    if (charts[senderId]) {
                                        updateChart(senderId, data);
                                    } else {
                                        createChart(senderId, data);
                                    }
                                } else {
                                    console.error(`Invalid filtered data structure for sender ID ${senderId}:`, data);
                                }
                            })
                            .catch(error => {
                                console.error(`Error fetching filtered data for sender ID ${senderId}:`, error);
                            });
                    });
                })
                .catch(error => {
                    console.error('Error fetching sender IDs:', error);
                });
        } else {
            alert('Please select both start and end dates.');
        }
    });
});
