function updateTable(tbl, rows) {
    tbl.innerHTML = '';
    if (rows && rows.length > 0) {
        let headers = Object.keys(rows[0]);

        let header = tbl.createTHead();
        let body = tbl.createTBody();
        let hRow = header.insertRow();
        headers.forEach(hd => {
            let hCell = hRow.insertCell();
            hCell.innerText = hd;
        });

        rows.forEach(rowDt => {
            let row = body.insertRow();
            headers.forEach(hd => {
                let cell = row.insertCell();
                let text = rowDt[hd];
                if (hd === COL_DEVICE_ACTION) {
                    cell.style.color = deviceActionColors[text];
                } else if (hd === COL_SOURCE_ADDRESS || hd === COL_DESTINATION_ADDRESS) {
                    cell.style.color = nodeColor({id: text});
                } else if (hd === COL_END_TIME) {
                    text = d3.timeFormat("%b %d %Y %H:%M:%S")(text);
                }
                cell.innerHTML = text;
            });
        });
    }

}

function filterByColumnsAnd(theTbl, columns, values, data) {
    let filteredData = data.filter(row => {
        for (let i = 0; i < columns.length; i++) {
            let clm = columns[i];
            if (row[clm] !== values[i]) {
                return false;
            }
        }
        return true;
    });
    updateTable(theTbl, filteredData);
}

function filterByColumnsOr(theTbl, columns, values, data) {
    let filteredData = data.filter(row => {
        for (let i = 0; i < columns.length; i++) {
            let clm = columns[i];
            if (values.indexOf(row[clm]) >= 0) {
                return true;
            }
        }
    });

    updateTable(theTbl, filteredData);
}
