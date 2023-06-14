import { Grid, html } from "gridjs";

function initGrid(data) {
  const dataSource = data.slice(0, 100);
  console.log(dataSource[0]);

  new Grid({
    //https://gridjs.io/docs/config/style
    // https://gridjs.io/docs/examples/css-style
    style: {
      table: {
        border: "3px solid #ccc",
        width: "100%"
      },
      th: {
        "background-color": "rgba(0, 0, 0, 0.1)",
        color: "#000",
        "border-bottom": "3px solid #ccc",
        "text-align": "center"
      },
      td: {
        "text-align": "center"
      }
    },
    columns: [
      {
        id: "year", // id's here map to keys in your JSON data
        name: "Year"
      },
      {
        id: "cluster",
        name: "Cluser "
      },
      {
        id: "nameOfProject",
        name: "Project Name",
        // https://gridjs.io/docs/examples/cell-formatting
        formatter: (cell, row) => {
          console.log("Row Arr: ", row)
          console.log("Row Data: ", row.cells[0].data)
          
          if (cell === undefined) {
            return html(`<span class="my-calss">N/A</span>`);
          }

          return html(`<span class="my-class">${cell}</span>`);
        }
      }
    ],
    data: dataSource
  }).render(document.querySelector("#my-grid"));
}

fetch("https://harikar-reports-api.cyclic.app/v3/data/years")
  .then((res) => res.json())
  .then(initGrid)
  .catch((e) => console.log("Whoops...: ", e));
