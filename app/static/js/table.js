document.addEventListener('DOMContentLoaded', (event) => {
    let offset = 0;
    const limit = 20;
    let isLoading = false;
    let filtersApplied = false;

    // Table page filter button handler
    $('#filter-button').click(function() {
        const senderId = $('#sender-id-dropdown').val();
        const startDate = $('#start-date').val();
        const endDate = $('#end-date').val();

        filtersApplied = !!senderId || !!startDate || !!endDate;

        $.ajax({
            url: '/filter_data',
            method: 'GET',
            data: {
                sender_id: senderId,
                start_date: startDate,
                end_date: endDate
            },
            success: function(data) {
                const tableBody = $('#data-table-body');
                tableBody.empty();

                data.forEach(row => {
                    const tableRow = `<tr>
                        <td>${row.sender_id}</td>
                        <td>${row.generated_number}</td>
                        <td>${row.timestamp}</td>
                    </tr>`;
                    tableBody.append(tableRow);
                });
            },
            error: function(error) {
                console.error('Error fetching data:', error);
            }
        });
    });

    // Implement lazy loading for the table
    function loadMoreData() {
        if (!isLoading && !filtersApplied) {
            isLoading = true;
            setTimeout(() => {
                $.ajax({
                    url: '/fetch_data',
                    method: 'GET',
                    data: {
                        offset: offset,
                        limit: limit
                    },
                    success: function(data) {
                        const tableBody = $('#data-table-body');
                        data.forEach(row => {
                            const tableRow = `<tr>
                                <td>${row.sender_id}</td>
                                <td>${row.generated_number}</td>
                                <td>${row.timestamp}</td>
                            </tr>`;
                            tableBody.append(tableRow);
                        });
                        offset += limit;
                        isLoading = false;
                    },
                    error: function(error) {
                        console.error('Error fetching data:', error);
                        isLoading = false;
                    }
                });
            }, 500); // Delay of 500 milliseconds before loading more data
        }
    }

    function areFiltersApplied() {
        const senderId = $('#sender-id-dropdown').val();
        const startDate = $('#start-date').val();
        const endDate = $('#end-date').val();
        return senderId || startDate || endDate;
    }

    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
            if (!areFiltersApplied()) {
                loadMoreData();
            }
        }
    });

    // Initial data load for the table
    loadMoreData();

    // Check if filters are applied on page load
    filtersApplied = areFiltersApplied();

    // Fetch sender IDs dynamically and populate dropdown
    fetch('/get_sender_ids')
        .then(response => response.json())
        .then(senderIds => {
            const dropdown = document.getElementById('sender-id-dropdown');
            if (dropdown) {
                senderIds.forEach(senderId => {
                    const option = document.createElement('option');
                    option.value = senderId;
                    option.text = senderId;
                    dropdown.appendChild(option);
                });

                // Set the dropdown value if sender_id is present in URL
                const urlParams = new URLSearchParams(window.location.search);
                const senderIdParam = urlParams.get('sender_id');
                if (senderIdParam) {
                    $('#sender-id-dropdown').val(senderIdParam);
                }
            }
        });
});
