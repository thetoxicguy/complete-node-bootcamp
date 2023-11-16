const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

/*
This endpoint remains separate from the API architecture.
The reason
*/
router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
