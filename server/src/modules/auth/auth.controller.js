import asyncHandler from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getById(req.user.id);
  res.status(200).json({ user });
});
