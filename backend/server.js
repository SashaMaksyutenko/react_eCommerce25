const express = require('express')
const cors = require('cors')
const app = express()
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const productRoutes = require('./routes/productRoutes')
const cartRoutes = require('./routes/cartRoutes')
const checkoutRoutes = require('./routes/checkoutRoutes')
const orderRoutes = require('./routes/orderRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const suscriberRoutes = require('./routes/subscriberRoute')
const adminRoutes = require('./routes/adminRoutes')
const productAdminRoutes = require('./routes/productAdminRoutes')
const adminOrderRoutes = require('./routes/adminOrderRoutes')
app.use(express.json())
app.use(cors(
  {
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
  }
))
dotenv.config()
const PORT = process.env.PORT || 3000
// connection to MongoDB
connectDB().catch(error => {
  console.error('MongoDB Connection Error:', error)
  process.exit(1)
})
app.get('/', (req, res) => {
  res.send('welcome to RABBIT API')
})
// API routes
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api', suscriberRoutes)
// Admin
app.use('/api/admin/users', adminRoutes)
app.use('/api/admin/products', productAdminRoutes)
app.use('/api/admin/orders', adminOrderRoutes)
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(500).json({ message: 'Internal Server Error' })
})
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`)
})
