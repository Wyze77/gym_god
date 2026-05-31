import asyncHandler from '../../utils/asyncHandler.js';
import * as usersService from './users.service.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user.id, req.body);
  res.status(200).json({ user });
});

export const getBodyMetrics = asyncHandler(async (req, res) => {
  const metrics = await usersService.listBodyMetrics(req.user.id);
  res.status(200).json({ metrics });
});

export const addBodyMetric = asyncHandler(async (req, res) => {
  const metric = await usersService.addBodyMetric(req.user.id, req.body);
  res.status(201).json({ metric });
});
