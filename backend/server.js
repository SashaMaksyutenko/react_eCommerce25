const express = require('express')
const cors = require('cors')
const app = express()
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const productRoutes = require('./routes/productRoutes')
app.use(express.json())
app.use(cors())
dotenv.config()
const PORT = process.env.PORT || 3000
// connection to MongoDB
connectDB()
app.get('/', (req, res) => {
  res.send('welcome to RABBIT API')
})
// API routes
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`)
})
