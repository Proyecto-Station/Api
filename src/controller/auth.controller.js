import jwt from 'jsonwebtoken'

import User from '../models/User'
import Role from '../models/Role'

import '../config'

export const singUp = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body

    const newUser = new User({
      username,
      email,
      password: await User.encryptPassword(password)
    })

    if (req.body.roles) {
      const foundRoles = await Role.find({ name: { $in: roles } })
      newUser.roles = foundRoles.map((role) => role._id)
    } else {
      const role = await Role.findOne({ name: 'user' })
      newUser.roles = [role._id]
    }

    const savedUser = await newUser.save()

    const token = jwt.sign({ id: savedUser._id }, process.env.SECRET, { expiresIn: 86400 })

    return res.status(200).json({ token })
  } catch (err) {
    console.log(err)
    return res.status(500).json(err)
  }
}

export const singIn = async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email }).populate('roles')

    if (!userFound) return res.status(400).json({ message: 'User not found' })

    const matchPassword = await User.comparePassword(req.body.password, userFound.password)

    if (!matchPassword) return res.status(401).json({ message: 'Invalid Password', token: null })

    const token = jwt.sign({ id: userFound._id }, process.env.SECRET, { expiresIn: 86400 })

    return res.status(200).json({ token })
  } catch (err) {
    console.log(err)
  }
}
