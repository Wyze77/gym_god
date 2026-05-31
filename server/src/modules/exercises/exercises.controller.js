import asyncHandler from '../../utils/asyncHandler.js';
import * as exercisesService from './exercises.service.js';

export const list = asyncHandler(async (req, res) => {
  const exercises = await exercisesService.list(req.user.id, req.query);
  res.status(200).json({ exercises });
});

export const getOne = asyncHandler(async (req, res) => {
  const exercise = await exercisesService.getById(req.user.id, Number(req.params.id));
  res.status(200).json({ exercise });
});

export const create = asyncHandler(async (req, res) => {
  const exercise = await exercisesService.create(req.user.id, req.body);
  res.status(201).json({ exercise });
});
