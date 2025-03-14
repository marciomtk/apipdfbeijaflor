const express = require("express");
const cors = require("cors"); 
const app = express();
const pedido = require("./routes/pedido");
const dotenv = require('dotenv');

dotenv.config();
const port = process.env.PORT;

app.use(express.json());

// Habilitando o CORS
app.use(cors());



app.use(
  express.urlencoded({
    extended: true
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/homepage.html');
});

app.use("/pedido", pedido);



/* Error handler middleware 00 */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});
app.listen(port, () => {
  console.log(`Api Iniciada http://localhost:${port}`);
});
