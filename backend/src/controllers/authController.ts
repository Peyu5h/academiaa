import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { loginSchema, registerSchema } from "../utils/Validation.js";

export const register = async (req, res) => {
  try {
    const validatedCredentials = await registerSchema.validate(req.body);

    const { name, email, password, classNumber } = validatedCredentials;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const classExists = await prisma.class.findUnique({
      where: { classNumber: classNumber },
    });

    if (!classExists) {
      return res.status(400).json({ error: "Class not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        classId: classExists.id,
      },
      include: {
        class: {
          include: {
            courses: true,
          },
        },
        notifications: true,
        assignments: true,
        votedPolls: true,
        createdPolls: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "10y",
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "success",
      token,
      user: {
        ...userWithoutPassword,
        courseId: user.class.courses[0]?.id,
        googleClassroomId: user.class.courses[0]?.googleClassroomId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "failed", message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const validatedCredentials = await loginSchema.validate(req.body);

    const { email, password } = validatedCredentials;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        class: {
          include: {
            courses: true,
          },
        },
        notifications: true,
        assignments: true,
        votedPolls: true,
        createdPolls: true,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "10y",
    });

    res.status(200).json({
      message: "success",
      token,
      user: {
        ...userWithoutPassword,
        courseId: user.class.courses[0]?.id,
        googleClassroomId: user.class.courses[0]?.googleClassroomId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "failed", message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        class: true,
        notifications: true,
        assignments: true,
        votedPolls: true,
        createdPolls: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrog" });
  }
};
