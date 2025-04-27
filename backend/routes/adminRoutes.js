const express = require('express')
const User = require('../models/User')
const { protect, admin } = require('../middleware/authMiddleware')
const router = express.Router()
// @route GET /api/admin/users. Get all users (Admin only). Access - Private
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({})
    res.json(users)
  } catch (error) {
    console.log(error)
    res.status(500).send('server error')
  }
})
// @route POST /api/admin/users. Add a new user. (Admin only). Access - Private
router.post('/', protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: 'User already exists' })
    }
    user = new User({
      name,
      email,
      password,
      role: role || 'customer'
    })
    await user.save()
    res.status(201).json({ message: 'user created successfully', user })
  } catch (error) {
    console.log(error)
    res.status(500).send('server error')
  }
})
// @route PUT /api/admin/users/:id. Update user information->name,email,role. (Admin only). Access - Private
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email
      user.role = req.body.role || user.role
    }
    const updatedUser = await user.save()
    res.json({ message: 'user updated successfully', user: updatedUser })
  } catch (error) {
    console.log(error)
    res.status(500).send('server error')
  }
})
// @route DELETE /api/admin/users/:id.Delete a user. (Admin only). Access - Private
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if(user){
        await user.deleteOne()
        res.json({message:'user deleted succesfully'})
    }else{
        res.status(404).json({message:'user not found'})
    }
  } catch (error) {
    console.log(error)
    res.status(500).send('server error')
  }
})
module.exports = router
