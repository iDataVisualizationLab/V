function updateTable(tbl, rows, colorColumns, colors, formatColums, formats) {
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
                if (colorColumns) {
                    let idx = colorColumns.indexOf(hd);
                    if (idx >= 0) {
                        cell.style.color = colors[idx](text);
                    }
                }
                if (formatColums) {
                    let idx = formatColums.indexOf(hd);
                    if (idx >= 0) {
                        text = formats[idx](text);
                    }
                }
                cell.innerHTML = text;
            });
        });
    }
}

function filterByColumnsOr(theTbl, columns, values, data, colorColumns, colors, formatColumns, formats) {
    let filteredData = data.filter(row => {
        for (let i = 0; i < columns.length; i++) {
            let clm = columns[i];
            if (values.indexOf(row[clm]) >= 0) {
                return true;
            }
        }
    });

    updateTable(theTbl, filteredData, colorColumns, colors, formatColumns, formats);
}
