const express = require('express')
const Order = require('../models/Order')
const { protect, admin } = require('../middleware/authMiddleware')
const router = express.Router()
// @route GET /api/admin/orders. Get all orders (Admin only). Access - Private
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email')
    res.json(orders)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'server error' })
  }
})
// @route PUT /api/admin/orders/:id. Update order status (Admin only). Access - Private
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (order) {
      order.status = req.body.status || order.status
      order.isDelivered =
        req.body.status === 'Delivered' ? true : order.isDelivered
      order.deliveredAt =
        req.body.status === 'Delivered' ? Date.now() : order.deliveredAt
      const updatedOrder = await order.save()
      res.json({ message: 'order updated successfully', order: updatedOrder })
    } else {
      res.status(404).json({ message: 'order not found' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'server error' })
  }
})
// @route DELETE /api/admin/orders/:id. Delete an order (Admin only). Access - Private
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (order) {
      await order.deleteOne()
      res.json({ message: 'order deleted successfully' })
    } else {
      res.status(404).json({ message: 'order not found' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'server error' })
  }
})
module.exports = router
