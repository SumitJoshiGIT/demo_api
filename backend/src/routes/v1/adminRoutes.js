const express = require("express");
const User = require("../../models/User");
const Task = require("../../models/Task");
const { protect } = require("../../middlewares/authMiddleware");
const { authorizeRoles } = require("../../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get basic platform stats (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Stats response }
 */
router.get("/stats", protect, authorizeRoles("admin"), async (_req, res, next) => {
  try {
    const [users, admins, tasks] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "admin" }),
      Task.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: { users, admins, tasks },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
