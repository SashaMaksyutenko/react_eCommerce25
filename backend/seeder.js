const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Product = require('./models/Product')
const User = require('./models/User')
const Cart = require('./models/Cart')
const products = require('./data/products')
dotenv.config()
// conect to MongoDB
mongoose.connect(process.env.MONGO_URI)
// function to seed data
const seedData = async () => {
  try {
    // clear existing data
    await Product.deleteMany()
    await User.deleteMany()
    await Cart.deleteMany()
    // create a default admin user
    const createdUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: '123456789',
      role: 'admin'
    })
    // assign the default user iD to each product
    const userId = createdUser._id
    const sampleProducts = products.map(product => {
      return { ...product, user:userId }
    })
    // insert products to the database
    await Product.insertMany(sampleProducts)
    console.log('product data seeded successfully')
    process.exit()
  } catch (error) {
    console.error('error seeding the data:',error)
    process.exit(1)
  }
}
seedData()