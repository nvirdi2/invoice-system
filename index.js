import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default database structure
const defaultData = {
  customers: [],
  invoices: []
};

// Initialize Express
const app = express();
const port = 3000;

// Setup LowDB
const adapter = new JSONFile("db.json");
const db = new Low(adapter, defaultData);
await db.read();
db.data ||= defaultData;
await db.write();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve index.html etc.

// Root Route
app.get("/", (req, res) => res.send("Billing API Running 🚀"));

// Add Customer
app.post("/customers", (req, res) => {
  const {
    name,
    address,
    postalCode,
    phoneNumber,
    carMake,
    licensePlate,
    vin,
    engine,
    email
  } = req.body;

  const customer = {
    id: uuidv4(),
    name,
    address,
    postalCode,
    phoneNumber,
    carMake,
    licensePlate,
    vin,
    engine,
    email
  };

  db.data.customers.push(customer);
  db.write();
  res.status(201).json(customer);
});

// Get all customers
app.get("/customers", (req, res) => {
  res.json(db.data.customers);
});

// Add Invoice (lookup by license plate)
app.post("/invoices", (req, res) => {
  const { licensePlate, services } = req.body;

  const customer = db.data.customers.find(
    (c) => c.licensePlate === licensePlate
  );

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const total = services.reduce((sum, s) => sum + s.cost, 0);

  const invoice = {
    id: uuidv4(),
    customerId: customer.id,
    licensePlate,
    date: new Date().toISOString(),
    services, // example: [{ description: "Brake Pad Replacement", cost: 120 }]
    total
  };

  db.data.invoices.push(invoice);
  db.write();
  res.status(201).json(invoice);
});

// Get all invoices
app.get("/invoices", (req, res) => {
  res.json(db.data.invoices);
});

// Get invoices by license plate
app.get("/invoices/:licensePlate", (req, res) => {
  const plate = req.params.licensePlate;
  const invoices = db.data.invoices.filter(
    (i) => i.licensePlate === plate
  );
  res.json(invoices);
});

// Start the server
app.listen(port, () => {
  console.log(`Billing app listening at http://localhost:${port}`);
});
