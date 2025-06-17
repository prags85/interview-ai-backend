const Session = require("../models/Session");
const Question = require("../models/Question");

// @desc   Create a new session and linked questions
// @route  POST /api/sessions/create
// @access Private
exports.createSession = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, description, questions } = req.body;
    const userId = req.user._id;

    if (!role || !experience || !topicsToFocus || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or questions not provided as array",
      });
    }

    const session = await Session.create({
      user: userId,
      role,
      experience,
      topicsToFocus,
      description,
    });

    const questionDocs = await Promise.all(
      questions.map(async (q) => {
        const question = await Question.create({
          session: session._id,
          question: q.question,
          answer: q.answer,
        });
        return question._id;
      })
    );

    session.questions = questionDocs;
    await session.save();

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("Create Session Error:", error.message);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      success: false,
    });
  }
};

// @desc   Get all sessions for the logged-in user
// @route  GET /api/sessions/my-sessions
// @access Private
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("questions");

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

// @desc   Get session by ID with populated questions
// @route  GET /api/sessions/:id
// @access Private
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({
        path: "questions",
        options: { sort: { isPinned: -1, createdAt: -1 } },
      });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Optionally check if session belongs to logged-in user
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

// @desc   Delete a session and its questions
// @route  DELETE /api/sessions/:id
// @access Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this session",
      });
    }

    await Question.deleteMany({ session: session._id });
    await session.deleteOne();

    res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};
