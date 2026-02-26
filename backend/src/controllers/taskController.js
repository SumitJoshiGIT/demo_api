const Task = require("../models/Task");
const ApiError = require("../utils/apiError");
const { getCache, setCache, delCacheByPattern } = require("../utils/cache");

const buildFilters = (req) => {
  const filters = {};

  if (req.user.role !== "admin") {
    filters.owner = req.user._id;
  }

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.search) {
    filters.title = { $regex: req.query.search, $options: "i" };
  }

  return filters;
};

const getTasks = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req);
    const cacheKey = `tasks:${req.user.role}:${req.user._id}:${JSON.stringify(req.query)}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, source: "cache", ...cached });
    }

    const [tasks, total] = await Promise.all([
      Task.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments(filters),
    ]);

    const payload = {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await setCache(cacheKey, payload, 120);

    res.json({ success: true, source: "db", ...payload });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (req.user.role !== "admin" && task.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only access your own tasks");
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      owner: req.user._id,
    });

    await delCacheByPattern("tasks:*");

    res.status(201).json({
      success: true,
      message: "Task created",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (req.user.role !== "admin" && task.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only update your own tasks");
    }

    const fields = ["title", "description", "status"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    await delCacheByPattern("tasks:*");

    res.json({
      success: true,
      message: "Task updated",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (req.user.role !== "admin" && task.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only delete your own tasks");
    }

    await task.deleteOne();
    await delCacheByPattern("tasks:*");

    res.json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
