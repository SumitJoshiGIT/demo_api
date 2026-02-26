const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../../controllers/taskController");
const { protect } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");

const router = express.Router();

router.use(protect);

const taskBaseValidation = [
  body("title")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Title must be between 2 and 120 chars"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description max length is 1000"),
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid status"),
];

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks (users see own, admin sees all)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task list }
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["todo", "in-progress", "done"]),
  ],
  validate,
  getTasks
);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task detail }
 */
router.get("/:id", [param("id").isMongoId()], validate, getTaskById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *     responses:
 *       201: { description: Task created }
 */
router.post(
  "/",
  [body("title").trim().notEmpty().withMessage("Title is required"), ...taskBaseValidation],
  validate,
  createTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update task
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Task updated }
 */
router.put("/:id", [param("id").isMongoId(), ...taskBaseValidation], validate, updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete task
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Task deleted }
 */
router.delete("/:id", [param("id").isMongoId()], validate, deleteTask);

module.exports = router;
