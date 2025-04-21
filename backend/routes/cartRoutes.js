const express = require('express')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const { protect } = require('../middleware/authMiddleware')
const router = express.Router()
// helper function to get a cart by userId or guestId
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId })
  } else if (guestId) {
    return await Cart.findOne({ guestId })
  }
  return null
}
// POST /api/cart. Adding product to the cart for a quest or logged in user. Access - Public
router.post('/', async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body
  try {
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product Not Found.' })
    // determine if the user is logged in or quest
    let cart = await getCart(userId, guestId)
    // if cart exists -> update it
    if (cart) {
      const productIndex = cart.products.findIndex(
        p =>
          p.productId.toString() === productId &&
          p.size === size &&
          p.color === color
      )
      if (productIndex > -1) {
        // if the product already exists -> update the quaintity
        cart.products[productIndex].quantity += quantity
      } else {
        // adding new product
        cart.products.push({
          productId,
          name: product.name,
          image: product.images[0].url,
          price: product.price,
          size,
          color,
          quantity
        })
      }
      // recalculate the total price
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      )
      await cart.save()
      return res.status(200).json(cart)
    } else {
      // create a new cart for a quest or user
      const newCart = await Cart.create({
        user: userId ? userId : undefined,
        guestId: guestId ? guestId : 'guest_' + new Date().getTime(),
        products: [
          {
            productId,
            name: product.name,
            image: product.images[0].url,
            price: product.price,
            size,
            color,
            quantity
          }
        ],
        totalPrice: product.price * quantity
      })
      return res.status(201).json(newCart)
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})
// PUT /api/cart. Updating product quantity in the cart for a quest or logged in user. Access - Public
router.put('/', async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body
  try {
    let cart = await getCart(userId, guestId)
    if (!cart) return res.status(404).json({ message: 'Cart not Found.' })
    const productIndex = cart.products.findIndex(
      p =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    )
    if (productIndex > -1) {
      // updating product
      if (quantity > 0) {
        cart.products[productIndex].quantity = quantity
      } else {
        cart.products.splice(productIndex, 1) // removing product if quantity is 0
      }
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      )
      await cart.save()
      return res.status(200).json(cart)
    } else {
      return res
        .status(404)
        .json({ message: 'Product not found in this cart.' })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server Error' })
  }
})
// DELETE /api/cart. Deleting product from the cart. Access - Public
router.delete('/', async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body
  try {
    let cart = await getCart(userId, guestId)
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' })
    }
    const productIndex = cart.products.findIndex(
      p =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    )
    if (productIndex > -1) {
      cart.products.splice(productIndex, 1)
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      )
      await cart.save()
      res.status(200).json({ message: 'Product removed.', cart })
    } else {
      return res
        .status(404)
        .json({ message: 'Product not found in this cart.' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})
// GET /api/cart. Getting logged-in or guest users cart. Access - Public
router.get('/', async (req, res) => {
  const { userId, guestId } = req.query
  try {
    if (!userId && !guestId) {
      return res.status(400).json({ message: 'userId or guestId needed' })
    }
    const cart = await getCart(userId, guestId)
    if (cart) {
      res.json(cart)
    } else {
      res.status(404).json({ message: 'Cart not found' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})
// POST /api/cart/merge. Merge guest cart into user Cart on login. Access - Private (middleware protect needed)
router.post('/merge', protect, async (req, res) => {
  const { guestId } = req.body
  try {
    // Find guest and user cart
    const userCart = await Cart.findOne({ user: req.user._id })
    const guestCart = await Cart.findOne({ guestId })
    if (guestCart) {
      if (guestCart.products.length === 0) {
        return res.status(400).json({ message: 'Guest cart is empty' })
      }
      if (userCart) {
        // merge guest cart into user cart
        guestCart.products.forEach(guestItem => {
          const existingIndex = userCart.products.findIndex(
            item =>
              item.productId.toString() === guestItem.productId.toString() &&
              item.size === guestItem.size &&
              item.color === guestItem.color
          )
          if (existingIndex > -1) {
            // if the items are in the user cart -> updating quantity
            userCart.products[existingIndex].quantity += guestItem.quantity
          } else {
            // otherwise adding the guest items to the cart
            userCart.products.push(guestItem)
          }
        })
        userCart.totalPrice = userCart.products.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        )
        await userCart.save()
        // remove the guest cart after merging
        try {
          await Cart.findOneAndDelete({ guestId })
        } catch (error) {
          console.error('error deleting guest cart: ', error)
        }
        res.status(200).json(userCart)
      } else {
        // if user has no cart assign the guest cart to the user
        guestCart.user = req.user._id
        guestCart.guestId = undefined
        await guestCart.save()
        res.status(200).json(guestCart)
      }
    } else {
      if (userCart) {
        // guest cart has been already merged, return user cart.
        return res.status(200).json(userCart)
      }
      res.status(404).json({ message: 'Guest cart not found' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server Error' })
  }
})
module.exports = router
