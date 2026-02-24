const express = require('express');
const userController = require('../controllers/UserController');

const router = express.Router();

router.get('/', (req, res) => userController.listUsers(req, res));
router.post('/', (req, res) => userController.createUser(req, res));
router.delete('/:userId', (req, res) => userController.deleteUser(req, res));
router.post('/:userId/friends', (req, res) => userController.addFriend(req, res));
router.get('/:userId', (req, res) => userController.getUserProfile(req, res));
router.get('/:userId/recommendations', (req, res) => userController.getRecommendations(req, res));

module.exports = router;
